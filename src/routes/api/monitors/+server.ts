// MonitorHub Monitor Management API
// Core CRUD operations for monitors with Combination Intelligence support

import { json } from '@sveltejs/kit';
import { MonitorService } from '$lib/services/monitor.service';
import { z } from 'zod';
import type { RequestHandler } from './$types';

// Validation schemas
const CreateMonitorSchema = z.object({
	prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(500, 'Prompt too long'),
	name: z.string().min(1).max(100).optional(),
	frequency: z.number().min(1).max(1440).optional()
});

const ListMonitorsSchema = z.object({
	page: z.number().min(1).optional(),
	limit: z.number().min(1).max(50).optional(),
	type: z.enum(['current_state', 'historical_change']).optional(),
	isActive: z.boolean().optional(),
	search: z.string().max(100).optional()
});

// GET /api/monitors - List user monitors with filtering
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Parse query parameters
		const params = Object.fromEntries(url.searchParams);
		const queryData = {
			...params,
			page: params.page ? parseInt(params.page) : undefined,
			limit: params.limit ? parseInt(params.limit) : undefined,
			isActive: params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined
		};

		const validatedQuery = ListMonitorsSchema.parse(queryData);

		// Get monitors using service
		const result = await MonitorService.getMonitors(session.user.id, validatedQuery);

		return json({
			success: true,
			...result
		});

	} catch (error) {
		console.error('List monitors error:', error);

		if (error instanceof z.ZodError) {
			return json({
				error: 'Invalid query parameters',
				details: error.errors
			}, { status: 400 });
		}

		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

// POST /api/monitors - Create new monitor
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = CreateMonitorSchema.parse(body);

		// Create monitor using service (includes AI processing)
		const monitor = await MonitorService.createMonitor(session.user.id, validatedData);

		return json({
			success: true,
			monitor
		}, { status: 201 });

	} catch (error) {
		console.error('Create monitor error:', error);

		if (error instanceof z.ZodError) {
			return json({
				error: 'Validation failed',
				details: error.errors
			}, { status: 400 });
		}

		if (error instanceof Error) {
			return json({
				error: error.message
			}, { status: 400 });
		}

		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};