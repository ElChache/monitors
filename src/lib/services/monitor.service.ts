// MonitorHub Monitor Management Service
// Complete CRUD operations for MonitorHub's core Combination Intelligence

import { db } from '$lib/database';
import { aiService } from '$lib/ai/index.js';
import { AuthService } from './auth.service';
import type { Monitor, MonitorFact, User } from '@prisma/client';
import type { ExtractedFacts, MonitorType } from '$lib/ai/types.js';

export interface CreateMonitorRequest {
	prompt: string;
	name?: string;
	frequency?: number;
}

export interface UpdateMonitorRequest {
	name?: string;
	prompt?: string;
	frequency?: number;
	isActive?: boolean;
}

export interface MonitorWithRelations extends Monitor {
	facts: MonitorFact[];
	user: User;
}

export interface MonitorListResponse {
	monitors: MonitorWithRelations[];
	total: number;
	page: number;
	limit: number;
}

export class MonitorService {
	/**
	 * Create a new monitor from natural language prompt
	 */
	static async createMonitor(userId: string, request: CreateMonitorRequest): Promise<MonitorWithRelations> {
		// Check if user can create more monitors (beta limit: 5)
		const canCreate = await AuthService.canCreateMonitor(userId);
		if (!canCreate) {
			throw new Error('Monitor limit reached. Beta users can create up to 5 monitors.');
		}

		// Extract facts from natural language prompt using AI
		let extractedFacts: ExtractedFacts;
		let monitorType: MonitorType;
		
		try {
			[extractedFacts, monitorType] = await Promise.all([
				aiService.extractFacts(request.prompt),
				aiService.classifyMonitorType(request.prompt)
			]);
		} catch (error) {
			console.error('AI processing failed:', error);
			throw new Error('Failed to process monitor prompt. Please try again.');
		}

		// Validate extracted facts
		if (!extractedFacts || !extractedFacts.facts || extractedFacts.facts.length === 0) {
			throw new Error('No monitorable facts found in prompt. Please provide a more specific description.');
		}

		// Generate monitor name if not provided
		const monitorName = request.name || this.generateMonitorName(request.prompt);

		// Determine frequency (default based on type)
		const frequency = request.frequency || (monitorType.type === 'historical_change' ? 5 : 60);

		// Create monitor in database transaction
		try {
			const monitor = await db.$transaction(async (tx) => {
				// Create monitor
				const newMonitor = await tx.monitor.create({
					data: {
						userId,
						name: monitorName,
						naturalLanguagePrompt: request.prompt,
						monitorType: monitorType.type,
						evaluationFrequencyMins: frequency,
						isActive: true
					}
				});

				// Create facts 
				await Promise.all(
					extractedFacts.facts.map((fact) =>
						tx.monitorFact.create({
							data: {
								monitorId: newMonitor.id,
								factName: fact.name,
								factPrompt: fact.prompt,
								dataSourceType: fact.dataSourceType || null
							}
						})
					)
				);

				// Return monitor with relations
				return await tx.monitor.findUniqueOrThrow({
					where: { id: newMonitor.id },
					include: {
						facts: true,
						user: true
					}
				});
			});

			console.log(`Monitor created: ${monitor.name} (${monitor.monitorType}) with ${extractedFacts.facts.length} facts`);
			return monitor;

		} catch (error) {
			console.error('Database transaction failed:', error);
			throw new Error('Failed to create monitor. Please try again.');
		}
	}

	/**
	 * Get monitors for a user with filtering and pagination
	 */
	static async getMonitors(
		userId: string,
		options: {
			page?: number;
			limit?: number;
			type?: MonitorType;
			isActive?: boolean;
			search?: string;
		} = {}
	): Promise<MonitorListResponse> {
		const page = options.page || 1;
		const limit = Math.min(options.limit || 10, 50); // Max 50 per page
		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = { userId };
		
		if (options.type) {
			where.monitorType = options.type;
		}
		
		if (options.isActive !== undefined) {
			where.isActive = options.isActive;
		}
		
		if (options.search) {
			where.OR = [
				{ name: { contains: options.search, mode: 'insensitive' } },
				{ naturalLanguagePrompt: { contains: options.search, mode: 'insensitive' } }
			];
		}

		try {
			const [monitors, total] = await Promise.all([
				db.monitor.findMany({
					where,
					include: {
						facts: true,
						user: true
					},
					orderBy: { createdAt: 'desc' },
					skip,
					take: limit
				}),
				db.monitor.count({ where })
			]);

			return {
				monitors,
				total,
				page,
				limit
			};
		} catch (error) {
			console.error('Failed to fetch monitors:', error);
			throw new Error('Failed to retrieve monitors');
		}
	}

	/**
	 * Get a single monitor by ID
	 */
	static async getMonitor(userId: string, monitorId: string): Promise<MonitorWithRelations | null> {
		try {
			const monitor = await db.monitor.findFirst({
				where: {
					id: monitorId,
					userId // Ensure user owns the monitor
				},
				include: {
					facts: {
						orderBy: { factOrder: 'asc' }
					},
					user: true
				}
			});

			return monitor;
		} catch (error) {
			console.error('Failed to fetch monitor:', error);
			throw new Error('Failed to retrieve monitor');
		}
	}

	/**
	 * Update a monitor
	 */
	static async updateMonitor(
		userId: string,
		monitorId: string,
		updates: UpdateMonitorRequest
	): Promise<MonitorWithRelations> {
		// Verify monitor exists and user owns it
		const existingMonitor = await this.getMonitor(userId, monitorId);
		if (!existingMonitor) {
			throw new Error('Monitor not found');
		}

		// If prompt is being updated, re-extract facts
		let newFacts: ExtractedFact[] | null = null;
		let newType: MonitorType | null = null;

		if (updates.prompt && updates.prompt !== existingMonitor.prompt) {
			try {
				[newFacts, newType] = await Promise.all([
					aiService.extractFacts(updates.prompt),
					aiService.classifyMonitorType(updates.prompt)
				]);
			} catch (error) {
				console.error('AI processing failed during update:', error);
				throw new Error('Failed to process updated prompt. Please try again.');
			}
		}

		try {
			const monitor = await db.$transaction(async (tx) => {
				// Update monitor
				const updatedMonitor = await tx.monitor.update({
					where: { id: monitorId },
					data: {
						...(updates.name && { name: updates.name }),
						...(updates.prompt && { prompt: updates.prompt }),
						...(updates.frequency && { frequency: updates.frequency }),
						...(updates.isActive !== undefined && { isActive: updates.isActive }),
						...(newType && { type: newType }),
						updatedAt: new Date()
					}
				});

				// Update facts if prompt changed
				if (newFacts) {
					// Delete existing facts
					await tx.monitorFact.deleteMany({
						where: { monitorId }
					});

					// Create new facts
					await Promise.all(
						newFacts.map((fact, index) =>
							tx.monitorFact.create({
								data: {
									monitorId,
									name: fact.name,
									description: fact.description,
									source: fact.source,
									confidence: fact.confidence,
									factOrder: index
								}
							})
						)
					);
				}

				// Return updated monitor with relations
				return await tx.monitor.findUniqueOrThrow({
					where: { id: monitorId },
					include: {
						facts: {
							orderBy: { factOrder: 'asc' }
						},
						user: true
					}
				});
			});

			console.log(`Monitor updated: ${monitor.name}`);
			return monitor;

		} catch (error) {
			console.error('Monitor update failed:', error);
			throw new Error('Failed to update monitor');
		}
	}

	/**
	 * Toggle monitor active state
	 */
	static async toggleMonitor(userId: string, monitorId: string): Promise<MonitorWithRelations> {
		const existingMonitor = await this.getMonitor(userId, monitorId);
		if (!existingMonitor) {
			throw new Error('Monitor not found');
		}

		return await this.updateMonitor(userId, monitorId, {
			isActive: !existingMonitor.isActive
		});
	}

	/**
	 * Delete a monitor (soft delete)
	 */
	static async deleteMonitor(userId: string, monitorId: string): Promise<void> {
		const existingMonitor = await this.getMonitor(userId, monitorId);
		if (!existingMonitor) {
			throw new Error('Monitor not found');
		}

		try {
			await db.monitor.delete({
				where: { id: monitorId }
			});

			console.log(`Monitor deleted: ${existingMonitor.name}`);
		} catch (error) {
			console.error('Monitor deletion failed:', error);
			throw new Error('Failed to delete monitor');
		}
	}

	/**
	 * Manually trigger monitor evaluation
	 */
	static async evaluateMonitor(userId: string, monitorId: string): Promise<boolean> {
		const monitor = await this.getMonitor(userId, monitorId);
		if (!monitor) {
			throw new Error('Monitor not found');
		}

		if (!monitor.isActive) {
			throw new Error('Cannot evaluate inactive monitor');
		}

		try {
			// TODO: Implement actual fact collection and evaluation
			// This will be completed in the temporal logic phase
			console.log(`Manual evaluation triggered for monitor: ${monitor.name}`);
			
			// For now, return a mock result
			return Math.random() > 0.5;

		} catch (error) {
			console.error('Monitor evaluation failed:', error);
			throw new Error('Failed to evaluate monitor');
		}
	}

	/**
	 * Generate a friendly monitor name from prompt
	 */
	private static generateMonitorName(prompt: string): string {
		// Simple name generation - take first 50 chars and clean up
		let name = prompt
			.substring(0, 50)
			.replace(/[^\w\s-]/g, '')
			.trim();

		if (name.length < 10) {
			name = prompt.substring(0, 100).replace(/[^\w\s-]/g, '').trim();
		}

		return name || 'Untitled Monitor';
	}

	/**
	 * Get monitor statistics for user
	 */
	static async getUserStats(userId: string): Promise<{
		total: number;
		active: number;
		currentState: number;
		historicalChange: number;
		canCreateMore: boolean;
	}> {
		try {
			const [total, active, currentState, historicalChange] = await Promise.all([
				db.monitor.count({ where: { userId } }),
				db.monitor.count({ where: { userId, isActive: true } }),
				db.monitor.count({ where: { userId, type: 'current_state' } }),
				db.monitor.count({ where: { userId, type: 'historical_change' } })
			]);

			return {
				total,
				active,
				currentState,
				historicalChange,
				canCreateMore: total < 5 // Beta limit
			};
		} catch (error) {
			console.error('Failed to get user stats:', error);
			throw new Error('Failed to retrieve user statistics');
		}
	}
}