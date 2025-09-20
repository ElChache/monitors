// MonitorHub Admin Analytics and Reporting API
// GET /api/admin/analytics - Comprehensive analytics dashboard data

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import { AuthService } from '$lib/services/auth.service';
import { BackgroundJobService } from '$lib/services/background.service';
import { aiService } from '$lib/ai/ai.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
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

		// Parse query parameters for date range
		const daysParam = url.searchParams.get('days');
		const days = daysParam ? parseInt(daysParam) : 30;
		const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
		const endDate = new Date();

		// Gather comprehensive analytics data
		const [
			userAnalytics,
			monitorAnalytics,
			evaluationAnalytics,
			performanceAnalytics,
			systemAnalytics,
			trendsAnalytics
		] = await Promise.all([
			getUserAnalytics(startDate, endDate),
			getMonitorAnalytics(startDate, endDate),
			getEvaluationAnalytics(startDate, endDate),
			getPerformanceAnalytics(startDate, endDate),
			getSystemAnalytics(),
			getTrendsAnalytics(days)
		]);

		return json({
			success: true,
			data: {
				dateRange: {
					start: startDate.toISOString(),
					end: endDate.toISOString(),
					days
				},
				users: userAnalytics,
				monitors: monitorAnalytics,
				evaluations: evaluationAnalytics,
				performance: performanceAnalytics,
				system: systemAnalytics,
				trends: trendsAnalytics
			}
		});

	} catch (error) {
		console.error('Admin analytics error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

async function getUserAnalytics(startDate: Date, endDate: Date) {
	const [totalUsers, activeUsers, newUsers, adminUsers] = await Promise.all([
		db.user.count(),
		db.user.count({ where: { isActive: true } }),
		db.user.count({
			where: {
				createdAt: { gte: startDate, lte: endDate }
			}
		}),
		db.user.count({ where: { isAdmin: true } })
	]);

	// User growth over time
	const userGrowth = await db.$queryRaw<Array<{ date: string; count: number }>>`
		SELECT 
			DATE(created_at) as date,
			COUNT(*)::int as count
		FROM users 
		WHERE created_at >= ${startDate} AND created_at <= ${endDate}
		GROUP BY DATE(created_at)
		ORDER BY date
	`;

	return {
		total: totalUsers,
		active: activeUsers,
		newInPeriod: newUsers,
		admins: adminUsers,
		inactiveRate: totalUsers > 0 ? ((totalUsers - activeUsers) / totalUsers) * 100 : 0,
		growth: userGrowth
	};
}

async function getMonitorAnalytics(startDate: Date, endDate: Date) {
	const [totalMonitors, activeMonitors, newMonitors] = await Promise.all([
		db.monitor.count(),
		db.monitor.count({ where: { isActive: true } }),
		db.monitor.count({
			where: {
				createdAt: { gte: startDate, lte: endDate }
			}
		})
	]);

	// Monitor types breakdown
	const monitorTypes = await db.monitor.groupBy({
		by: ['monitorType'],
		_count: {
			id: true
		}
	});

	// Most active monitors (by evaluation count)
	const mostActiveMonitors = await db.monitor.findMany({
		select: {
			id: true,
			name: true,
			monitorType: true,
			user: {
				select: {
					email: true,
					name: true
				}
			},
			_count: {
				select: {
					evaluations: true
				}
			}
		},
		orderBy: {
			evaluations: {
				_count: 'desc'
			}
		},
		take: 10
	});

	return {
		total: totalMonitors,
		active: activeMonitors,
		newInPeriod: newMonitors,
		types: monitorTypes.map(mt => ({
			type: mt.monitorType,
			count: mt._count.id
		})),
		mostActive: mostActiveMonitors
	};
}

async function getEvaluationAnalytics(startDate: Date, endDate: Date) {
	const [totalEvaluations, evaluationsInPeriod, triggeredEvaluations] = await Promise.all([
		db.monitorEvaluation.count(),
		db.monitorEvaluation.count({
			where: {
				evaluatedAt: { gte: startDate, lte: endDate }
			}
		}),
		db.monitorEvaluation.count({
			where: {
				evaluatedAt: { gte: startDate, lte: endDate },
				evaluationResult: true
			}
		})
	]);

	// Daily evaluation counts
	const dailyEvaluations = await db.$queryRaw<Array<{ date: string; total: number; triggered: number }>>`
		SELECT 
			DATE(evaluated_at) as date,
			COUNT(*)::int as total,
			COUNT(CASE WHEN evaluation_result = true THEN 1 END)::int as triggered
		FROM monitor_evaluations 
		WHERE evaluated_at >= ${startDate} AND evaluated_at <= ${endDate}
		GROUP BY DATE(evaluated_at)
		ORDER BY date
	`;

	// Average evaluation time
	const avgEvaluationTime = await db.monitorEvaluation.aggregate({
		where: {
			evaluatedAt: { gte: startDate, lte: endDate },
			evaluationTimeMs: { not: null }
		},
		_avg: {
			evaluationTimeMs: true
		}
	});

	return {
		total: totalEvaluations,
		inPeriod: evaluationsInPeriod,
		triggered: triggeredEvaluations,
		triggerRate: evaluationsInPeriod > 0 ? (triggeredEvaluations / evaluationsInPeriod) * 100 : 0,
		avgProcessingTime: avgEvaluationTime._avg.evaluationTimeMs,
		daily: dailyEvaluations
	};
}

async function getPerformanceAnalytics(startDate: Date, endDate: Date) {
	// Action execution success rate
	const [totalActions, successfulActions, failedActions] = await Promise.all([
		db.actionExecution.count({
			where: {
				executedAt: { gte: startDate, lte: endDate }
			}
		}),
		db.actionExecution.count({
			where: {
				executedAt: { gte: startDate, lte: endDate },
				executionStatus: 'completed'
			}
		}),
		db.actionExecution.count({
			where: {
				executedAt: { gte: startDate, lte: endDate },
				executionStatus: 'failed'
			}
		})
	]);

	// System uptime estimation (based on evaluation frequency)
	const expectedEvaluations = await db.$queryRaw<Array<{ expected: number }>>`
		SELECT SUM(
			EXTRACT(EPOCH FROM (${endDate} - GREATEST(created_at, ${startDate}))) / 60 / evaluation_frequency_minutes
		)::int as expected
		FROM monitors 
		WHERE is_active = true
	`;

	const actualEvaluations = await db.monitorEvaluation.count({
		where: {
			evaluatedAt: { gte: startDate, lte: endDate }
		}
	});

	const expected = expectedEvaluations[0]?.expected || 0;
	const uptimePercentage = expected > 0 ? Math.min((actualEvaluations / expected) * 100, 100) : 100;

	return {
		actionSuccessRate: totalActions > 0 ? (successfulActions / totalActions) * 100 : 100,
		totalActions,
		successfulActions,
		failedActions,
		systemUptime: uptimePercentage,
		expectedEvaluations: expected,
		actualEvaluations
	};
}

async function getSystemAnalytics() {
	// Background job service status
	const jobStatus = BackgroundJobService.getQueueStatus();
	
	// AI service cost and usage
	const aiCostSummary = aiService.getCostSummary();
	const aiUsageMetrics = aiService.getUsageMetrics();
	
	// Recent AI usage by provider
	const aiProviderUsage = aiUsageMetrics
		.filter(metric => metric.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
		.reduce((acc, metric) => {
			acc[metric.provider] = (acc[metric.provider] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

	return {
		backgroundJobs: {
			queueLength: jobStatus.queueLength,
			isProcessing: jobStatus.isProcessing,
			processorRunning: jobStatus.processorRunning
		},
		aiService: {
			costs: aiCostSummary,
			providerUsage: aiProviderUsage,
			currentProvider: aiService.getCurrentProvider()
		}
	};
}

async function getTrendsAnalytics(days: number) {
	// User registration trend
	const userTrend = await db.$queryRaw<Array<{ date: string; count: number }>>`
		SELECT 
			DATE(created_at) as date,
			COUNT(*)::int as count
		FROM users 
		WHERE created_at >= NOW() - INTERVAL '${days} days'
		GROUP BY DATE(created_at)
		ORDER BY date
	`;

	// Monitor creation trend
	const monitorTrend = await db.$queryRaw<Array<{ date: string; count: number }>>`
		SELECT 
			DATE(created_at) as date,
			COUNT(*)::int as count
		FROM monitors 
		WHERE created_at >= NOW() - INTERVAL '${days} days'
		GROUP BY DATE(created_at)
		ORDER BY date
	`;

	// Alert frequency trend
	const alertTrend = await db.$queryRaw<Array<{ date: string; count: number }>>`
		SELECT 
			DATE(evaluated_at) as date,
			COUNT(*)::int as count
		FROM monitor_evaluations 
		WHERE evaluation_result = true 
		  AND evaluated_at >= NOW() - INTERVAL '${days} days'
		GROUP BY DATE(evaluated_at)
		ORDER BY date
	`;

	return {
		userRegistrations: userTrend,
		monitorCreations: monitorTrend,
		alertFrequency: alertTrend
	};
}