import { EmailService, type MonitorNotificationData, type UserVerificationData, type PasswordResetData } from './service';
import { EmailTrackingService, EmailTemplateRenderer } from './templates';
import { db } from '../db';
import { users } from '../../db/schemas/users';
import { monitors } from '../../db/schemas/monitors';
import { eq } from 'drizzle-orm';

/**
 * Integrated email service that works with the application's user and monitor systems
 */
export class IntegratedEmailService {
  
  /**
   * Send monitor notification with full database integration
   */
  static async sendMonitorNotification(
    monitorId: string,
    currentValue: any,
    previousValue: any = null
  ): Promise<boolean> {
    try {
      // Get monitor and user details from database
      const monitorResult = await db
        .select({
          monitor: monitors,
          user: users
        })
        .from(monitors)
        .innerJoin(users, eq(monitors.userId, users.id))
        .where(eq(monitors.id, monitorId))
        .limit(1);

      if (monitorResult.length === 0) {
        console.error('Monitor or user not found:', monitorId);
        return false;
      }

      const { monitor, user } = monitorResult[0];

      // Check if user is unsubscribed from monitor notifications
      const isUnsubscribed = await EmailTrackingService.isUnsubscribed(
        user.id,
        'monitor_notifications'
      );

      if (isUnsubscribed) {
        console.log(`User ${user.email} is unsubscribed from monitor notifications`);
        return true; // Return true as it's not an error, just skipped
      }

      // Generate URLs
      const baseUrl = process.env.APP_URL || 'https://monitors.app';
      const monitorUrl = `${baseUrl}/monitors/${monitor.id}`;
      const dashboardUrl = `${baseUrl}/dashboard`;
      const unsubscribeUrl = EmailTrackingService.generateUnsubscribeUrl(
        user.id,
        'monitor_notifications'
      );

      // Prepare notification data
      const notificationData: MonitorNotificationData = {
        monitorName: monitor.name,
        userName: user.name || user.email.split('@')[0],
        currentValue,
        previousValue,
        triggerCondition: monitor.triggerCondition,
        monitorUrl,
        dashboardUrl,
        unsubscribeUrl
      };

      // Send email
      const success = await EmailService.sendMonitorNotification(
        user.email,
        notificationData
      );

      // Log delivery attempt
      await EmailTrackingService.logDelivery(
        user.id,
        user.email,
        'monitor_notification',
        `Monitor Alert: ${monitor.name}`,
        { success, messageId: success ? `monitor_${monitorId}_${Date.now()}` : undefined }
      );

      return success;

    } catch (error) {
      console.error('Failed to send monitor notification:', error);
      return false;
    }
  }

  /**
   * Send user verification email with database integration
   */
  static async sendUserVerification(userId: string, verificationToken: string): Promise<boolean> {
    try {
      // Get user details
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        console.error('User not found:', userId);
        return false;
      }

      const user = userResult[0];

      // Generate verification URL
      const baseUrl = process.env.APP_URL || 'https://monitors.app';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      // Prepare verification data
      const verificationData: UserVerificationData = {
        userName: user.name || user.email.split('@')[0],
        verificationUrl,
        expirationHours: 24
      };

      // Send email
      const success = await EmailService.sendUserVerification(
        user.email,
        verificationData
      );

      // Log delivery attempt
      await EmailTrackingService.logDelivery(
        user.id,
        user.email,
        'user_verification',
        'Verify your Monitors! account',
        { success, messageId: success ? `verify_${userId}_${Date.now()}` : undefined }
      );

      return success;

    } catch (error) {
      console.error('Failed to send user verification email:', error);
      return false;
    }
  }

  /**
   * Send password reset email with database integration
   */
  static async sendPasswordReset(userId: string, resetToken: string): Promise<boolean> {
    try {
      // Get user details
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        console.error('User not found:', userId);
        return false;
      }

      const user = userResult[0];

      // Generate reset URL
      const baseUrl = process.env.APP_URL || 'https://monitors.app';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // Prepare reset data
      const resetData: PasswordResetData = {
        userName: user.name || user.email.split('@')[0],
        resetUrl,
        expirationHours: 2
      };

      // Send email
      const success = await EmailService.sendPasswordReset(
        user.email,
        resetData
      );

      // Log delivery attempt
      await EmailTrackingService.logDelivery(
        user.id,
        user.email,
        'password_reset',
        'Reset your Monitors! password',
        { success, messageId: success ? `reset_${userId}_${Date.now()}` : undefined }
      );

      return success;

    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send bulk monitor notifications (for scheduled evaluations)
   */
  static async sendBulkMonitorNotifications(
    notifications: Array<{
      monitorId: string;
      currentValue: any;
      previousValue?: any;
    }>
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    // Process notifications with rate limiting to avoid overwhelming SES
    for (const notification of notifications) {
      try {
        const success = await this.sendMonitorNotification(
          notification.monitorId,
          notification.currentValue,
          notification.previousValue
        );

        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Rate limiting: wait 100ms between emails to avoid SES limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error('Failed to send bulk notification:', error);
        failed++;
      }
    }

    console.log(`Bulk notification results: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Get user email preferences (for future implementation)
   */
  static async getUserEmailPreferences(userId: string): Promise<{
    monitorNotifications: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
  }> {
    try {
      // Check unsubscribe status for each notification type
      const [monitorUnsub, weeklyUnsub, marketingUnsub] = await Promise.all([
        EmailTrackingService.isUnsubscribed(userId, 'monitor_notifications'),
        EmailTrackingService.isUnsubscribed(userId, 'weekly_digest'),
        EmailTrackingService.isUnsubscribed(userId, 'marketing_emails')
      ]);

      return {
        monitorNotifications: !monitorUnsub,
        weeklyDigest: !weeklyUnsub,
        marketingEmails: !marketingUnsub
      };

    } catch (error) {
      console.error('Failed to get email preferences:', error);
      // Default to opt-in for essential notifications, opt-out for marketing
      return {
        monitorNotifications: true,
        weeklyDigest: true,
        marketingEmails: false
      };
    }
  }

  /**
   * Update user email preferences
   */
  static async updateEmailPreferences(
    userId: string,
    preferences: {
      monitorNotifications?: boolean;
      weeklyDigest?: boolean;
      marketingEmails?: boolean;
    }
  ): Promise<boolean> {
    try {
      const actions = [];

      // Handle each preference type
      if (preferences.monitorNotifications !== undefined) {
        if (preferences.monitorNotifications) {
          // Re-subscribe: remove unsubscribe record (if exists)
          // Note: This would require a delete operation in a real implementation
        } else {
          actions.push(
            EmailTrackingService.unsubscribe(userId, 'monitor_notifications')
          );
        }
      }

      if (preferences.weeklyDigest !== undefined) {
        if (!preferences.weeklyDigest) {
          actions.push(
            EmailTrackingService.unsubscribe(userId, 'weekly_digest')
          );
        }
      }

      if (preferences.marketingEmails !== undefined) {
        if (!preferences.marketingEmails) {
          actions.push(
            EmailTrackingService.unsubscribe(userId, 'marketing_emails')
          );
        }
      }

      // Execute all unsubscribe actions
      await Promise.all(actions);
      return true;

    } catch (error) {
      console.error('Failed to update email preferences:', error);
      return false;
    }
  }
}