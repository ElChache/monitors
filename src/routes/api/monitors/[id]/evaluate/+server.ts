// MonitorHub Manual Monitor Evaluation API
// Trigger immediate evaluation of a specific monitor

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import type { RequestHandler } from './$types';

// POST /api/monitors/[id]/evaluate - Trigger manual evaluation
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
		const monitor = await db.monitor.findFirst({
			where: {
				id,
				userId
			},
			include: {
				facts: true,
				logic: true,
				actions: true
			}
		});

		if (!monitor) {
			return json(
				{ error: 'Monitor not found' },
				{ status: 404 }
			);
		}

		if (!monitor.isActive) {
			return json(
				{ error: 'Cannot evaluate inactive monitor' },
				{ status: 400 }
			);
		}

		// TODO: Queue the monitor for immediate evaluation
		// This will be implemented when the evaluation engine is ready
		console.log('Manual evaluation queued for monitor:', id);

		// For now, create a placeholder evaluation
		const evaluation = await db.monitorEvaluation.create({
			data: {
				monitorId: id,
				evaluationResult: false, // Placeholder
				factValues: {}, // Will be populated by AI evaluation
				aiReasoning: 'Manual evaluation triggered - pending AI processing',
				evaluationTimeMs: 0,
				evaluatedAt: new Date()
			}
		});

		return json({
			message: 'Manual evaluation triggered successfully',
			evaluationId: evaluation.id,
			queuePosition: 1, // Placeholder
			estimatedCompletionSeconds: 30
		});

	} catch (error) {
		console.error('Failed to trigger evaluation:', error);
		return json(
			{ error: 'Failed to trigger evaluation' },
			{ status: 500 }
		);
	}
};