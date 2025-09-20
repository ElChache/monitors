// MonitorHub Email Service
// Professional email notifications for monitor alerts and authentication

import { config } from '$lib/config';
import { db } from '$lib/database';
import type { Monitor, User } from '@prisma/client';
import type { TemporalEvaluationResult } from './temporal.service';

export interface EmailTemplate {
	subject: string;
	htmlContent: string;
	textContent: string;
	variables: Record<string, any>;
}

export interface EmailSendResult {
	success: boolean;
	messageId?: string;
	error?: string;
	deliveryStatus?: 'sent' | 'delivered' | 'bounced' | 'failed';
}

export interface EmailPreferences {
	userId: string;
	monitorAlerts: boolean;
	frequencyLimit: 'immediate' | 'hourly' | 'daily' | 'weekly';
	quietHours: {
		enabled: boolean;
		startTime: string; // HH:MM format
		endTime: string;   // HH:MM format
		timezone: string;
	};
	unsubscribed: boolean;
}

export class EmailService {
	private static baseUrl = config.app.nodeEnv === 'production' 
		? 'https://monitorhub.com' 
		: 'http://localhost:5173';

	/**
	 * Send monitor alert notification email
	 */
	static async sendMonitorAlert(
		user: User,
		monitor: Monitor,
		evaluationResult: TemporalEvaluationResult
	): Promise<EmailSendResult> {
		try {
			// Check user email preferences
			const preferences = await this.getUserEmailPreferences(user.id);
			if (!preferences.monitorAlerts || preferences.unsubscribed) {
				return { success: false, error: 'User has disabled monitor alerts' };
			}

			// Check frequency limits
			const canSend = await this.checkFrequencyLimit(user.id, preferences.frequencyLimit);
			if (!canSend) {
				return { success: false, error: 'Frequency limit exceeded' };
			}

			// Check quiet hours
			if (this.isInQuietHours(preferences.quietHours)) {
				return { success: false, error: 'Within user quiet hours' };
			}

			// Generate email content
			const template = this.generateMonitorAlertTemplate(monitor, evaluationResult, user);
			
			// Send email
			const result = await this.sendEmail({
				to: user.email,
				subject: template.subject,
				htmlContent: template.htmlContent,
				textContent: template.textContent,
				templateId: 'monitor-alert',
				userId: user.id
			});

			// Log email activity
			await this.logEmailActivity(user.id, 'monitor_alert', result);

			return result;

		} catch (error) {
			console.error('Failed to send monitor alert:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * Send authentication emails (welcome, password reset, verification)
	 */
	static async sendAuthenticationEmail(
		type: 'welcome' | 'password_reset' | 'verification',
		user: User,
		data?: { resetToken?: string; verificationToken?: string }
	): Promise<EmailSendResult> {
		try {
			let template: EmailTemplate;

			switch (type) {
				case 'welcome':
					template = this.generateWelcomeTemplate(user);
					break;
				case 'password_reset':
					if (!data?.resetToken) throw new Error('Reset token required');
					template = this.generatePasswordResetTemplate(user, data.resetToken);
					break;
				case 'verification':
					if (!data?.verificationToken) throw new Error('Verification token required');
					template = this.generateVerificationTemplate(user, data.verificationToken);
					break;
				default:
					throw new Error(`Unknown authentication email type: ${type}`);
			}

			const result = await this.sendEmail({
				to: user.email,
				subject: template.subject,
				htmlContent: template.htmlContent,
				textContent: template.textContent,
				templateId: `auth-${type}`,
				userId: user.id
			});

			await this.logEmailActivity(user.id, type, result);
			return result;

		} catch (error) {
			console.error(`Failed to send ${type} email:`, error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * Core email sending function (abstracted for different providers)
	 */
	private static async sendEmail(params: {
		to: string;
		subject: string;
		htmlContent: string;
		textContent: string;
		templateId: string;
		userId: string;
	}): Promise<EmailSendResult> {
		const { to, subject, htmlContent, textContent } = params;

		// In production, this would integrate with SendGrid, Resend, or similar service
		// For now, we'll use a mock implementation
		
		if (config.app.nodeEnv === 'development') {
			// Development: Log email instead of sending
			console.log('📧 EMAIL (DEV MODE):');
			console.log(`To: ${to}`);
			console.log(`Subject: ${subject}`);
			console.log(`HTML: ${htmlContent.substring(0, 200)}...`);
			console.log(`Text: ${textContent.substring(0, 200)}...`);
			
			return {
				success: true,
				messageId: `dev-${Date.now()}`,
				deliveryStatus: 'delivered'
			};
		}

		// Production email sending would go here
		// Example SendGrid integration:
		/*
		const sgMail = require('@sendgrid/mail');
		sgMail.setApiKey(config.email.apiKey);

		const msg = {
			to,
			from: config.email.from,
			subject,
			text: textContent,
			html: htmlContent,
		};

		try {
			const response = await sgMail.send(msg);
			return {
				success: true,
				messageId: response[0].headers['x-message-id'],
				deliveryStatus: 'sent'
			};
		} catch (error) {
			return {
				success: false,
				error: error.message
			};
		}
		*/

		// Mock production success for now
		return {
			success: true,
			messageId: `mock-${Date.now()}`,
			deliveryStatus: 'sent'
		};
	}

	/**
	 * Generate monitor alert email template
	 */
	private static generateMonitorAlertTemplate(
		monitor: Monitor,
		evaluationResult: TemporalEvaluationResult,
		user: User
	): EmailTemplate {
		const monitorUrl = `${this.baseUrl}/app/monitors/${monitor.id}`;
		const unsubscribeUrl = `${this.baseUrl}/app/preferences/email?token=${this.generateUnsubscribeToken(user.id)}`;

		const subject = `🚨 Monitor Alert: ${monitor.name}`;

		const htmlContent = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>MonitorHub Alert</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
		.content { background: white; padding: 30px 20px; border: 1px solid #e1e5e9; }
		.alert-box { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
		.monitor-details { background: #f8f9fa; border-radius: 6px; padding: 15px; margin: 20px 0; }
		.button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
		.footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🚨 Monitor Alert</h1>
			<p>MonitorHub has detected a condition match</p>
		</div>
		<div class="content">
			<p>Hello ${user.name},</p>
			
			<div class="alert-box">
				<strong>Alert Triggered:</strong> ${monitor.name}
			</div>

			<div class="monitor-details">
				<h3>Monitor Details</h3>
				<p><strong>Type:</strong> ${monitor.monitorType === 'current_state' ? 'Current State' : 'Historical Change'}</p>
				<p><strong>Condition:</strong> ${monitor.naturalLanguagePrompt}</p>
				<p><strong>Triggered:</strong> ${evaluationResult.timestamp.toLocaleString()}</p>
				<p><strong>Confidence:</strong> ${(evaluationResult.confidence * 100).toFixed(1)}%</p>
			</div>

			<div class="alert-box">
				<h4>Explanation</h4>
				<p>${evaluationResult.explanation}</p>
			</div>

			<p>
				<a href="${monitorUrl}" class="button">View Monitor Details</a>
			</p>

			<p>This alert was generated because your monitor condition was met. You can adjust your monitor settings or pause notifications in your dashboard.</p>
		</div>
		<div class="footer">
			<p>MonitorHub - Intelligent Monitoring with Combination Intelligence</p>
			<p>
				<a href="${this.baseUrl}/app/preferences/email">Email Preferences</a> | 
				<a href="${unsubscribeUrl}">Unsubscribe</a>
			</p>
		</div>
	</div>
</body>
</html>`;

		const textContent = `
🚨 MONITOR ALERT: ${monitor.name}

Hello ${user.name},

Your MonitorHub monitor "${monitor.name}" has triggered an alert.

Monitor Details:
- Type: ${monitor.monitorType === 'current_state' ? 'Current State' : 'Historical Change'}
- Condition: ${monitor.naturalLanguagePrompt}
- Triggered: ${evaluationResult.timestamp.toLocaleString()}
- Confidence: ${(evaluationResult.confidence * 100).toFixed(1)}%

Explanation: ${evaluationResult.explanation}

View full details: ${monitorUrl}

Manage email preferences: ${this.baseUrl}/app/preferences/email
Unsubscribe: ${unsubscribeUrl}

MonitorHub - Intelligent Monitoring with Combination Intelligence
`;

		return {
			subject,
			htmlContent,
			textContent,
			variables: {
				monitorName: monitor.name,
				userName: user.name,
				monitorUrl,
				unsubscribeUrl
			}
		};
	}

	/**
	 * Generate welcome email template
	 */
	private static generateWelcomeTemplate(user: User): EmailTemplate {
		const dashboardUrl = `${this.baseUrl}/app`;
		
		const subject = `Welcome to MonitorHub - Your AI-Powered Monitoring Platform`;

		const htmlContent = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Welcome to MonitorHub</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
		.content { background: white; padding: 30px 20px; border: 1px solid #e1e5e9; }
		.feature-box { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
		.button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
		.footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🚀 Welcome to MonitorHub!</h1>
			<p>Revolutionary Monitoring with Combination Intelligence</p>
		</div>
		<div class="content">
			<p>Hello ${user.name},</p>
			
			<p>Welcome to MonitorHub - the world's first AI-powered monitoring platform with <strong>Combination Intelligence</strong>!</p>

			<div class="feature-box">
				<h3>🎯 What Makes MonitorHub Special</h3>
				<ul>
					<li><strong>Natural Language Monitoring:</strong> Create monitors using plain English</li>
					<li><strong>Combination Intelligence:</strong> Monitor complex multi-fact conditions</li>
					<li><strong>Temporal Logic:</strong> Track both current states and historical changes</li>
					<li><strong>AI-Powered:</strong> Intelligent evaluation and optimization</li>
				</ul>
			</div>

			<div class="feature-box">
				<h3>🚀 Getting Started</h3>
				<p>Ready to create your first intelligent monitor? Try these examples:</p>
				<ul>
					<li>"Tesla stock is below $100"</li>
					<li>"Bitcoin dropped more than 10% in the last hour"</li>
					<li>"Weather in San Francisco is sunny and temperature above 70°F"</li>
				</ul>
			</div>

			<p style="text-align: center;">
				<a href="${dashboardUrl}" class="button">Start Monitoring →</a>
			</p>

			<p>As a beta user, you can create up to 5 monitors. We're excited to see what amazing combinations you'll discover!</p>

			<p>Need help? Reply to this email or check our documentation.</p>

			<p>Happy monitoring!<br>The MonitorHub Team</p>
		</div>
		<div class="footer">
			<p>MonitorHub - Intelligent Monitoring with Combination Intelligence</p>
			<p>You're receiving this because you signed up for MonitorHub beta access.</p>
		</div>
	</div>
</body>
</html>`;

		const textContent = `
Welcome to MonitorHub!

Hello ${user.name},

Welcome to MonitorHub - the world's first AI-powered monitoring platform with Combination Intelligence!

What Makes MonitorHub Special:
- Natural Language Monitoring: Create monitors using plain English
- Combination Intelligence: Monitor complex multi-fact conditions  
- Temporal Logic: Track both current states and historical changes
- AI-Powered: Intelligent evaluation and optimization

Getting Started:
Ready to create your first intelligent monitor? Try these examples:
- "Tesla stock is below $100"
- "Bitcoin dropped more than 10% in the last hour"
- "Weather in San Francisco is sunny and temperature above 70°F"

Start monitoring: ${dashboardUrl}

As a beta user, you can create up to 5 monitors. We're excited to see what amazing combinations you'll discover!

Need help? Reply to this email or check our documentation.

Happy monitoring!
The MonitorHub Team

MonitorHub - Intelligent Monitoring with Combination Intelligence
`;

		return {
			subject,
			htmlContent,
			textContent,
			variables: {
				userName: user.name,
				dashboardUrl
			}
		};
	}

	/**
	 * Generate password reset email template
	 */
	private static generatePasswordResetTemplate(user: User, resetToken: string): EmailTemplate {
		const resetUrl = `${this.baseUrl}/auth/reset-password?token=${resetToken}`;
		
		const subject = `Reset Your MonitorHub Password`;

		const htmlContent = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reset Your Password</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #667eea; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
		.content { background: white; padding: 30px 20px; border: 1px solid #e1e5e9; }
		.button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
		.security-notice { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
		.footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🔒 Password Reset</h1>
			<p>MonitorHub Account Security</p>
		</div>
		<div class="content">
			<p>Hello ${user.name},</p>
			
			<p>We received a request to reset the password for your MonitorHub account.</p>

			<p style="text-align: center;">
				<a href="${resetUrl}" class="button">Reset Password</a>
			</p>

			<div class="security-notice">
				<h4>🛡️ Security Notice</h4>
				<ul>
					<li>This link will expire in 1 hour</li>
					<li>If you didn't request this reset, please ignore this email</li>
					<li>Your current password remains unchanged until you complete the reset</li>
				</ul>
			</div>

			<p>If the button doesn't work, copy and paste this link into your browser:</p>
			<p style="word-break: break-all; color: #666;">${resetUrl}</p>

			<p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>

			<p>Best regards,<br>The MonitorHub Security Team</p>
		</div>
		<div class="footer">
			<p>MonitorHub - Intelligent Monitoring with Combination Intelligence</p>
			<p>This is an automated security email. Please do not reply.</p>
		</div>
	</div>
</body>
</html>`;

		const textContent = `
Password Reset - MonitorHub

Hello ${user.name},

We received a request to reset the password for your MonitorHub account.

Reset your password: ${resetUrl}

Security Notice:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your current password remains unchanged until you complete the reset

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The MonitorHub Security Team

MonitorHub - Intelligent Monitoring with Combination Intelligence
`;

		return {
			subject,
			htmlContent,
			textContent,
			variables: {
				userName: user.name,
				resetUrl,
				resetToken
			}
		};
	}

	/**
	 * Generate verification email template
	 */
	private static generateVerificationTemplate(user: User, verificationToken: string): EmailTemplate {
		const verifyUrl = `${this.baseUrl}/auth/verify?token=${verificationToken}`;
		
		const subject = `Verify Your MonitorHub Email Address`;

		const htmlContent = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Verify Your Email</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #28a745; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
		.content { background: white; padding: 30px 20px; border: 1px solid #e1e5e9; }
		.button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
		.footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>✅ Verify Your Email</h1>
			<p>MonitorHub Account Verification</p>
		</div>
		<div class="content">
			<p>Hello ${user.name},</p>
			
			<p>Thank you for signing up for MonitorHub! Please verify your email address to complete your account setup.</p>

			<p style="text-align: center;">
				<a href="${verifyUrl}" class="button">Verify Email Address</a>
			</p>

			<p>If the button doesn't work, copy and paste this link into your browser:</p>
			<p style="word-break: break-all; color: #666;">${verifyUrl}</p>

			<p>This verification link will expire in 24 hours. If you didn't create a MonitorHub account, you can safely ignore this email.</p>

			<p>Welcome to the future of intelligent monitoring!</p>

			<p>Best regards,<br>The MonitorHub Team</p>
		</div>
		<div class="footer">
			<p>MonitorHub - Intelligent Monitoring with Combination Intelligence</p>
			<p>This is an automated verification email. Please do not reply.</p>
		</div>
	</div>
</body>
</html>`;

		const textContent = `
Verify Your Email - MonitorHub

Hello ${user.name},

Thank you for signing up for MonitorHub! Please verify your email address to complete your account setup.

Verify your email: ${verifyUrl}

This verification link will expire in 24 hours. If you didn't create a MonitorHub account, you can safely ignore this email.

Welcome to the future of intelligent monitoring!

Best regards,
The MonitorHub Team

MonitorHub - Intelligent Monitoring with Combination Intelligence
`;

		return {
			subject,
			htmlContent,
			textContent,
			variables: {
				userName: user.name,
				verifyUrl,
				verificationToken
			}
		};
	}

	/**
	 * Get user email preferences
	 */
	static async getUserEmailPreferences(userId: string): Promise<EmailPreferences> {
		// Try to get from database, or return defaults
		try {
			const prefs = await db.userEmailPreference.findUnique({
				where: { userId }
			});

			if (prefs) {
				return {
					userId,
					monitorAlerts: prefs.monitorAlerts,
					frequencyLimit: prefs.frequencyLimit as EmailPreferences['frequencyLimit'],
					quietHours: {
						enabled: prefs.quietHoursEnabled,
						startTime: prefs.quietHoursStart || '22:00',
						endTime: prefs.quietHoursEnd || '08:00',
						timezone: prefs.timezone || 'UTC'
					},
					unsubscribed: prefs.unsubscribed
				};
			}
		} catch (error) {
			console.warn('Failed to load email preferences, using defaults:', error);
		}

		// Return default preferences
		return {
			userId,
			monitorAlerts: true,
			frequencyLimit: 'immediate',
			quietHours: {
				enabled: false,
				startTime: '22:00',
				endTime: '08:00',
				timezone: 'UTC'
			},
			unsubscribed: false
		};
	}

	/**
	 * Update user email preferences
	 */
	static async updateEmailPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<void> {
		await db.userEmailPreference.upsert({
			where: { userId },
			create: {
				userId,
				monitorAlerts: preferences.monitorAlerts ?? true,
				frequencyLimit: preferences.frequencyLimit ?? 'immediate',
				quietHoursEnabled: preferences.quietHours?.enabled ?? false,
				quietHoursStart: preferences.quietHours?.startTime ?? '22:00',
				quietHoursEnd: preferences.quietHours?.endTime ?? '08:00',
				timezone: preferences.quietHours?.timezone ?? 'UTC',
				unsubscribed: preferences.unsubscribed ?? false
			},
			update: {
				...(preferences.monitorAlerts !== undefined && { monitorAlerts: preferences.monitorAlerts }),
				...(preferences.frequencyLimit && { frequencyLimit: preferences.frequencyLimit }),
				...(preferences.quietHours?.enabled !== undefined && { quietHoursEnabled: preferences.quietHours.enabled }),
				...(preferences.quietHours?.startTime && { quietHoursStart: preferences.quietHours.startTime }),
				...(preferences.quietHours?.endTime && { quietHoursEnd: preferences.quietHours.endTime }),
				...(preferences.quietHours?.timezone && { timezone: preferences.quietHours.timezone }),
				...(preferences.unsubscribed !== undefined && { unsubscribed: preferences.unsubscribed })
			}
		});
	}

	/**
	 * Check if current time is within user's quiet hours
	 */
	private static isInQuietHours(quietHours: EmailPreferences['quietHours']): boolean {
		if (!quietHours.enabled) return false;

		const now = new Date();
		const currentTime = now.toLocaleTimeString('en-US', { 
			hour12: false, 
			hour: '2-digit', 
			minute: '2-digit',
			timeZone: quietHours.timezone 
		});

		// Simple time comparison (could be enhanced for complex timezone handling)
		return currentTime >= quietHours.startTime || currentTime <= quietHours.endTime;
	}

	/**
	 * Check frequency limit for user
	 */
	private static async checkFrequencyLimit(userId: string, limit: EmailPreferences['frequencyLimit']): Promise<boolean> {
		if (limit === 'immediate') return true;

		const now = new Date();
		let timeThreshold: Date;

		switch (limit) {
			case 'hourly':
				timeThreshold = new Date(now.getTime() - 60 * 60 * 1000);
				break;
			case 'daily':
				timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				break;
			case 'weekly':
				timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			default:
				return true;
		}

		const recentEmails = await db.emailLog.count({
			where: {
				userId,
				type: 'monitor_alert',
				sentAt: {
					gte: timeThreshold
				}
			}
		});

		return recentEmails === 0;
	}

	/**
	 * Log email activity for analytics and frequency control
	 */
	private static async logEmailActivity(userId: string, type: string, result: EmailSendResult): Promise<void> {
		try {
			await db.emailLog.create({
				data: {
					userId,
					type,
					success: result.success,
					messageId: result.messageId,
					error: result.error,
					deliveryStatus: result.deliveryStatus || 'unknown',
					sentAt: new Date()
				}
			});
		} catch (error) {
			console.error('Failed to log email activity:', error);
		}
	}

	/**
	 * Generate unsubscribe token for user
	 */
	private static generateUnsubscribeToken(userId: string): string {
		// In production, this would be a JWT or encrypted token with expiration
		return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
	}

	/**
	 * Handle unsubscribe request
	 */
	static async handleUnsubscribe(token: string): Promise<boolean> {
		try {
			const decoded = Buffer.from(token, 'base64').toString();
			const [userId] = decoded.split(':');

			await this.updateEmailPreferences(userId, { unsubscribed: true });
			return true;
		} catch (error) {
			console.error('Failed to handle unsubscribe:', error);
			return false;
		}
	}

	/**
	 * Get email analytics for admin dashboard
	 */
	static async getEmailAnalytics(timeRange?: { start: Date; end: Date }) {
		const where = timeRange ? {
			sentAt: {
				gte: timeRange.start,
				lte: timeRange.end
			}
		} : {};

		const [totalEmails, successfulEmails, emailsByType, recentActivity] = await Promise.all([
			db.emailLog.count({ where }),
			db.emailLog.count({ where: { ...where, success: true } }),
			db.emailLog.groupBy({
				by: ['type'],
				where,
				_count: true
			}),
			db.emailLog.findMany({
				where,
				orderBy: { sentAt: 'desc' },
				take: 50,
				include: {
					user: {
						select: { email: true, name: true }
					}
				}
			})
		]);

		const deliveryRate = totalEmails > 0 ? (successfulEmails / totalEmails) * 100 : 0;

		return {
			totalEmails,
			successfulEmails,
			deliveryRate: Math.round(deliveryRate * 100) / 100,
			emailsByType,
			recentActivity
		};
	}
}