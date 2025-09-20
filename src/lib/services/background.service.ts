// MonitorHub Background Processing Service
// Automated monitor evaluations and email notifications

import { db } from '$lib/database';
import { TemporalStateManager } from './temporal.service';
import { EmailService } from './email.service';
import type { Monitor } from '@prisma/client';

export interface JobResult {
	success: boolean;
	message: string;
	data?: any;
	error?: string;
}

export interface MonitorEvaluationJob {
	monitorId: string;
	userId: string;
	scheduledAt: Date;
	retryCount: number;
}

export class BackgroundJobService {
	private static jobQueue: MonitorEvaluationJob[] = [];
	private static isProcessing = false;
	private static processingInterval: NodeJS.Timeout | null = null;

	/**
	 * Start the background job processor
	 */
	static startProcessor(): void {
		if (this.processingInterval) {
			console.log('Background processor already running');
			return;
		}

		console.log('Starting background job processor...');
		
		// Process jobs every 30 seconds
		this.processingInterval = setInterval(async () => {
			await this.processJobs();
		}, 30000);

		// Initial processing
		this.processJobs();
	}

	/**
	 * Stop the background job processor
	 */
	static stopProcessor(): void {
		if (this.processingInterval) {
			clearInterval(this.processingInterval);
			this.processingInterval = null;
			console.log('Background processor stopped');
		}
	}

	/**
	 * Schedule monitor evaluation jobs based on frequency
	 */
	static async scheduleMonitorEvaluations(): Promise<void> {
		try {
			// Get all active monitors that need evaluation
			const monitors = await db.monitor.findMany({
				where: { isActive: true },
				include: {
					evaluations: {
						orderBy: { evaluatedAt: 'desc' },
						take: 1
					}
				}
			});

			const now = new Date();
			
			for (const monitor of monitors) {
				const lastEvaluation = monitor.evaluations[0];
				const frequencyMs = monitor.frequency * 60 * 1000; // Convert minutes to milliseconds
				
				// Check if monitor needs evaluation
				let needsEvaluation = false;
				
				if (!lastEvaluation) {
					// Never evaluated
					needsEvaluation = true;
				} else {
					// Check if enough time has passed since last evaluation
					const timeSinceLastEval = now.getTime() - lastEvaluation.evaluatedAt.getTime();
					needsEvaluation = timeSinceLastEval >= frequencyMs;
				}

				if (needsEvaluation) {
					await this.queueMonitorEvaluation(monitor);
				}
			}

		} catch (error) {
			console.error('Failed to schedule monitor evaluations:', error);
		}
	}

	/**
	 * Queue a monitor for evaluation
	 */
	static async queueMonitorEvaluation(monitor: Monitor): Promise<void> {
		// Check if already queued
		const alreadyQueued = this.jobQueue.find(job => job.monitorId === monitor.id);
		if (alreadyQueued) {
			return;
		}

		const job: MonitorEvaluationJob = {
			monitorId: monitor.id,
			userId: monitor.userId,
			scheduledAt: new Date(),
			retryCount: 0
		};

		this.jobQueue.push(job);
		console.log(`Queued monitor evaluation: ${monitor.name} (${monitor.id})`);
	}

	/**
	 * Process queued jobs
	 */
	static async processJobs(): Promise<void> {
		if (this.isProcessing || this.jobQueue.length === 0) {
			return;
		}

		this.isProcessing = true;
		console.log(`Processing ${this.jobQueue.length} queued jobs...`);

		// Process jobs in batches to avoid overwhelming the system
		const batchSize = 5;
		const batch = this.jobQueue.splice(0, batchSize);

		const results = await Promise.allSettled(
			batch.map(job => this.processMonitorEvaluationJob(job))
		);

		// Handle failed jobs
		results.forEach((result, index) => {
			if (result.status === 'rejected') {
				const job = batch[index];
				console.error(`Job failed for monitor ${job.monitorId}:`, result.reason);
				
				// Retry failed jobs (max 3 attempts)
				if (job.retryCount < 3) {
					job.retryCount++;
					job.scheduledAt = new Date(Date.now() + (job.retryCount * 60000)); // Exponential backoff
					this.jobQueue.push(job);
					console.log(`Rescheduled job for monitor ${job.monitorId} (attempt ${job.retryCount + 1})`);
				} else {
					console.error(`Job permanently failed for monitor ${job.monitorId} after 3 attempts`);
				}
			}
		});

		// Schedule next batch of evaluations
		await this.scheduleMonitorEvaluations();

		this.isProcessing = false;
	}

	/**
	 * Process a single monitor evaluation job
	 */
	static async processMonitorEvaluationJob(job: MonitorEvaluationJob): Promise<JobResult> {
		try {
			console.log(`Evaluating monitor ${job.monitorId}...`);
			
			// Perform the evaluation using temporal logic
			const evaluationResult = await TemporalStateManager.evaluateMonitor(job.monitorId);
			
			// If evaluation triggered (result is true), send notifications
			if (evaluationResult.result) {
				await this.triggerNotifications(job.monitorId, evaluationResult);
			}

			console.log(`Monitor ${job.monitorId} evaluation completed: ${evaluationResult.result}`);
			
			return {
				success: true,
				message: `Monitor evaluation completed: ${evaluationResult.result}`,
				data: evaluationResult
			};

		} catch (error) {
			console.error(`Monitor evaluation failed for ${job.monitorId}:`, error);
			return {
				success: false,
				message: `Evaluation failed: ${error}`,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Trigger notifications when monitor condition is met
	 */
	static async triggerNotifications(monitorId: string, evaluationResult: any): Promise<void> {
		try {
			// Get monitor details for notification
			const monitor = await db.monitor.findUniqueOrThrow({
				where: { id: monitorId },
				include: {
					user: true,
					actions: true
				}
			});

			console.log(`🚨 ALERT: Monitor "${monitor.name}" triggered!`);
			console.log(`User: ${monitor.user.email}`);
			console.log(`Explanation: ${evaluationResult.explanation}`);
			console.log(`Confidence: ${(evaluationResult.confidence * 100).toFixed(1)}%`);

			// Send email notification using EmailService
			const emailResult = await EmailService.sendMonitorAlert(
				monitor.user,
				monitor,
				evaluationResult
			);

			// Create action execution record based on email result
			if (monitor.actions.length > 0) {
				for (const action of monitor.actions) {
					await db.actionExecution.create({
						data: {
							monitorActionId: action.id,
							status: emailResult.success ? 'completed' : 'failed',
							result: JSON.stringify({
								type: 'email_notification',
								recipient: monitor.user.email,
								subject: `Monitor Alert: ${monitor.name}`,
								explanation: evaluationResult.explanation,
								emailStatus: emailResult.success ? 'sent' : 'failed',
								messageId: emailResult.messageId,
								error: emailResult.error
							}),
							executedAt: new Date()
						}
					});
				}
			}

		} catch (error) {
			console.error('Failed to trigger notifications:', error);
		}
	}

	/**
	 * Get job queue status
	 */
	static getQueueStatus(): {
		queueLength: number;
		isProcessing: boolean;
		processorRunning: boolean;
	} {
		return {
			queueLength: this.jobQueue.length,
			isProcessing: this.isProcessing,
			processorRunning: this.processingInterval !== null
		};
	}

	/**
	 * Manual job queue processing (for testing)
	 */
	static async processQueueNow(): Promise<void> {
		await this.scheduleMonitorEvaluations();
		await this.processJobs();
	}

	/**
	 * Clear all jobs from queue
	 */
	static clearQueue(): void {
		this.jobQueue = [];
		console.log('Job queue cleared');
	}

	/**
	 * Get job statistics
	 */
	static async getJobStatistics(): Promise<{
		totalEvaluations: number;
		evaluationsToday: number;
		successRate: number;
		activeMonitors: number;
	}> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const [totalEvaluations, evaluationsToday, activeMonitors] = await Promise.all([
			db.monitorEvaluation.count(),
			db.monitorEvaluation.count({
				where: {
					evaluatedAt: {
						gte: today
					}
				}
			}),
			db.monitor.count({
				where: { isActive: true }
			})
		]);

		// Calculate success rate (monitors that have been evaluated at least once)
		const monitorsWithEvaluations = await db.monitor.count({
			where: {
				isActive: true,
				evaluations: {
					some: {}
				}
			}
		});

		const successRate = activeMonitors > 0 ? (monitorsWithEvaluations / activeMonitors) * 100 : 0;

		return {
			totalEvaluations,
			evaluationsToday,
			successRate,
			activeMonitors
		};
	}
}

// Auto-start the background processor when service is imported
// In production, this would be managed by the application lifecycle
BackgroundJobService.startProcessor();