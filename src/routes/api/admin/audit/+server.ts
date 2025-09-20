// MonitorHub Admin Audit Logging API
// GET /api/admin/audit - Get audit logs with filtering and pagination

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
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

		// Parse query parameters
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');
		const action = url.searchParams.get('action'); // 'create', 'update', 'delete', 'login'
		const entityType = url.searchParams.get('entityType'); // 'user', 'monitor', 'system'
		const userId = url.searchParams.get('userId');

		const skip = (page - 1) * limit;

		// Since we don't have a dedicated audit table, we'll create audit logs from existing data
		// In a production system, you'd want a proper audit logging table
		const auditLogs = await generateAuditLogs({
			startDate: startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			endDate: endDate ? new Date(endDate) : new Date(),
			action,
			entityType,
			userId,
			skip,
			limit
		});

		return json({
			success: true,
			data: auditLogs
		});

	} catch (error) {
		console.error('Admin audit logs error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

async function generateAuditLogs({
	startDate,
	endDate,
	action,
	entityType,
	userId,
	skip,
	limit
}: {
	startDate: Date;
	endDate: Date;
	action?: string | null;
	entityType?: string | null;
	userId?: string | null;
	skip: number;
	limit: number;
}) {
	const logs = [];

	// User registrations
	if (!entityType || entityType === 'user') {
		const userRegistrations = await db.user.findMany({
			where: {
				createdAt: { gte: startDate, lte: endDate },
				...(userId && { id: userId })
			},
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true
			},
			orderBy: { createdAt: 'desc' }
		});

		for (const user of userRegistrations) {
			if (!action || action === 'create') {
				logs.push({
					id: `user-create-${user.id}`,
					timestamp: user.createdAt,
					action: 'create',
					entityType: 'user',
					entityId: user.id,
					userId: user.id,
					userEmail: user.email,
					details: {
						type: 'USER_REGISTRATION',
						userName: user.name,
						userEmail: user.email
					},
					severity: 'info'
				});
			}
		}
	}

	// Monitor creation/updates
	if (!entityType || entityType === 'monitor') {
		const monitors = await db.monitor.findMany({
			where: {
				createdAt: { gte: startDate, lte: endDate },
				...(userId && { userId })
			},
			include: {
				user: {
					select: {
						email: true,
						name: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		for (const monitor of monitors) {
			if (!action || action === 'create') {
				logs.push({
					id: `monitor-create-${monitor.id}`,
					timestamp: monitor.createdAt,
					action: 'create',
					entityType: 'monitor',
					entityId: monitor.id,
					userId: monitor.userId,
					userEmail: monitor.user.email,
					details: {
						type: 'MONITOR_CREATED',
						monitorName: monitor.name,
						monitorType: monitor.monitorType
					},
					severity: 'info'
				});
			}
		}
	}

	// Action executions (notifications sent)
	if (!entityType || entityType === 'system') {
		const actionExecutions = await db.actionExecution.findMany({
			where: {
				executedAt: { gte: startDate, lte: endDate }
			},
			include: {
				monitorAction: {
					include: {
						monitor: {
							include: {
								user: {
									select: {
										id: true,
										email: true,
										name: true
									}
								}
							}
						}
					}
				}
			},
			orderBy: { executedAt: 'desc' }
		});

		for (const execution of actionExecutions) {
			const user = execution.monitorAction.monitor.user;
			if (userId && user.id !== userId) continue;

			if (!action || action === 'notification') {
				logs.push({
					id: `action-exec-${execution.id}`,
					timestamp: execution.executedAt,
					action: 'notification',
					entityType: 'system',
					entityId: execution.id,
					userId: user.id,
					userEmail: user.email,
					details: {
						type: 'NOTIFICATION_SENT',
						monitorName: execution.monitorAction.monitor.name,
						actionType: execution.monitorAction.actionType,
						status: execution.executionStatus,
						error: execution.errorMessage
					},
					severity: execution.executionStatus === 'failed' ? 'error' : 'info'
				});
			}
		}
	}

	// Sort all logs by timestamp
	logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	// Apply pagination
	const paginatedLogs = logs.slice(skip, skip + limit);
	const totalCount = logs.length;
	const totalPages = Math.ceil(totalCount / limit);

	return {
		logs: paginatedLogs,
		pagination: {
			page: Math.floor(skip / limit) + 1,
			limit,
			totalCount,
			totalPages,
			hasNext: skip + limit < totalCount,
			hasPrev: skip > 0
		}
	};
}