// MonitorHub Admin Monitoring Alerts API
// GET /api/admin/monitoring/alerts - Get system alerts
// PUT /api/admin/monitoring/alerts/[alertId] - Resolve alert

import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/services/auth.service';
import { MonitoringService } from '$lib/services/monitoring.service';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const resolveAlertSchema = z.object({
	alertIds: z.array(z.string())
});

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
		const severity = url.searchParams.get('severity'); // 'critical', 'high', 'medium', 'low'
		const alertType = url.searchParams.get('type'); // 'performance', 'cost', 'error', 'health'
		const resolved = url.searchParams.get('resolved') === 'true';
		const limit = parseInt(url.searchParams.get('limit') || '50');

		// Get alerts
		let alerts = MonitoringService.getActiveAlerts();

		// Apply filters
		if (severity) {
			alerts = alerts.filter(a => a.severity === severity);
		}

		if (alertType) {
			alerts = alerts.filter(a => a.alertType === alertType);
		}

		if (resolved) {
			// This would require getting resolved alerts too
			// For now, we only track active alerts
		}

		// Limit results
		alerts = alerts.slice(0, limit);

		// Get alert statistics
		const stats = {
			total: alerts.length,
			bySeverity: alerts.reduce((acc, alert) => {
				acc[alert.severity] = (acc[alert.severity] || 0) + 1;
				return acc;
			}, {} as Record<string, number>),
			byType: alerts.reduce((acc, alert) => {
				acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
				return acc;
			}, {} as Record<string, number>)
		};

		return json({
			success: true,
			data: {
				alerts,
				statistics: stats,
				filters: {
					severity,
					alertType,
					resolved,
					limit
				}
			}
		});

	} catch (error) {
		console.error('Monitoring alerts error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, locals }) => {
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

		// Parse and validate request body
		const body = await request.json();
		const { alertIds } = resolveAlertSchema.parse(body);

		// Resolve alerts
		const results = alertIds.map(alertId => ({
			alertId,
			resolved: MonitoringService.resolveAlert(alertId)
		}));

		const successCount = results.filter(r => r.resolved).length;

		return json({
			success: true,
			data: {
				resolved: successCount,
				total: alertIds.length,
				results
			},
			message: `Resolved ${successCount} of ${alertIds.length} alerts`
		});

	} catch (error) {
		console.error('Resolve alerts error:', error);

		if (error instanceof z.ZodError) {
			return json({
				error: 'Validation failed',
				details: error.errors
			}, { status: 400 });
		}

		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};