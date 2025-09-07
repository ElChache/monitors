import { db } from "./db.js";
import { m as monitors, u as users, h as userPreferences, s as sessions } from "./users.js";
import { count, eq, desc, and } from "drizzle-orm";
import "./service2.js";
class UserAccountService {
  /**
   * Get user profile with statistics
   */
  static async getUserProfile(userId) {
    try {
      const [userResult] = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
        isBetaUser: users.isBetaUser,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        monitorCount: count(monitors.id)
      }).from(users).leftJoin(monitors, eq(users.id, monitors.userId)).where(eq(users.id, userId)).groupBy(users.id);
      if (!userResult) {
        throw new Error("User not found");
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
        monitorCount: userResult.monitorCount || 0
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      throw new Error("Failed to retrieve user profile");
    }
  }
  /**
   * Update user profile information
   */
  static async updateUserProfile(userId, updates) {
    try {
      const updateData = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (updates.name !== void 0) {
        updateData.name = updates.name;
      }
      if (updates.email !== void 0) {
        updateData.email = updates.email;
        updateData.emailVerified = false;
      }
      await db.update(users).set(updateData).where(eq(users.id, userId));
    } catch (error) {
      console.error("Update user profile error:", error);
      throw new Error("Failed to update user profile");
    }
  }
  /**
   * Get user preferences
   */
  static async getUserPreferences(userId) {
    try {
      const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
      if (!preferences) {
        return {
          emailNotifications: true,
          pushNotifications: false,
          notificationFrequency: "immediate",
          timezone: "UTC",
          theme: "light",
          language: "en"
        };
      }
      return {
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        notificationFrequency: preferences.notificationFrequency,
        timezone: preferences.timezone,
        theme: preferences.theme,
        language: preferences.language
      };
    } catch (error) {
      console.error("Get user preferences error:", error);
      throw new Error("Failed to retrieve user preferences");
    }
  }
  /**
   * Update user preferences
   */
  static async updateUserPreferences(userId, preferences) {
    try {
      const updateData = {
        userId,
        emailNotifications: preferences.emailNotifications ?? true,
        pushNotifications: preferences.pushNotifications ?? false,
        notificationFrequency: preferences.notificationFrequency ?? "immediate",
        timezone: preferences.timezone ?? "UTC",
        theme: preferences.theme ?? "light",
        language: preferences.language ?? "en",
        updatedAt: /* @__PURE__ */ new Date()
      };
      const existingPrefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
      if (existingPrefs.length > 0) {
        await db.update(userPreferences).set(updateData).where(eq(userPreferences.userId, userId));
      } else {
        await db.insert(userPreferences).values({
          ...updateData,
          createdAt: /* @__PURE__ */ new Date()
        });
      }
    } catch (error) {
      console.error("Update user preferences error:", error);
      throw new Error("Failed to update user preferences");
    }
  }
  /**
   * Get user sessions
   */
  static async getUserSessions(userId, currentSessionId) {
    try {
      const sessionResults = await db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.lastActiveAt));
      return sessionResults.map((session) => ({
        id: session.id,
        deviceInfo: session.deviceInfo || "Unknown Device",
        ipAddress: session.ipAddress || "Unknown IP",
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt || session.createdAt,
        isCurrentSession: session.id === currentSessionId
      }));
    } catch (error) {
      console.error("Get user sessions error:", error);
      throw new Error("Failed to retrieve user sessions");
    }
  }
  /**
   * Revoke user session
   */
  static async revokeUserSession(userId, sessionId) {
    try {
      await db.delete(sessions).where(and(
        eq(sessions.userId, userId),
        eq(sessions.id, sessionId)
      ));
    } catch (error) {
      console.error("Revoke user session error:", error);
      throw new Error("Failed to revoke user session");
    }
  }
  /**
   * Revoke all user sessions except current
   */
  static async revokeAllUserSessions(userId, currentSessionId) {
    try {
      const conditions = [eq(sessions.userId, userId)];
      if (currentSessionId) {
        conditions.push(eq(sessions.id, currentSessionId));
      }
      await db.delete(sessions).where(and(...conditions));
    } catch (error) {
      console.error("Revoke all user sessions error:", error);
      throw new Error("Failed to revoke user sessions");
    }
  }
  /**
   * Get complete user account data for GDPR export
   */
  static async getUserAccountData(userId) {
    try {
      const [profile, preferences, sessionList] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserPreferences(userId),
        this.getUserSessions(userId)
      ]);
      const userMonitors = await db.select({
        id: monitors.id,
        name: monitors.name,
        createdAt: monitors.createdAt,
        isActive: monitors.isActive
      }).from(monitors).where(eq(monitors.userId, userId)).orderBy(desc(monitors.createdAt));
      const now = /* @__PURE__ */ new Date();
      const accountAge = Math.floor(
        (now.getTime() - profile.createdAt.getTime()) / (1e3 * 60 * 60 * 24)
      );
      const activeMonitors = userMonitors.filter((m) => m.isActive).length;
      return {
        profile,
        preferences,
        sessions: sessionList,
        monitors: userMonitors,
        statistics: {
          totalMonitors: userMonitors.length,
          activeMonitors,
          totalEvaluations: 0,
          // Would need to query monitor evaluations
          accountAge
        }
      };
    } catch (error) {
      console.error("Get user account data error:", error);
      throw new Error("Failed to retrieve user account data");
    }
  }
  /**
   * Delete user account and all associated data
   */
  static async deleteUserAccount(userId) {
    try {
      await db.delete(monitors).where(eq(monitors.userId, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error("Delete user account error:", error);
      throw new Error("Failed to delete user account");
    }
  }
  /**
   * Change user password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.passwordHash) {
        throw new Error("User not found or using OAuth authentication");
      }
      const { PasswordService } = await import("./service2.js").then((n) => n.p);
      const isCurrentPasswordValid = await PasswordService.verifyPassword(
        currentPassword,
        user.passwordHash
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }
      const newPasswordHash = await PasswordService.hashPassword(newPassword);
      await db.update(users).set({
        passwordHash: newPasswordHash,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId));
      await this.revokeAllUserSessions(userId);
    } catch (error) {
      console.error("Change password error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to change password");
    }
  }
}
export {
  UserAccountService as U
};
