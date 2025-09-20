// MonitorHub Admin System Health Monitoring API
// GET /api/admin/system/health - Get comprehensive system health status

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import { AuthService } from '$lib/services/auth.service';
import { BackgroundJobService } from '$lib/services/background.service';
import { aiService } from '$lib/ai/ai.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Check admin privileges
		const isAdmin = await AuthService.isAdmin(session.user.id);
		if (!isAdmin) {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Database health check
		const dbHealthPromise = checkDatabaseHealth();
		
		// Background job service health
		const jobServiceHealth = BackgroundJobService.getQueueStatus();
		
		// AI service health check
		const aiHealthPromise = checkAIServiceHealth();
		
		// System statistics
		const systemStatsPromise = getSystemStatistics();
		
		// Recent errors and warnings
		const recentIssuesPromise = getRecentSystemIssues();

		const [dbHealth, aiHealth, systemStats, recentIssues] = await Promise.all([
			dbHealthPromise,
			aiHealthPromise,
			systemStatsPromise,
			recentIssuesPromise
		]);

		// Overall system health calculation
		const healthChecks = {
			database: dbHealth.status === 'healthy',
			backgroundJobs: jobServiceHealth.processorRunning,
			aiService: aiHealth.status === 'healthy'
		};

		const healthyCount = Object.values(healthChecks).filter(Boolean).length;
		const totalChecks = Object.keys(healthChecks).length;
		const overallHealth = healthyCount === totalChecks ? 'healthy' : 
			healthyCount >= totalChecks / 2 ? 'degraded' : 'unhealthy';

		return json({
			success: true,
			data: {
				overall: {
					status: overallHealth,
					score: Math.round((healthyCount / totalChecks) * 100),
					lastChecked: new Date().toISOString()
				},
				components: {
					database: dbHealth,
					backgroundJobs: {
						status: jobServiceHealth.processorRunning ? 'healthy' : 'unhealthy',
						queueLength: jobServiceHealth.queueLength,
						isProcessing: jobServiceHealth.isProcessing,
						processorRunning: jobServiceHealth.processorRunning
					},
					aiService: aiHealth
				},
				statistics: systemStats,
				recentIssues
			}
		});

	} catch (error) {
		console.error('System health check error:', error);
		return json({
			error: 'Health check failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

async function checkDatabaseHealth(): Promise<{
	status: 'healthy' | 'unhealthy';
	responseTime: number;
	activeConnections?: number;
	lastError?: string;
}> {
	const startTime = Date.now();
	
	try {
		// Simple query to test database connectivity
		await db.$queryRaw`SELECT 1`;
		
		const responseTime = Date.now() - startTime;
		
		return {
			status: 'healthy',
			responseTime
		};
		
	} catch (error) {
		return {
			status: 'unhealthy',
			responseTime: Date.now() - startTime,
			lastError: error instanceof Error ? error.message : 'Unknown database error'
		};
	}
}

async function checkAIServiceHealth(): Promise<{
	status: 'healthy' | 'degraded' | 'unhealthy';
	providers: Record<string, boolean>;
	lastError?: string;
}> {
	try {
		// Test primary and fallback AI providers
		const providerTests = await Promise.allSettled([
			aiService.testConnection('claude'),
			aiService.testConnection('openai')
		]);

		const providers = {
			claude: providerTests[0].status === 'fulfilled' && providerTests[0].value,
			openai: providerTests[1].status === 'fulfilled' && providerTests[1].value
		};

		const workingProviders = Object.values(providers).filter(Boolean).length;
		
		let status: 'healthy' | 'degraded' | 'unhealthy';
		if (workingProviders === 2) {
			status = 'healthy';
		} else if (workingProviders === 1) {
			status = 'degraded';
		} else {
			status = 'unhealthy';
		}

		return {
			status,
			providers
		};

	} catch (error) {
		return {
			status: 'unhealthy',
			providers: { claude: false, openai: false },
			lastError: error instanceof Error ? error.message : 'AI service test failed'
		};
	}
}

async function getSystemStatistics(): Promise<{
	users: { total: number; active: number; admins: number };
	monitors: { total: number; active: number; triggered24h: number };
	evaluations: { total: number; today: number; last7days: number };
	performance: { avgEvaluationTime: number | null; systemUptime: number };
}> {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const last24hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

	const [
		userStats,
		monitorStats,
		evaluationStats,
		performanceStats
	] = await Promise.all([
		db.user.aggregate({
			_count: {
				id: true
			},
			_sum: {
				isActive: true,
				isAdmin: true
			}
		}),
		db.monitor.aggregate({
			_count: {
				id: true
			},
			_sum: {
				isActive: true
			}
		}),
		Promise.all([
			db.monitorEvaluation.count(),
			db.monitorEvaluation.count({
				where: { evaluatedAt: { gte: today } }
			}),
			db.monitorEvaluation.count({
				where: { evaluatedAt: { gte: last7days } }
			})
		]),
		Promise.all([
			db.monitorEvaluation.aggregate({
				where: { evaluationTimeMs: { not: null } },
				_avg: { evaluationTimeMs: true }
			}),
			db.monitorEvaluation.count({
				where: {
					evaluationResult: true,
					evaluatedAt: { gte: last24hours }
				}
			})
		])
	]);

	return {
		users: {
			total: userStats._count.id,
			active: userStats._sum.isActive || 0,
			admins: userStats._sum.isAdmin || 0
		},
		monitors: {
			total: monitorStats._count.id,
			active: monitorStats._sum.isActive || 0,
			triggered24h: performanceStats[1]
		},
		evaluations: {
			total: evaluationStats[0],
			today: evaluationStats[1],
			last7days: evaluationStats[2]
		},
		performance: {
			avgEvaluationTime: performanceStats[0]._avg.evaluationTimeMs,
			systemUptime: process.uptime()
		}
	};
}

async function getRecentSystemIssues(): Promise<Array<{
	type: 'error' | 'warning';
	message: string;
	timestamp: string;
	source: string;
}>> {
	// In a real system, this would query error logs
	// For now, we'll check for recent failed evaluations and actions
	const last24hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
	
	const [failedActions, staleMonitors] = await Promise.all([
		db.actionExecution.findMany({
			where: {
				executionStatus: 'failed',
				executedAt: { gte: last24hours }
			},
			select: {
				errorMessage: true,
				executedAt: true,
				monitorAction: {
					select: {
						monitor: {
							select: { name: true }
						}
					}
				}
			},
			take: 10,
			orderBy: { executedAt: 'desc' }
		}),
		db.monitor.findMany({
			where: {
				isActive: true,
				evaluations: {
					none: {
						evaluatedAt: { gte: last24hours }
					}
				}
			},
			select: {
				id: true,
				name: true,
				updatedAt: true
			},
			take: 5
		})
	]);

	const issues = [];

	// Add failed action errors
	for (const action of failedActions) {
		issues.push({
			type: 'error' as const,
			message: `Action execution failed: ${action.errorMessage}`,
			timestamp: action.executedAt.toISOString(),
			source: `Monitor: ${action.monitorAction.monitor.name}`
		});
	}

	// Add stale monitor warnings
	for (const monitor of staleMonitors) {
		issues.push({
			type: 'warning' as const,
			message: `Monitor has not been evaluated in 24+ hours`,
			timestamp: monitor.updatedAt.toISOString(),
			source: `Monitor: ${monitor.name}`
		});
	}

	return issues.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}