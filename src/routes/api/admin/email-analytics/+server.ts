// MonitorHub Admin Email Analytics API
// GET /api/admin/email-analytics - Get email delivery analytics for admin dashboard

import { json } from '@sveltejs/kit';
import { EmailService } from '$lib/services/email.service';
import { AuthService } from '$lib/services/auth.service';
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

		// Parse query parameters for time range
		const daysParam = url.searchParams.get('days');
		const days = daysParam ? parseInt(daysParam) : 30;

		const timeRange = {
			start: new Date(Date.now() - (days * 24 * 60 * 60 * 1000)),
			end: new Date()
		};

		// Get email analytics
		const analytics = await EmailService.getEmailAnalytics(timeRange);

		return json({
			success: true,
			analytics: {
				...analytics,
				timeRange: {
					start: timeRange.start.toISOString(),
					end: timeRange.end.toISOString(),
					days
				}
			}
		});

	} catch (error) {
		console.error('Email analytics error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};