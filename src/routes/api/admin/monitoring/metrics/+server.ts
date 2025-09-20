// MonitorHub Admin Monitoring Metrics API
// GET /api/admin/monitoring/metrics - Get system performance metrics

import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/services/auth.service';
import { MonitoringService } from '$lib/services/monitoring.service';
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

		// Parse query parameters
		const hours = parseInt(url.searchParams.get('hours') || '24');
		const metricType = url.searchParams.get('type'); // Filter by metric type

		// Get performance analytics
		const performanceAnalytics = MonitoringService.getPerformanceAnalytics(hours);
		const costAnalytics = MonitoringService.getCostAnalytics();
		const systemHealth = MonitoringService.getSystemHealth();
		const activeAlerts = MonitoringService.getActiveAlerts();

		return json({
			success: true,
			data: {
				timeWindow: {
					hours,
					from: new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString(),
					to: new Date().toISOString()
				},
				performance: performanceAnalytics,
				costs: costAnalytics,
				health: systemHealth,
				alerts: activeAlerts,
				summary: {
					status: systemHealth.status,
					score: systemHealth.score,
					criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
					highAlerts: activeAlerts.filter(a => a.severity === 'high').length,
					dailyCostStatus: costAnalytics.dailyCost > 40 ? 'warning' : 'normal',
					performanceStatus: performanceAnalytics.averageResponseTime > 1500 ? 'degraded' : 'good'
				}
			}
		});

	} catch (error) {
		console.error('Monitoring metrics error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};