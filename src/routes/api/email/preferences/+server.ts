// MonitorHub Email Preferences API
// GET /api/email/preferences - Get user email preferences
// PUT /api/email/preferences - Update user email preferences

import { json } from '@sveltejs/kit';
import { EmailService } from '$lib/services/email.service';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const updatePreferencesSchema = z.object({
	monitorAlerts: z.boolean().optional(),
	frequencyLimit: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
	quietHours: z.object({
		enabled: z.boolean(),
		startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
		endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
		timezone: z.string()
	}).optional(),
	unsubscribed: z.boolean().optional()
});

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const preferences = await EmailService.getUserEmailPreferences(session.user.id);

		return json({
			success: true,
			preferences
		});

	} catch (error) {
		console.error('Get email preferences error:', error);
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

		// Parse and validate request body
		const body = await request.json();
		const validatedData = updatePreferencesSchema.parse(body);

		// Update preferences
		await EmailService.updateEmailPreferences(session.user.id, validatedData);

		// Get updated preferences
		const updatedPreferences = await EmailService.getUserEmailPreferences(session.user.id);

		return json({
			success: true,
			preferences: updatedPreferences,
			message: 'Email preferences updated successfully'
		});

	} catch (error) {
		console.error('Update email preferences error:', error);

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