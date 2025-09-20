// MonitorHub Admin Monitor Oversight API
// GET /api/admin/monitors - List all monitors with advanced filtering and analytics
// PUT /api/admin/monitors/bulk - Bulk operations on monitors

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import { AuthService } from '$lib/services/auth.service';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const bulkOperationSchema = z.object({
	operation: z.enum(['activate', 'deactivate', 'delete']),
	monitorIds: z.array(z.string().uuid())
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
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const search = url.searchParams.get('search') || '';
		const status = url.searchParams.get('status'); // 'active', 'inactive', 'all'
		const type = url.searchParams.get('type'); // monitor type filter
		const userId = url.searchParams.get('userId'); // filter by user
		const sortBy = url.searchParams.get('sortBy') || 'createdAt';
		const sortOrder = url.searchParams.get('sortOrder') || 'desc';
		const alerts = url.searchParams.get('alerts'); // 'triggered', 'silent', 'all'

		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
				{ naturalLanguagePrompt: { contains: search, mode: 'insensitive' } }
			];
		}

		if (status === 'active') {
			where.isActive = true;
		} else if (status === 'inactive') {
			where.isActive = false;
		}

		if (type) {
			where.monitorType = type;
		}

		if (userId) {
			where.userId = userId;
		}

		// Get monitors with detailed information
		const [monitors, totalCount] = await Promise.all([
			db.monitor.findMany({
				where,
				select: {
					id: true,
					name: true,
					description: true,
					monitorType: true,
					isActive: true,
					evaluationFrequencyMins: true,
					createdAt: true,
					updatedAt: true,
					user: {
						select: {
							id: true,
							email: true,
							name: true,
							isActive: true
						}
					},
					_count: {
						select: {
							evaluations: true,
							facts: true,
							actions: true
						}
					},
					evaluations: {
						select: {
							id: true,
							evaluationResult: true,
							evaluatedAt: true
						},
						orderBy: { evaluatedAt: 'desc' },
						take: 1
					}
				},
				orderBy: { [sortBy]: sortOrder },
				skip,
				take: limit
			}),
			db.monitor.count({ where })
		]);

		// Add analytics for each monitor
		const monitorsWithAnalytics = await Promise.all(
			monitors.map(async (monitor) => {
				const [evaluationsLast30Days, alertsLast30Days, lastTriggered] = await Promise.all([
					db.monitorEvaluation.count({
						where: {
							monitorId: monitor.id,
							evaluatedAt: {
								gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
							}
						}
					}),
					db.monitorEvaluation.count({
						where: {
							monitorId: monitor.id,
							evaluationResult: true,
							evaluatedAt: {
								gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
							}
						}
					}),
					db.monitorEvaluation.findFirst({
						where: {
							monitorId: monitor.id,
							evaluationResult: true
						},
						orderBy: { evaluatedAt: 'desc' },
						select: { evaluatedAt: true }
					})
				]);

				return {
					...monitor,
					analytics: {
						evaluationsLast30Days,
						alertsLast30Days,
						lastTriggered: lastTriggered?.evaluatedAt || null,
						lastEvaluation: monitor.evaluations[0] || null
					}
				};
			})
		);

		// Filter by alerts if requested
		let filteredMonitors = monitorsWithAnalytics;
		if (alerts === 'triggered') {
			filteredMonitors = monitorsWithAnalytics.filter(m => m.analytics.alertsLast30Days > 0);
		} else if (alerts === 'silent') {
			filteredMonitors = monitorsWithAnalytics.filter(m => m.analytics.alertsLast30Days === 0);
		}

		const totalPages = Math.ceil(totalCount / limit);

		return json({
			success: true,
			data: {
				monitors: filteredMonitors,
				pagination: {
					page,
					limit,
					totalCount,
					totalPages,
					hasNext: page < totalPages,
					hasPrev: page > 1
				}
			}
		});

	} catch (error) {
		console.error('Admin monitors list error:', error);
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
		const { operation, monitorIds } = bulkOperationSchema.parse(body);

		let result;
		let message;

		switch (operation) {
			case 'activate':
				result = await db.monitor.updateMany({
					where: { id: { in: monitorIds } },
					data: { isActive: true }
				});
				message = `Activated ${result.count} monitors`;
				break;

			case 'deactivate':
				result = await db.monitor.updateMany({
					where: { id: { in: monitorIds } },
					data: { isActive: false }
				});
				message = `Deactivated ${result.count} monitors`;
				break;

			case 'delete':
				// Soft delete by deactivating
				result = await db.monitor.updateMany({
					where: { id: { in: monitorIds } },
					data: { isActive: false }
				});
				message = `Deleted ${result.count} monitors`;
				break;

			default:
				return json({ error: 'Invalid operation' }, { status: 400 });
		}

		return json({
			success: true,
			data: { affectedCount: result.count },
			message
		});

	} catch (error) {
		console.error('Bulk monitor operation error:', error);

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