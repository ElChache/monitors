// MonitorHub Admin Individual User Management API
// GET /api/admin/users/[userId] - Get user details with activity
// PUT /api/admin/users/[userId] - Update user (status, role, etc.)
// DELETE /api/admin/users/[userId] - Soft delete user

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import { AuthService } from '$lib/services/auth.service';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const updateUserSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	isActive: z.boolean().optional(),
	isAdmin: z.boolean().optional()
});

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const { userId } = params;

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

		// Get user with detailed information
		const user = await db.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				isActive: true,
				isAdmin: true,
				createdAt: true,
				updatedAt: true,
				monitors: {
					select: {
						id: true,
						name: true,
						isActive: true,
						monitorType: true,
						createdAt: true,
						_count: {
							select: {
								evaluations: true
							}
						}
					},
					orderBy: { createdAt: 'desc' }
				},
				_count: {
					select: {
						monitors: true,
						sessions: true
					}
				}
			}
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Get user activity statistics
		const [recentEvaluations, monitorAlerts] = await Promise.all([
			db.monitorEvaluation.count({
				where: {
					monitor: {
						userId: userId
					},
					evaluatedAt: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
					}
				}
			}),
			db.monitorEvaluation.count({
				where: {
					monitor: {
						userId: userId
					},
					evaluationResult: true,
					evaluatedAt: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
					}
				}
			})
		]);

		// Get recent session activity
		const recentSessions = await db.session.findMany({
			where: { userId },
			orderBy: { expires: 'desc' },
			take: 5,
			select: {
				id: true,
				expires: true
			}
		});

		return json({
			success: true,
			data: {
				...user,
				activity: {
					recentEvaluations,
					monitorAlerts,
					recentSessions: recentSessions.length,
					lastSessionExpiry: recentSessions[0]?.expires || null
				}
			}
		});

	} catch (error) {
		console.error('Get user details error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { userId } = params;

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

		// Prevent self-demotion
		if (userId === session.user.id) {
			return json({ error: 'Cannot modify your own admin status' }, { status: 400 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = updateUserSchema.parse(body);

		// Update user
		const updatedUser = await db.user.update({
			where: { id: userId },
			data: validatedData,
			select: {
				id: true,
				email: true,
				name: true,
				isActive: true,
				isAdmin: true,
				updatedAt: true
			}
		});

		return json({
			success: true,
			data: updatedUser,
			message: 'User updated successfully'
		});

	} catch (error) {
		console.error('Update user error:', error);

		if (error instanceof z.ZodError) {
			return json({
				error: 'Validation failed',
				details: error.errors
			}, { status: 400 });
		}

		if (error.code === 'P2025') {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const { userId } = params;

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

		// Prevent self-deletion
		if (userId === session.user.id) {
			return json({ error: 'Cannot delete your own account' }, { status: 400 });
		}

		// Soft delete user (deactivate instead of hard delete)
		const deletedUser = await db.user.update({
			where: { id: userId },
			data: { 
				isActive: false,
				updatedAt: new Date()
			},
			select: {
				id: true,
				email: true,
				name: true,
				isActive: true
			}
		});

		// Also deactivate all user's monitors
		await db.monitor.updateMany({
			where: { userId },
			data: { isActive: false }
		});

		return json({
			success: true,
			data: deletedUser,
			message: 'User account deactivated successfully'
		});

	} catch (error) {
		console.error('Delete user error:', error);

		if (error.code === 'P2025') {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};