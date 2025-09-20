// MonitorHub Individual Monitor API
// GET, PUT, DELETE operations for specific monitors

import { json } from '@sveltejs/kit';
import { MonitorService } from '$lib/services/monitor.service';
import { z } from 'zod';
import type { RequestHandler } from './$types';

// Validation schema for updates
const UpdateMonitorSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	prompt: z.string().min(10).max(500).optional(),
	frequency: z.number().min(1).max(1440).optional(),
	isActive: z.boolean().optional()
});

// GET /api/monitors/[id] - Get specific monitor with evaluation history
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { id } = params;
		const monitor = await MonitorService.getMonitor(session.user.id, id);

		if (!monitor) {
			return json(
				{ error: 'Monitor not found' },
				{ status: 404 }
			);
		}

		return json({
			success: true,
			monitor
		});

	} catch (error) {
		console.error('Failed to fetch monitor:', error);
		return json(
			{ error: 'Failed to fetch monitor' },
			{ status: 500 }
		);
	}
};

// PUT /api/monitors/[id] - Update monitor
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { id } = params;
		const body = await request.json();
		const validatedData = UpdateMonitorSchema.parse(body);

		// Update monitor using service
		const updatedMonitor = await MonitorService.updateMonitor(session.user.id, id, validatedData);

		return json({
			success: true,
			monitor: updatedMonitor
		});

	} catch (error) {
		console.error('Update monitor error:', error);

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

// DELETE /api/monitors/[id] - Delete monitor
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { id } = params;

		// Delete monitor using service
		await MonitorService.deleteMonitor(session.user.id, id);

		return json({
			success: true,
			message: 'Monitor deleted successfully'
		});

	} catch (error) {
		console.error('Delete monitor error:', error);

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