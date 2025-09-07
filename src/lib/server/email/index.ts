// Main email service exports
export { EmailService } from './service';
export { 
  EmailTemplateRenderer, 
  EmailTrackingService, 
  EMAIL_TEMPLATES 
} from './templates';

export type {
  EmailOptions,
  TemplatedEmailOptions,
  MonitorNotificationData,
  UserVerificationData,
  PasswordResetData,
  EmailTemplate,
  EmailDeliveryResult
} from './service';

// Email service factory for dependency injection
export class EmailServiceFactory {
  private static instance: EmailService | null = null;

  static getInstance(): EmailService {
    if (!this.instance) {
      this.instance = EmailService;
    }
    return this.instance;
  }

  static setInstance(instance: EmailService): void {
    this.instance = instance;
  }
}