import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { config } from 'dotenv';

config();
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});
class EmailService {
  static FROM_ADDRESS = process.env.FROM_EMAIL || "noreply@monitors.app";
  static REPLY_TO_ADDRESS = process.env.REPLY_TO_EMAIL || "support@monitors.app";
  /**
   * Send a basic email with HTML and text content
   */
  static async sendEmail(options) {
    try {
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      const command = new SendEmailCommand({
        Source: options.from || this.FROM_ADDRESS,
        Destination: {
          ToAddresses: toAddresses
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : [this.REPLY_TO_ADDRESS],
        Message: {
          Subject: {
            Data: options.subject,
            Charset: "UTF-8"
          },
          Body: {
            Html: {
              Data: options.htmlContent,
              Charset: "UTF-8"
            },
            Text: {
              Data: options.textContent,
              Charset: "UTF-8"
            }
          }
        }
      });
      await sesClient.send(command);
      console.log(`Email sent successfully to ${toAddresses.join(", ")}`);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }
  /**
   * Send monitor notification email when a monitor is triggered
   */
  static async sendMonitorNotification(to, data) {
    const subject = `🚨 Monitor Alert: ${data.monitorName}`;
    const htmlContent = this.generateMonitorNotificationHTML(data);
    const textContent = this.generateMonitorNotificationText(data);
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent
    });
  }
  /**
   * Send user verification email
   */
  static async sendUserVerification(to, data) {
    const subject = "Verify your Monitors! account";
    const htmlContent = this.generateVerificationHTML(data);
    const textContent = this.generateVerificationText(data);
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent
    });
  }
  /**
   * Send password reset email
   */
  static async sendPasswordReset(to, data) {
    const subject = "Reset your Monitors! password";
    const htmlContent = this.generatePasswordResetHTML(data);
    const textContent = this.generatePasswordResetText(data);
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent
    });
  }
  /**
   * Generate HTML content for monitor notification
   */
  static generateMonitorNotificationHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monitor Alert</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .value-box { background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #ef4444; }
            .unsubscribe { font-size: 12px; color: #6b7280; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 Monitor Alert</h1>
                <h2>${data.monitorName}</h2>
            </div>
            
            <div class="content">
                <p>Hi ${data.userName},</p>
                
                <p>Your monitor "<strong>${data.monitorName}</strong>" has been triggered!</p>
                
                <div class="value-box">
                    <h3>Trigger Details</h3>
                    <p><strong>Condition:</strong> ${data.triggerCondition}</p>
                    <p><strong>Current Value:</strong> ${JSON.stringify(data.currentValue)}</p>
                    ${data.previousValue ? `<p><strong>Previous Value:</strong> ${JSON.stringify(data.previousValue)}</p>` : ""}
                </div>
                
                <p>
                    <a href="${data.monitorUrl}" class="button">View Monitor Details</a>
                    <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
                </p>
                
                <p>This alert was sent because your monitor detected a change that matches your specified trigger condition.</p>
            </div>
            
            <div class="footer">
                <p>© 2024 Monitors! - Your AI-Powered Monitoring Platform</p>
                <div class="unsubscribe">
                    <a href="${data.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe from this monitor</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }
  /**
   * Generate text content for monitor notification
   */
  static generateMonitorNotificationText(data) {
    return `
    MONITOR ALERT: ${data.monitorName}
    
    Hi ${data.userName},
    
    Your monitor "${data.monitorName}" has been triggered!
    
    Trigger Details:
    - Condition: ${data.triggerCondition}
    - Current Value: ${JSON.stringify(data.currentValue)}
    ${data.previousValue ? `- Previous Value: ${JSON.stringify(data.previousValue)}` : ""}
    
    View Monitor: ${data.monitorUrl}
    Go to Dashboard: ${data.dashboardUrl}
    
    This alert was sent because your monitor detected a change that matches your specified trigger condition.
    
    To unsubscribe from this monitor: ${data.unsubscribeUrl}
    
    © 2024 Monitors! - Your AI-Powered Monitoring Platform
    `;
  }
  /**
   * Generate HTML content for user verification
   */
  static generateVerificationHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Monitors!</h1>
            </div>
            
            <div class="content">
                <p>Hi ${data.userName},</p>
                
                <p>Thank you for signing up for Monitors! Please verify your email address to complete your account setup.</p>
                
                <p style="text-align: center;">
                    <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
                </p>
                
                <p>This verification link will expire in ${data.expirationHours} hours.</p>
                
                <p>If you didn't create this account, you can safely ignore this email.</p>
                
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6b7280;">${data.verificationUrl}</p>
            </div>
            
            <div class="footer">
                <p>© 2024 Monitors! - Your AI-Powered Monitoring Platform</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
  /**
   * Generate text content for user verification
   */
  static generateVerificationText(data) {
    return `
    Welcome to Monitors!
    
    Hi ${data.userName},
    
    Thank you for signing up for Monitors! Please verify your email address to complete your account setup.
    
    Verification Link: ${data.verificationUrl}
    
    This verification link will expire in ${data.expirationHours} hours.
    
    If you didn't create this account, you can safely ignore this email.
    
    © 2024 Monitors! - Your AI-Powered Monitoring Platform
    `;
  }
  /**
   * Generate HTML content for password reset
   */
  static generatePasswordResetHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 15px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            
            <div class="content">
                <p>Hi ${data.userName},</p>
                
                <p>We received a request to reset your password for your Monitors! account.</p>
                
                <p style="text-align: center;">
                    <a href="${data.resetUrl}" class="button">Reset Password</a>
                </p>
                
                <p>This reset link will expire in ${data.expirationHours} hours for your security.</p>
                
                <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6b7280;">${data.resetUrl}</p>
            </div>
            
            <div class="footer">
                <p>© 2024 Monitors! - Your AI-Powered Monitoring Platform</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
  /**
   * Generate text content for password reset
   */
  static generatePasswordResetText(data) {
    return `
    Password Reset Request
    
    Hi ${data.userName},
    
    We received a request to reset your password for your Monitors! account.
    
    Reset Link: ${data.resetUrl}
    
    This reset link will expire in ${data.expirationHours} hours for your security.
    
    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
    
    © 2024 Monitors! - Your AI-Powered Monitoring Platform
    `;
  }
  /**
   * Test email service connectivity
   */
  static async testConnection() {
    try {
      const testEmail = process.env.TEST_EMAIL || "test@monitors.app";
      return this.sendEmail({
        to: testEmail,
        subject: "Monitors Email Service Test",
        htmlContent: "<p>This is a test email from the Monitors email service.</p>",
        textContent: "This is a test email from the Monitors email service."
      });
    } catch (error) {
      console.error("Email service test failed:", error);
      return false;
    }
  }
}

export { EmailService as E };
//# sourceMappingURL=service4-B-hvY16X.js.map
