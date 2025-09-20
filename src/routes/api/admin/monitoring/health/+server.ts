// MonitorHub Admin System Health & Status API
// GET /api/admin/monitoring/health - Comprehensive system health check

import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/services/auth.service';
import { MonitoringService } from '$lib/services/monitoring.service';
import { BackgroundJobService } from '$lib/services/background.service';
import { aiService } from '$lib/ai/ai.service';
import { db } from '$lib/database';
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

		// Get comprehensive system health data
		const [
			systemHealth,
			performanceAnalytics,
			costAnalytics,
			userAnalytics,
			activeAlerts,
			jobStatus,
			aiStatus,
			databaseHealth
		] = await Promise.all([
			MonitoringService.getSystemHealth(),
			MonitoringService.getPerformanceAnalytics(1), // Last hour
			MonitoringService.getCostAnalytics(),
			MonitoringService.getUserAnalytics(1), // Last day
			MonitoringService.getActiveAlerts(),
			Promise.resolve(BackgroundJobService.getQueueStatus()),
			Promise.resolve(aiService.getCostSummary()),
			checkDatabaseHealth()
		]);

		// System status determination
		const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
		const highAlerts = activeAlerts.filter(a => a.severity === 'high').length;
		
		let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
		if (criticalAlerts > 0) {
			overallStatus = 'unhealthy';
		} else if (highAlerts > 2 || performanceAnalytics.errorRate > 5 || !jobStatus.processorRunning) {
			overallStatus = 'degraded';
		} else {
			overallStatus = 'healthy';
		}

		// Service status breakdown
		const services = {
			database: {
				status: databaseHealth.status === 'healthy',
				responseTime: databaseHealth.responseTime,
				details: databaseHealth.lastError || 'Operational'
			},
			backgroundJobs: {
				status: jobStatus.processorRunning,
				queueLength: jobStatus.queueLength,
				details: jobStatus.isProcessing ? 'Processing jobs' : 'Idle'
			},
			aiService: {
				status: true, // If we got cost summary, AI service is working
				dailyCost: aiStatus.dailyCost,
				details: `Daily cost: $${aiStatus.dailyCost.toFixed(2)}`
			},
			monitoring: {
				status: true, // If this endpoint is responding, monitoring is working
				alertsActive: activeAlerts.length,
				details: `${activeAlerts.length} active alerts`
			}
		};

		// Performance summary
		const performance = {
			averageResponseTime: performanceAnalytics.averageResponseTime,
			throughput: performanceAnalytics.throughput,
			errorRate: performanceAnalytics.errorRate,
			evaluationTime: performanceAnalytics.averageEvaluationTime,
			status: performanceAnalytics.averageResponseTime < 2000 ? 'good' : 'degraded'
		};

		// Resource utilization summary
		const resources = {
			costs: {
				daily: costAnalytics.dailyCost,
				monthly: costAnalytics.monthlyCost,
				projected: costAnalytics.projectedMonthlyCost,
				status: costAnalytics.dailyCost > 40 ? 'warning' : 'normal'
			},
			usage: {
				activeUsers: userAnalytics.activeUsers,
				monitorCreations: userAnalytics.monitorCreations,
				evaluations: userAnalytics.evaluations
			}
		};

		// Quick fixes recommendations
		const recommendations = generateRecommendations({
			overallStatus,
			criticalAlerts,
			highAlerts,
			performanceAnalytics,
			costAnalytics,
			jobStatus,
			services
		});

		return json({
			success: true,
			data: {
				status: overallStatus,
				timestamp: new Date().toISOString(),
				summary: {
					score: systemHealth.score,
					criticalIssues: criticalAlerts,
					warnings: highAlerts,
					servicesHealthy: Object.values(services).filter(s => s.status).length,
					totalServices: Object.keys(services).length
				},
				services,
				performance,
				resources,
				alerts: activeAlerts.slice(0, 10), // Most recent 10 alerts
				recommendations,
				uptime: {
					process: Math.round(process.uptime()),
					system: Math.round(process.uptime()) // Simplified for now
				}
			}
		});

	} catch (error) {
		console.error('System health check error:', error);
		
		// Even if health check fails, return basic status
		return json({
			success: false,
			data: {
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: 'Health check failed',
				summary: {
					score: 0,
					criticalIssues: 1,
					warnings: 0,
					servicesHealthy: 0,
					totalServices: 4
				}
			}
		}, { status: 500 });
	}
};

async function checkDatabaseHealth(): Promise<{
	status: 'healthy' | 'unhealthy';
	responseTime: number;
	lastError?: string;
}> {
	const startTime = Date.now();
	
	try {
		// Simple connectivity test
		await db.$queryRaw`SELECT 1`;
		
		return {
			status: 'healthy',
			responseTime: Date.now() - startTime
		};
	} catch (error) {
		return {
			status: 'unhealthy',
			responseTime: Date.now() - startTime,
			lastError: error instanceof Error ? error.message : 'Unknown database error'
		};
	}
}

function generateRecommendations(context: {
	overallStatus: string;
	criticalAlerts: number;
	highAlerts: number;
	performanceAnalytics: any;
	costAnalytics: any;
	jobStatus: any;
	services: any;
}): Array<{
	priority: 'high' | 'medium' | 'low';
	title: string;
	description: string;
	action: string;
}> {
	const recommendations = [];

	// Critical issues
	if (context.criticalAlerts > 0) {
		recommendations.push({
			priority: 'high' as const,
			title: 'Critical Alerts Require Immediate Attention',
			description: `${context.criticalAlerts} critical alerts are active and need immediate resolution.`,
			action: 'Review and resolve critical alerts in the monitoring dashboard'
		});
	}

	// Performance issues
	if (context.performanceAnalytics.averageResponseTime > 3000) {
		recommendations.push({
			priority: 'high' as const,
			title: 'Poor API Response Times',
			description: `Average response time is ${Math.round(context.performanceAnalytics.averageResponseTime)}ms, exceeding acceptable thresholds.`,
			action: 'Investigate database queries and optimize slow endpoints'
		});
	}

	// Cost management
	if (context.costAnalytics.dailyCost > 40) {
		recommendations.push({
			priority: 'medium' as const,
			title: 'High AI Processing Costs',
			description: `Daily AI costs are $${context.costAnalytics.dailyCost.toFixed(2)}, approaching budget limits.`,
			action: 'Review AI usage patterns and implement caching or usage optimization'
		});
	}

	// Background job issues
	if (!context.jobStatus.processorRunning) {
		recommendations.push({
			priority: 'high' as const,
			title: 'Background Job Processor Not Running',
			description: 'Monitor evaluations and notifications may be delayed.',
			action: 'Restart the background job processor service'
		});
	}

	// Queue buildup
	if (context.jobStatus.queueLength > 100) {
		recommendations.push({
			priority: 'medium' as const,
			title: 'Large Job Queue Backlog',
			description: `${context.jobStatus.queueLength} jobs are queued, indicating processing delays.`,
			action: 'Scale background processing or investigate job failures'
		});
	}

	// Database performance
	if (!context.services.database.status) {
		recommendations.push({
			priority: 'high' as const,
			title: 'Database Connectivity Issues',
			description: 'Database health checks are failing.',
			action: 'Check database connectivity and server status'
		});
	}

	// Error rate issues
	if (context.performanceAnalytics.errorRate > 5) {
		recommendations.push({
			priority: 'medium' as const,
			title: 'High Error Rate',
			description: `${context.performanceAnalytics.errorRate.toFixed(1)}% of requests are failing.`,
			action: 'Review error logs and fix failing endpoints'
		});
	}

	// General health recommendations
	if (recommendations.length === 0) {
		recommendations.push({
			priority: 'low' as const,
			title: 'System Operating Normally',
			description: 'All systems are healthy. Consider routine maintenance and optimization.',
			action: 'Review performance trends and plan for scaling'
		});
	}

	return recommendations.sort((a, b) => {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		return priorityOrder[b.priority] - priorityOrder[a.priority];
	});
}