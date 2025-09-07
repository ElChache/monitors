import { d as db } from './db-DnzjOtfS.js';
import { c as emailNotifications, d as emailUnsubscribes } from './users-4TgmiNes.js';
import { and, eq } from 'drizzle-orm';

const EMAIL_TEMPLATES = {
  MONITOR_NOTIFICATION: {
    name: "monitor_notification",
    subject: "🚨 Monitor Alert: {{monitorName}}",
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1>🚨 Monitor Alert</h1>
          <h2>{{monitorName}}</h2>
        </div>
        <div style="background: #f9fafb; padding: 20px;">
          <p>Hi {{userName}},</p>
          <p>Your monitor "<strong>{{monitorName}}</strong>" has been triggered!</p>
          <div style="background: white; padding: 15px; border-left: 4px solid #ef4444;">
            <h3>Trigger Details</h3>
            <p><strong>Condition:</strong> {{triggerCondition}}</p>
            <p><strong>Current Value:</strong> {{currentValue}}</p>
            {{#if previousValue}}<p><strong>Previous Value:</strong> {{previousValue}}</p>{{/if}}
          </div>
          <p style="text-align: center; margin: 20px 0;">
            <a href="{{monitorUrl}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 5px;">View Monitor</a>
            <a href="{{dashboardUrl}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 5px;">Dashboard</a>
          </p>
        </div>
        <div style="background: #374151; color: white; padding: 20px; text-align: center;">
          <p>© 2024 Monitors!</p>
          <p style="font-size: 12px;"><a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a></p>
        </div>
      </div>
    `,
    textTemplate: `
      MONITOR ALERT: {{monitorName}}
      
      Hi {{userName}},
      
      Your monitor "{{monitorName}}" has been triggered!
      
      Trigger Details:
      - Condition: {{triggerCondition}}
      - Current Value: {{currentValue}}
      {{#if previousValue}}- Previous Value: {{previousValue}}{{/if}}
      
      View Monitor: {{monitorUrl}}
      Dashboard: {{dashboardUrl}}
      
      Unsubscribe: {{unsubscribeUrl}}
      
      © 2024 Monitors!
    `,
    description: "Email sent when a monitor trigger condition is met"
  },
  USER_VERIFICATION: {
    name: "user_verification",
    subject: "Verify your Monitors! account",
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1>Welcome to Monitors!</h1>
        </div>
        <div style="background: #f9fafb; padding: 20px;">
          <p>Hi {{userName}},</p>
          <p>Thank you for signing up! Please verify your email address:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;">Verify Email</a>
          </p>
          <p>This link expires in {{expirationHours}} hours.</p>
          <p style="font-size: 14px; color: #6b7280;">{{verificationUrl}}</p>
        </div>
        <div style="background: #374151; color: white; padding: 20px; text-align: center;">
          <p>© 2024 Monitors!</p>
        </div>
      </div>
    `,
    textTemplate: `
      Welcome to Monitors!
      
      Hi {{userName}},
      
      Thank you for signing up! Please verify your email address:
      
      {{verificationUrl}}
      
      This link expires in {{expirationHours}} hours.
      
      © 2024 Monitors!
    `,
    description: "Email sent to new users for email verification"
  },
  PASSWORD_RESET: {
    name: "password_reset",
    subject: "Reset your Monitors! password",
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1>Password Reset</h1>
        </div>
        <div style="background: #f9fafb; padding: 20px;">
          <p>Hi {{userName}},</p>
          <p>We received a request to reset your password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;">Reset Password</a>
          </p>
          <p>This link expires in {{expirationHours}} hours.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p style="font-size: 14px; color: #6b7280;">{{resetUrl}}</p>
        </div>
        <div style="background: #374151; color: white; padding: 20px; text-align: center;">
          <p>© 2024 Monitors!</p>
        </div>
      </div>
    `,
    textTemplate: `
      Password Reset Request
      
      Hi {{userName}},
      
      We received a request to reset your password:
      
      {{resetUrl}}
      
      This link expires in {{expirationHours}} hours.
      
      If you didn't request this, you can safely ignore this email.
      
      © 2024 Monitors!
    `,
    description: "Email sent when user requests password reset"
  }
};
class EmailTemplateRenderer {
  /**
   * Simple handlebars-style template rendering
   */
  static render(template, data) {
    let rendered = template;
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      rendered = rendered.replace(regex, String(data[key] || ""));
    });
    rendered = rendered.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
      return data[variable] ? content : "";
    });
    return rendered;
  }
  /**
   * Render email template with data
   */
  static renderTemplate(templateName, data) {
    const template = EMAIL_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }
    return {
      subject: this.render(template.subject, data),
      html: this.render(template.htmlTemplate, data),
      text: this.render(template.textTemplate, data)
    };
  }
}
class EmailTrackingService {
  /**
   * Log email delivery attempt
   */
  static async logDelivery(userId, email, type, subject, result) {
    try {
      await db.insert(emailNotifications).values({
        userId,
        email,
        type,
        subject,
        status: result.success ? "sent" : "failed",
        messageId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? /* @__PURE__ */ new Date() : null,
        createdAt: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Failed to log email delivery:", error);
    }
  }
  /**
   * Check if user is unsubscribed from a specific notification type
   */
  static async isUnsubscribed(userId, notificationType) {
    try {
      const unsubscribe = await db.select().from(emailUnsubscribes).where(and(
        eq(emailUnsubscribes.userId, userId),
        eq(emailUnsubscribes.notificationType, notificationType)
      )).limit(1);
      return unsubscribe.length > 0;
    } catch (error) {
      console.error("Failed to check unsubscribe status:", error);
      return false;
    }
  }
  /**
   * Unsubscribe user from specific notification type
   */
  static async unsubscribe(userId, notificationType) {
    try {
      await db.insert(emailUnsubscribes).values({
        userId,
        notificationType,
        unsubscribedAt: /* @__PURE__ */ new Date()
      }).onConflictDoNothing();
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe user:", error);
      return false;
    }
  }
  /**
   * Get email delivery statistics for a user
   */
  static async getDeliveryStats(userId) {
    try {
      const notifications = await db.select().from(emailNotifications).where(eq(emailNotifications.userId, userId)).orderBy(emailNotifications.createdAt).limit(10);
      const total = notifications.length;
      const sent = notifications.filter((n) => n.status === "sent").length;
      const failed = notifications.filter((n) => n.status === "failed").length;
      return {
        total,
        sent,
        failed,
        recent: notifications
      };
    } catch (error) {
      console.error("Failed to get delivery stats:", error);
      return { total: 0, sent: 0, failed: 0, recent: [] };
    }
  }
  /**
   * Generate unsubscribe URL
   */
  static generateUnsubscribeUrl(userId, notificationType) {
    const baseUrl = process.env.APP_URL || "https://monitors.app";
    const token = Buffer.from(`${userId}:${notificationType}`).toString("base64");
    return `${baseUrl}/unsubscribe?token=${token}`;
  }
  /**
   * Parse unsubscribe token
   */
  static parseUnsubscribeToken(token) {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [userId, notificationType] = decoded.split(":");
      if (!userId || !notificationType) {
        return null;
      }
      return { userId, notificationType };
    } catch (error) {
      console.error("Failed to parse unsubscribe token:", error);
      return null;
    }
  }
}

export { EmailTemplateRenderer as E, EmailTrackingService as a };
//# sourceMappingURL=templates-C8URGop1.js.map
