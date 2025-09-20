// MonitorHub Monitor Toggle API
// Activate/deactivate monitor endpoint

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import type { RequestHandler } from './$types';

// POST /api/monitors/[id]/toggle - Toggle monitor active status
export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		// TODO: Add authentication check when auth system is ready
		// const userId = locals.user?.id;
		// if (!userId) {
		//   return json({ error: 'Unauthorized' }, { status: 401 });
		// }

		// For now, use a placeholder user ID for development
		const userId = 'dev-user-id';

		const { id } = params;

		// Check if monitor exists and belongs to user
		const existingMonitor = await db.monitor.findFirst({
			where: {
				id,
				userId
			}
		});

		if (!existingMonitor) {
			return json(
				{ error: 'Monitor not found' },
				{ status: 404 }
			);
		}

		// If activating, check user monitor limit
		if (!existingMonitor.isActive) {
			const activeCount = await db.monitor.count({
				where: { userId, isActive: true }
			});

			if (activeCount >= 5) {
				return json(
					{ error: 'Monitor limit reached. Beta users can have maximum 5 active monitors.' },
					{ status: 400 }
				);
			}
		}

		// Toggle active status
		const updatedMonitor = await db.monitor.update({
			where: { id },
			data: { 
				isActive: !existingMonitor.isActive,
				updatedAt: new Date()
			},
			include: {
				facts: true,
				logic: true,
				actions: true
			}
		});

		return json({
			message: `Monitor ${updatedMonitor.isActive ? 'activated' : 'deactivated'} successfully`,
			monitor: updatedMonitor
		});

	} catch (error) {
		console.error('Failed to toggle monitor:', error);
		return json(
			{ error: 'Failed to toggle monitor' },
			{ status: 500 }
		);
	}
};