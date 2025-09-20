// MonitorHub Email Unsubscribe API
// GET /api/email/unsubscribe - Handle unsubscribe requests

import { json } from '@sveltejs/kit';
import { EmailService } from '$lib/services/email.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const token = url.searchParams.get('token');
		
		if (!token) {
			return json({
				error: 'Unsubscribe token required'
			}, { status: 400 });
		}

		const success = await EmailService.handleUnsubscribe(token);

		if (success) {
			return json({
				success: true,
				message: 'Successfully unsubscribed from MonitorHub emails'
			});
		} else {
			return json({
				error: 'Invalid or expired unsubscribe token'
			}, { status: 400 });
		}

	} catch (error) {
		console.error('Unsubscribe error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};