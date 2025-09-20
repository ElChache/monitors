// MonitorHub Admin Individual Monitor Management API
// GET /api/admin/monitors/[monitorId] - Get detailed monitor information
// PUT /api/admin/monitors/[monitorId] - Update monitor settings
// DELETE /api/admin/monitors/[monitorId] - Delete monitor

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import { AuthService } from '$lib/services/auth.service';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const updateMonitorSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	isActive: z.boolean().optional(),
	evaluationFrequencyMins: z.number().min(1).max(10080).optional() // 1 min to 1 week
});

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const { monitorId } = params;

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

		// Get monitor with complete details
		const monitor = await db.monitor.findUnique({
			where: { id: monitorId },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
						isActive: true
					}
				},
				facts: {
					select: {
						id: true,
						factName: true,
						factPrompt: true,
						dataSourceType: true,
						createdAt: true
					}
				},
				logic: {
					select: {
						id: true,
						logicExpression: true,
						evaluationType: true,
						changeCondition: true
					}
				},
				actions: {
					select: {
						id: true,
						actionType: true,
						triggerCondition: true,
						isActive: true,
						createdAt: true
					}
				},
				evaluations: {
					select: {
						id: true,
						evaluationResult: true,
						previousResult: true,
						stateChanged: true,
						aiReasoning: true,
						evaluationTimeMs: true,
						evaluatedAt: true
					},
					orderBy: { evaluatedAt: 'desc' },
					take: 20
				}
			}
		});

		if (!monitor) {
			return json({ error: 'Monitor not found' }, { status: 404 });
		}

		// Get evaluation statistics
		const [totalEvaluations, triggeredEvaluations, avgProcessingTime] = await Promise.all([
			db.monitorEvaluation.count({
				where: { monitorId }
			}),
			db.monitorEvaluation.count({
				where: { 
					monitorId,
					evaluationResult: true
				}
			}),
			db.monitorEvaluation.aggregate({
				where: { 
					monitorId,
					evaluationTimeMs: { not: null }
				},
				_avg: {
					evaluationTimeMs: true
				}
			})
		]);

		// Get recent action executions
		const recentActions = await db.actionExecution.findMany({
			where: {
				monitorAction: {
					monitorId
				}
			},
			include: {
				monitorAction: {
					select: {
						actionType: true,
						triggerCondition: true
					}
				},
				monitorEvaluation: {
					select: {
						evaluatedAt: true,
						evaluationResult: true
					}
				}
			},
			orderBy: { executedAt: 'desc' },
			take: 10
		});

		return json({
			success: true,
			data: {
				...monitor,
				statistics: {
					totalEvaluations,
					triggeredEvaluations,
					triggerRate: totalEvaluations > 0 ? (triggeredEvaluations / totalEvaluations) * 100 : 0,
					avgProcessingTimeMs: avgProcessingTime._avg.evaluationTimeMs || null
				},
				recentActions
			}
		});

	} catch (error) {
		console.error('Get monitor details error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { monitorId } = params;

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
		const validatedData = updateMonitorSchema.parse(body);

		// Update monitor
		const updatedMonitor = await db.monitor.update({
			where: { id: monitorId },
			data: validatedData,
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true
					}
				}
			}
		});

		return json({
			success: true,
			data: updatedMonitor,
			message: 'Monitor updated successfully'
		});

	} catch (error) {
		console.error('Update monitor error:', error);

		if (error instanceof z.ZodError) {
			return json({
				error: 'Validation failed',
				details: error.errors
			}, { status: 400 });
		}

		if (error.code === 'P2025') {
			return json({ error: 'Monitor not found' }, { status: 404 });
		}

		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const { monitorId } = params;

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

		// Get monitor details for response
		const monitor = await db.monitor.findUnique({
			where: { id: monitorId },
			select: {
				id: true,
				name: true,
				user: {
					select: {
						email: true,
						name: true
					}
				}
			}
		});

		if (!monitor) {
			return json({ error: 'Monitor not found' }, { status: 404 });
		}

		// Delete monitor (cascade will handle related data)
		await db.monitor.delete({
			where: { id: monitorId }
		});

		return json({
			success: true,
			data: monitor,
			message: 'Monitor deleted successfully'
		});

	} catch (error) {
		console.error('Delete monitor error:', error);

		if (error.code === 'P2025') {
			return json({ error: 'Monitor not found' }, { status: 404 });
		}

		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};