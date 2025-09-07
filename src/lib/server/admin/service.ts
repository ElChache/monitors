import { db } from '../db';
import { users, sessions } from '../../db/schemas/users';
import { monitors } from '../../db/schemas/monitors';
import { eq, desc, count, and, gte, lte } from 'drizzle-orm';
import { AuthService } from '../auth/service';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  isBetaUser: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  monitorCount: number;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalMonitors: number;
  activeMonitors: number;
  todayRegistrations: number;
  weeklyActiveUsers: number;
  averageMonitorsPerUser: number;
}

export interface ServiceHealth {
  database: boolean;
  redis: boolean;
  email: boolean;
  monitoring: boolean;
  lastChecked: Date;
}

/**
 * Admin panel backend service
 */
export class AdminService {
  /**
   * Check if user has admin privileges
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      return user?.isAdmin || false;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }

  /**
   * Get paginated list of users for admin management
   */
  static async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'inactive';
    sortBy?: 'createdAt' | 'name' | 'email' | 'lastLoginAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    users: AdminUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 50,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    try {
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      
      if (search) {
        conditions.push(
          // Note: In a real implementation, you'd use proper text search
          // This is a simplified version for demo
        );
      }
      
      if (role === 'admin') {
        conditions.push(eq(users.isAdmin, true));
      } else if (role === 'user') {
        conditions.push(eq(users.isAdmin, false));
      }
      
      if (status === 'active') {
        conditions.push(eq(users.isActive, true));
      } else if (status === 'inactive') {
        conditions.push(eq(users.isActive, false));
      }

      // Get users with monitor counts
      const userQuery = db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          isAdmin: users.isAdmin,
          isActive: users.isActive,
          emailVerified: users.emailVerified,
          isBetaUser: users.isBetaUser,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          monitorCount: count(monitors.id),
        })
        .from(users)
        .leftJoin(monitors, eq(users.id, monitors.userId))
        .groupBy(users.id);

      if (conditions.length > 0) {
        userQuery.where(and(...conditions));
      }

      // Apply sorting
      if (sortBy === 'createdAt') {
        userQuery.orderBy(sortOrder === 'desc' ? desc(users.createdAt) : users.createdAt);
      } else if (sortBy === 'name') {
        userQuery.orderBy(sortOrder === 'desc' ? desc(users.name) : users.name);
      } else if (sortBy === 'email') {
        userQuery.orderBy(sortOrder === 'desc' ? desc(users.email) : users.email);
      }

      const [userResults, [{ total }]] = await Promise.all([
        userQuery.limit(limit).offset(offset),
        db.select({ total: count() }).from(users)
      ]);

      const adminUsers: AdminUser[] = userResults.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.isAdmin ? 'admin' : 'user',
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        isBetaUser: user.isBetaUser,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        monitorCount: user.monitorCount || 0,
      }));

      return {
        users: adminUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };

    } catch (error) {
      console.error('Get users error:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  /**
   * Update user role (admin/user)
   */
  static async updateUserRole(userId: string, isAdmin: boolean): Promise<void> {
    try {
      await db.update(users)
        .set({ isAdmin, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Update user role error:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Update user status (active/inactive)
   */
  static async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      await db.update(users)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Update user status error:', error);
      throw new Error('Failed to update user status');
    }
  }

  /**
   * Delete user and all associated data
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      // In a real implementation, this would be a transaction
      // First delete monitors, then sessions, then user
      await db.delete(monitors).where(eq(monitors.userId, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Delete user error:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStats(): Promise<SystemStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [
        [{ totalUsers }],
        [{ activeUsers }],
        [{ totalMonitors }],
        [{ activeMonitors }],
        [{ todayRegistrations }],
        [{ weeklyActiveUsers }]
      ] = await Promise.all([
        db.select({ totalUsers: count() }).from(users),
        db.select({ activeUsers: count() }).from(users).where(eq(users.isActive, true)),
        db.select({ totalMonitors: count() }).from(monitors),
        db.select({ activeMonitors: count() }).from(monitors).where(eq(monitors.isActive, true)),
        db.select({ todayRegistrations: count() }).from(users).where(gte(users.createdAt, today)),
        db.select({ weeklyActiveUsers: count() }).from(users).where(gte(users.lastLoginAt, weekAgo))
      ]);

      const averageMonitorsPerUser = totalUsers > 0 ? totalMonitors / totalUsers : 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalMonitors: totalMonitors || 0,
        activeMonitors: activeMonitors || 0,
        todayRegistrations: todayRegistrations || 0,
        weeklyActiveUsers: weeklyActiveUsers || 0,
        averageMonitorsPerUser: Math.round(averageMonitorsPerUser * 100) / 100
      };
    } catch (error) {
      console.error('Get system stats error:', error);
      throw new Error('Failed to retrieve system statistics');
    }
  }

  /**
   * Get service health status
   */
  static async getServiceHealth(): Promise<ServiceHealth> {
    const results = {
      database: false,
      redis: false,
      email: false,
      monitoring: false,
      lastChecked: new Date()
    };

    try {
      // Test database connection
      await db.select().from(users).limit(1);
      results.database = true;
    } catch {
      results.database = false;
    }

    try {
      // Test Redis connection
      const { redis } = await import('../../db/connection');
      await redis.ping();
      results.redis = true;
    } catch {
      results.redis = false;
    }

    try {
      // Test email service (simplified check)
      results.email = true; // Would test actual email service
    } catch {
      results.email = false;
    }

    try {
      // Test monitoring service
      results.monitoring = true; // Would test job queue health
    } catch {
      results.monitoring = false;
    }

    return results;
  }

  /**
   * Get system configuration
   */
  static async getSystemConfig(): Promise<{
    maxMonitorsPerUser: number;
    maxAlertsPerHour: number;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    betaMode: boolean;
  }> {
    // In a real implementation, this would come from database or environment
    return {
      maxMonitorsPerUser: 100,
      maxAlertsPerHour: 50,
      maintenanceMode: false,
      registrationEnabled: true,
      betaMode: false
    };
  }

  /**
   * Update system configuration
   */
  static async updateSystemConfig(config: {
    maxMonitorsPerUser?: number;
    maxAlertsPerHour?: number;
    maintenanceMode?: boolean;
    registrationEnabled?: boolean;
    betaMode?: boolean;
  }): Promise<void> {
    // In a real implementation, this would update database settings
    console.log('System config update:', config);
  }

  /**
   * Get recent admin activity feed
   */
  static async getActivityFeed(limit: number = 50): Promise<Array<{
    id: string;
    type: 'user_created' | 'user_deleted' | 'user_role_changed' | 'config_updated' | 'maintenance_mode';
    message: string;
    timestamp: Date;
    adminUserId?: string;
    targetUserId?: string;
    metadata?: Record<string, any>;
  }>> {
    // In a real implementation, this would come from an audit log table
    // For demo purposes, return mock data
    return [
      {
        id: '1',
        type: 'user_created',
        message: 'New user registered: john.doe@example.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        targetUserId: 'user-123'
      },
      {
        id: '2',
        type: 'config_updated',
        message: 'System configuration updated: Max monitors per user set to 100',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        adminUserId: 'admin-456'
      }
    ];
  }
}