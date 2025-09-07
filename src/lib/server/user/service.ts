import { db } from '../db';
import { users, sessions, userPreferences } from '../../db/schemas/users';
import { monitors } from '../../db/schemas/monitors';
import { eq, and, desc, count } from 'drizzle-orm';
import { AuthService } from '../auth/service';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isBetaUser: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  monitorCount: number;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface UserSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrentSession: boolean;
}

export interface UserAccountData {
  profile: UserProfile;
  preferences: UserPreferences;
  sessions: UserSession[];
  monitors: Array<{
    id: string;
    name: string;
    createdAt: Date;
    isActive: boolean;
  }>;
  statistics: {
    totalMonitors: number;
    activeMonitors: number;
    totalEvaluations: number;
    accountAge: number; // days
  };
}

/**
 * User account management service
 */
export class UserAccountService {
  /**
   * Get user profile with statistics
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const [userResult] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          emailVerified: users.emailVerified,
          isBetaUser: users.isBetaUser,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          monitorCount: count(monitors.id),
        })
        .from(users)
        .leftJoin(monitors, eq(users.id, monitors.userId))
        .where(eq(users.id, userId))
        .groupBy(users.id);

      if (!userResult) {
        throw new Error('User not found');
      }

      return {
        id: userResult.id,
        email: userResult.email,
        name: userResult.name,
        emailVerified: userResult.emailVerified,
        isBetaUser: userResult.isBetaUser,
        isActive: userResult.isActive,
        createdAt: userResult.createdAt,
        lastLoginAt: userResult.lastLoginAt,
        monitorCount: userResult.monitorCount || 0,
      };

    } catch (error) {
      console.error('Get user profile error:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(
    userId: string,
    updates: {
      name?: string;
      email?: string;
    }
  ): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }

      if (updates.email !== undefined) {
        updateData.email = updates.email;
        // Reset email verification if email changed
        updateData.emailVerified = false;
      }

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));

    } catch (error) {
      console.error('Update user profile error:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

      if (!preferences) {
        // Return default preferences
        return {
          emailNotifications: true,
          pushNotifications: false,
          notificationFrequency: 'immediate',
          timezone: 'UTC',
          theme: 'light',
          language: 'en',
        };
      }

      return {
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        notificationFrequency: preferences.notificationFrequency as any,
        timezone: preferences.timezone,
        theme: preferences.theme as any,
        language: preferences.language,
      };

    } catch (error) {
      console.error('Get user preferences error:', error);
      throw new Error('Failed to retrieve user preferences');
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const updateData = {
        userId,
        emailNotifications: preferences.emailNotifications ?? true,
        pushNotifications: preferences.pushNotifications ?? false,
        notificationFrequency: preferences.notificationFrequency ?? 'immediate',
        timezone: preferences.timezone ?? 'UTC',
        theme: preferences.theme ?? 'light',
        language: preferences.language ?? 'en',
        updatedAt: new Date(),
      };

      // Try to update existing preferences
      const existingPrefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

      if (existingPrefs.length > 0) {
        await db.update(userPreferences)
          .set(updateData)
          .where(eq(userPreferences.userId, userId));
      } else {
        await db.insert(userPreferences).values({
          ...updateData,
          createdAt: new Date(),
        });
      }

    } catch (error) {
      console.error('Update user preferences error:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  /**
   * Get user sessions
   */
  static async getUserSessions(userId: string, currentSessionId?: string): Promise<UserSession[]> {
    try {
      const sessionResults = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.lastActiveAt));

      return sessionResults.map(session => ({
        id: session.id,
        deviceInfo: session.deviceInfo || 'Unknown Device',
        ipAddress: session.ipAddress || 'Unknown IP',
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt || session.createdAt,
        isCurrentSession: session.id === currentSessionId,
      }));

    } catch (error) {
      console.error('Get user sessions error:', error);
      throw new Error('Failed to retrieve user sessions');
    }
  }

  /**
   * Revoke user session
   */
  static async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      await db.delete(sessions)
        .where(and(
          eq(sessions.userId, userId),
          eq(sessions.id, sessionId)
        ));

    } catch (error) {
      console.error('Revoke user session error:', error);
      throw new Error('Failed to revoke user session');
    }
  }

  /**
   * Revoke all user sessions except current
   */
  static async revokeAllUserSessions(userId: string, currentSessionId?: string): Promise<void> {
    try {
      const conditions = [eq(sessions.userId, userId)];
      
      if (currentSessionId) {
        conditions.push(eq(sessions.id, currentSessionId));
      }

      await db.delete(sessions)
        .where(and(...conditions));

    } catch (error) {
      console.error('Revoke all user sessions error:', error);
      throw new Error('Failed to revoke user sessions');
    }
  }

  /**
   * Get complete user account data for GDPR export
   */
  static async getUserAccountData(userId: string): Promise<UserAccountData> {
    try {
      const [profile, preferences, sessionList] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserPreferences(userId),
        this.getUserSessions(userId)
      ]);

      // Get user monitors
      const userMonitors = await db
        .select({
          id: monitors.id,
          name: monitors.name,
          createdAt: monitors.createdAt,
          isActive: monitors.isActive,
        })
        .from(monitors)
        .where(eq(monitors.userId, userId))
        .orderBy(desc(monitors.createdAt));

      // Calculate statistics
      const now = new Date();
      const accountAge = Math.floor(
        (now.getTime() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const activeMonitors = userMonitors.filter(m => m.isActive).length;

      return {
        profile,
        preferences,
        sessions: sessionList,
        monitors: userMonitors,
        statistics: {
          totalMonitors: userMonitors.length,
          activeMonitors,
          totalEvaluations: 0, // Would need to query monitor evaluations
          accountAge,
        },
      };

    } catch (error) {
      console.error('Get user account data error:', error);
      throw new Error('Failed to retrieve user account data');
    }
  }

  /**
   * Delete user account and all associated data
   */
  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      // In a real implementation, this would be a database transaction
      // Delete in order: evaluations, monitors, sessions, preferences, user

      // Delete monitors (this would cascade to evaluations in a real schema)
      await db.delete(monitors).where(eq(monitors.userId, userId));
      
      // Delete sessions
      await db.delete(sessions).where(eq(sessions.userId, userId));
      
      // Delete preferences
      await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
      
      // Finally delete user
      await db.delete(users).where(eq(users.id, userId));

    } catch (error) {
      console.error('Delete user account error:', error);
      throw new Error('Failed to delete user account');
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user to verify current password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user || !user.passwordHash) {
        throw new Error('User not found or using OAuth authentication');
      }

      // Verify current password
      const { PasswordService } = await import('../auth/password');
      const isCurrentPasswordValid = await PasswordService.verifyPassword(
        currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await PasswordService.hashPassword(newPassword);

      // Update password
      await db.update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Revoke all sessions to force re-login
      await this.revokeAllUserSessions(userId);

    } catch (error) {
      console.error('Change password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to change password');
    }
  }
}