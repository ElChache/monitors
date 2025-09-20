// MonitorHub Admin Service
// Centralized admin operations and dashboard support

import { db } from '$lib/database';
import { AuthService } from './auth.service';
import { BackgroundJobService } from './background.service';
import { aiService } from '$lib/ai/ai.service';
// Removed unused Prisma type imports

export interface AdminDashboardData {
	overview: {
		totalUsers: number;
		activeUsers: number;
		totalMonitors: number;
		activeMonitors: number;
		evaluationsToday: number;
		alertsToday: number;
	};
	systemHealth: {
		status: 'healthy' | 'degraded' | 'unhealthy';
		components: {
			database: boolean;
			backgroundJobs: boolean;
			aiService: boolean;
		};
	};
	recentActivity: Array<{
		type: 'user_registration' | 'monitor_created' | 'alert_triggered';
		timestamp: Date;
		description: string;
		userId?: string;
		userName?: string;
	}>;
}

export interface UserManagementFilters {
	search?: string;
	status?: 'active' | 'inactive' | 'all';
	role?: 'admin' | 'user' | 'all';
	page?: number;
	limit?: number;
}

export interface UserWithCount {
	id: string;
	email: string;
	name: string;
	isActive: boolean;
	isAdmin: boolean;
	createdAt: Date;
	updatedAt: Date;
	_count: {
		monitors: number;
	};
}

export interface UserManagementResult {
	users: UserWithCount[];
	pagination: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
	};
}

export interface MonitorWithAnalytics {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
	monitorType: string;
	naturalLanguagePrompt: string;
	frequency: number;
	createdAt: Date;
	updatedAt: Date;
	userId: string;
	user: {
		id: string;
		email: string;
		name: string;
	};
	_count: {
		evaluations: number;
	};
	analytics: {
		alertsLast30Days: number;
		lastEvaluation: {
			evaluatedAt: Date;
			evaluationResult: boolean;
		} | null;
	};
}

export interface MonitorOversightResult {
	monitors: MonitorWithAnalytics[];
	pagination: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
	};
}

type UserWhereInput = {
	OR?: Array<{
		email?: { contains: string; mode: 'insensitive' };
		name?: { contains: string; mode: 'insensitive' };
	}>;
	isActive?: boolean;
	isAdmin?: boolean;
};

type MonitorWhereInput = {
	OR?: Array<{
		name?: { contains: string; mode: 'insensitive' };
		description?: { contains: string; mode: 'insensitive' };
	}>;
	isActive?: boolean;
	monitorType?: string;
	userId?: string;
};

export interface MonitorOversightFilters {
	search?: string;
	status?: 'active' | 'inactive' | 'all';
	type?: string;
	userId?: string;
	alerts?: 'triggered' | 'silent' | 'all';
	page?: number;
	limit?: number;
}

export class AdminService {
	/**
	 * Verify admin privileges for a user
	 */
	static async verifyAdminAccess(userId: string): Promise<boolean> {
		return await AuthService.isAdmin(userId);
	}

	/**
	 * Get comprehensive admin dashboard data
	 */
	static async getDashboardData(): Promise<AdminDashboardData> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const [
			totalUsers,
			activeUsers,
			totalMonitors,
			activeMonitors,
			evaluationsToday,
			alertsToday,
			recentUsers,
			recentMonitors,
			recentAlerts
		] = await Promise.all([
			db.user.count(),
			db.user.count({ where: { isActive: true } }),
			db.monitor.count(),
			db.monitor.count({ where: { isActive: true } }),
			db.monitorEvaluation.count({
				where: { evaluatedAt: { gte: today } }
			}),
			db.monitorEvaluation.count({
				where: { 
					evaluatedAt: { gte: today },
					evaluationResult: true 
				}
			}),
			// Recent activity data
			db.user.findMany({
				where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
				select: { id: true, name: true, email: true, createdAt: true },
				orderBy: { createdAt: 'desc' },
				take: 10
			}),
			db.monitor.findMany({
				where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
				include: { user: { select: { id: true, name: true } } },
				orderBy: { createdAt: 'desc' },
				take: 10
			}),
			db.monitorEvaluation.findMany({
				where: { 
					evaluatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
					evaluationResult: true 
				},
				include: { 
					monitor: { 
						include: { user: { select: { id: true, name: true } } } 
					} 
				},
				orderBy: { evaluatedAt: 'desc' },
				take: 10
			})
		]);

		// System health check
		const jobStatus = BackgroundJobService.getQueueStatus();
		const systemHealth = {
			status: 'healthy' as const,
			components: {
				database: true, // If we got here, database is working
				backgroundJobs: jobStatus.processorRunning,
				aiService: aiService.getCurrentProvider() !== null
			}
		};

		// Determine overall health
		const healthyComponents = Object.values(systemHealth.components).filter(Boolean).length;
		if (healthyComponents < 3) {
			systemHealth.status = healthyComponents >= 2 ? 'degraded' : 'unhealthy';
		}

		// Compile recent activity
		const recentActivity = [
			...recentUsers.map(user => ({
				type: 'user_registration' as const,
				timestamp: user.createdAt,
				description: `New user registered: ${user.name} (${user.email})`,
				userId: user.id,
				userName: user.name
			})),
			...recentMonitors.map(monitor => ({
				type: 'monitor_created' as const,
				timestamp: monitor.createdAt,
				description: `Monitor created: ${monitor.name} by ${monitor.user.name}`,
				userId: monitor.user.id,
				userName: monitor.user.name
			})),
			...recentAlerts.map(alert => ({
				type: 'alert_triggered' as const,
				timestamp: alert.evaluatedAt,
				description: `Alert triggered: ${alert.monitor.name}`,
				userId: alert.monitor.user.id,
				userName: alert.monitor.user.name
			}))
		].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

		return {
			overview: {
				totalUsers,
				activeUsers,
				totalMonitors,
				activeMonitors,
				evaluationsToday,
				alertsToday
			},
			systemHealth,
			recentActivity
		};
	}

	/**
	 * Get paginated users with filtering
	 */
	static async getUsers(filters: UserManagementFilters = {}): Promise<UserManagementResult> {
		const {
			search = '',
			status = 'all',
			role = 'all',
			page = 1,
			limit = 20
		} = filters;

		const skip = (page - 1) * limit;

		// Build where clause
		const where: UserWhereInput = {};

		if (search) {
			where.OR = [
				{ email: { contains: search, mode: 'insensitive' } },
				{ name: { contains: search, mode: 'insensitive' } }
			];
		}

		if (status === 'active') {
			where.isActive = true;
		} else if (status === 'inactive') {
			where.isActive = false;
		}

		if (role === 'admin') {
			where.isAdmin = true;
		} else if (role === 'user') {
			where.isAdmin = false;
		}

		const [users, totalCount] = await Promise.all([
			db.user.findMany({
				where,
				select: {
					id: true,
					email: true,
					name: true,
					isActive: true,
					isAdmin: true,
					createdAt: true,
					updatedAt: true,
					_count: {
						select: {
							monitors: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit
			}),
			db.user.count({ where })
		]);

		return {
			users,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages: Math.ceil(totalCount / limit)
			}
		};
	}

	/**
	 * Get paginated monitors with filtering
	 */
	static async getMonitors(filters: MonitorOversightFilters = {}): Promise<MonitorOversightResult> {
		const {
			search = '',
			status = 'all',
			type,
			userId,
			alerts = 'all',
			page = 1,
			limit = 20
		} = filters;

		const skip = (page - 1) * limit;

		// Build where clause
		const where: MonitorWhereInput = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } }
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

		const [monitors, totalCount] = await Promise.all([
			db.monitor.findMany({
				where,
				include: {
					user: {
						select: {
							id: true,
							email: true,
							name: true
						}
					},
					_count: {
						select: {
							evaluations: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit
			}),
			db.monitor.count({ where })
		]);

		// Add analytics for each monitor if needed
		const monitorsWithAnalytics = await Promise.all(
			monitors.map(async (monitor) => {
				const [alertsLast30Days, lastEvaluation] = await Promise.all([
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
						where: { monitorId: monitor.id },
						orderBy: { evaluatedAt: 'desc' },
						select: { 
							evaluatedAt: true, 
							evaluationResult: true 
						}
					})
				]);

				return {
					...monitor,
					analytics: {
						alertsLast30Days,
						lastEvaluation
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

		return {
			monitors: filteredMonitors,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages: Math.ceil(totalCount / limit)
			}
		};
	}

	/**
	 * Bulk operations on users
	 */
	static async bulkUserOperation(operation: 'activate' | 'deactivate', userIds: string[]): Promise<number> {
		const isActive = operation === 'activate';
		
		const result = await db.user.updateMany({
			where: { id: { in: userIds } },
			data: { isActive }
		});

		return result.count;
	}

	/**
	 * Bulk operations on monitors
	 */
	static async bulkMonitorOperation(operation: 'activate' | 'deactivate' | 'delete', monitorIds: string[]): Promise<number> {
		let result;

		switch (operation) {
			case 'activate':
				result = await db.monitor.updateMany({
					where: { id: { in: monitorIds } },
					data: { isActive: true }
				});
				break;
			case 'deactivate':
			case 'delete': // Soft delete
				result = await db.monitor.updateMany({
					where: { id: { in: monitorIds } },
					data: { isActive: false }
				});
				break;
		}

		return result.count;
	}

	/**
	 * Get system statistics for dashboard
	 */
	static async getSystemStatistics() {
		return await BackgroundJobService.getJobStatistics();
	}

	/**
	 * Manual trigger for background job processing
	 */
	static async triggerBackgroundProcessing(): Promise<void> {
		await BackgroundJobService.processQueueNow();
	}

	/**
	 * Get AI service metrics and status
	 */
	static getAIServiceStatus() {
		return {
			currentProvider: aiService.getCurrentProvider(),
			costSummary: aiService.getCostSummary(),
			usageMetrics: aiService.getUsageMetrics().slice(-50) // Last 50 requests
		};
	}
}