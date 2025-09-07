import { j as json, e as error } from './index-Djsj11qr.js';
import { E as EmailService } from './service4-B-hvY16X.js';
import { E as EmailTemplateRenderer } from './templates-C2bOMWsP.js';
import '@aws-sdk/client-ses';
import 'dotenv';
import './db-whCnGq-7.js';
import 'pg';
import './users-CCLvGjXf.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';

const POST = async ({ request }) => {
  if (process.env.NODE_ENV === "production") {
    throw error(403, "Email testing is not available in production");
  }
  try {
    const body = await request.json();
    const { type = "basic", to } = body;
    if (!to) {
      throw error(400, "Email recipient (to) is required");
    }
    let success = false;
    switch (type) {
      case "basic":
        success = await EmailService.sendEmail({
          to,
          subject: "Monitors Email Service Test",
          htmlContent: "<p>This is a <strong>test email</strong> from the Monitors email service.</p>",
          textContent: "This is a test email from the Monitors email service."
        });
        break;
      case "monitor_notification":
        success = await EmailService.sendMonitorNotification(to, {
          monitorName: "Test Price Monitor",
          userName: "Test User",
          currentValue: "$125.99",
          previousValue: "$99.99",
          triggerCondition: "Price above $120",
          monitorUrl: "https://monitors.app/monitors/test-123",
          dashboardUrl: "https://monitors.app/dashboard",
          unsubscribeUrl: "https://monitors.app/unsubscribe?token=test123"
        });
        break;
      case "verification":
        success = await EmailService.sendUserVerification(to, {
          userName: "Test User",
          verificationUrl: "https://monitors.app/verify?token=test123",
          expirationHours: 24
        });
        break;
      case "password_reset":
        success = await EmailService.sendPasswordReset(to, {
          userName: "Test User",
          resetUrl: "https://monitors.app/reset?token=test123",
          expirationHours: 2
        });
        break;
      case "template_test":
        const templateData = {
          monitorName: "Sample Monitor",
          userName: "John Doe",
          triggerCondition: "Value > 100",
          currentValue: "150",
          previousValue: "90",
          monitorUrl: "https://monitors.app/monitors/123",
          dashboardUrl: "https://monitors.app/dashboard",
          unsubscribeUrl: "https://monitors.app/unsubscribe?token=abc123"
        };
        const rendered = EmailTemplateRenderer.renderTemplate("MONITOR_NOTIFICATION", templateData);
        success = await EmailService.sendEmail({
          to,
          subject: rendered.subject,
          htmlContent: rendered.html,
          textContent: rendered.text
        });
        break;
      default:
        throw error(400, `Unknown test type: ${type}`);
    }
    return json({
      success,
      message: success ? "Test email sent successfully" : "Failed to send test email",
      type,
      recipient: to
    });
  } catch (err) {
    console.error("Email test error:", err);
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to send test email");
  }
};
const GET = async () => {
  try {
    const config = {
      provider: "AWS SES",
      region: process.env.AWS_REGION || "us-east-1",
      fromAddress: process.env.FROM_EMAIL || "noreply@monitors.app",
      replyToAddress: process.env.REPLY_TO_EMAIL || "support@monitors.app",
      environment: process.env.NODE_ENV || "development",
      awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    };
    let connectionTest = null;
    if (process.env.NODE_ENV !== "production") {
      try {
        connectionTest = {
          tested: true,
          success: await EmailService.testConnection()
        };
      } catch (error2) {
        connectionTest = {
          tested: true,
          success: false,
          error: error2 instanceof Error ? error2.message : "Unknown error"
        };
      }
    }
    return json({
      status: "operational",
      config,
      connectionTest,
      availableTemplates: Object.keys(EmailTemplateRenderer.EMAIL_TEMPLATES || {}),
      testEndpoints: process.env.NODE_ENV !== "production" ? {
        "POST /api/email/test": "Send test email",
        "GET /api/email/unsubscribe": "Test unsubscribe link",
        "POST /api/email/unsubscribe": "Test unsubscribe API"
      } : null
    });
  } catch (err) {
    console.error("Email service status error:", err);
    throw error(500, "Failed to get email service status");
  }
};

export { GET, POST };
//# sourceMappingURL=_server.ts-NJfgwcDH.js.map
