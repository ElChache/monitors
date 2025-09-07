/**
 * AI008: Natural Language Generation for Notifications
 * 
 * Creates contextual, personalized email content for monitor notifications
 * with clear explanations of changes and appropriate urgency levels.
 */

import { z } from 'zod';
import { AIPrompt, AIResponse, AIProviderType } from '../types/index.js';
import { getGlobalAIManager } from '../manager.js';
import { createMonitorSystemPrompt } from '../index.js';

// Urgency levels for notifications
export enum UrgencyLevel {
  LOW = 'low',           // Informational updates
  MEDIUM = 'medium',     // Notable changes
  HIGH = 'high',         // Important alerts
  CRITICAL = 'critical'  // Immediate attention required
}

// Notification types
export enum NotificationType {
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  THRESHOLD_BELOW = 'threshold_below', 
  VALUE_CHANGED = 'value_changed',
  TREND_DETECTED = 'trend_detected',
  STATUS_UPDATE = 'status_update',
  ERROR_OCCURRED = 'error_occurred',
  SCHEDULED_REPORT = 'scheduled_report'
}

// User preferences for tone and style
export enum ToneStyle {
  PROFESSIONAL = 'professional',  // Formal business tone
  CASUAL = 'casual',              // Friendly conversational tone  
  TECHNICAL = 'technical',        // Detailed technical information
  BRIEF = 'brief',               // Minimal essential information
  ENTHUSIASTIC = 'enthusiastic'  // Energetic and engaging
}

// Zod schemas for validation
export const MonitorDataSchema = z.object({
  monitorId: z.string(),
  monitorName: z.string(),
  currentValue: z.union([z.string(), z.number(), z.boolean()]),
  previousValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  threshold: z.union([z.string(), z.number()]).optional(),
  unit: z.string().optional(),
  source: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
  metadata: z.record(z.any()).optional()
});

export const UserContextSchema = z.object({
  userId: z.string(),
  userName: z.string().optional(),
  email: z.string().email(),
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
  preferredTone: z.nativeEnum(ToneStyle).default(ToneStyle.PROFESSIONAL),
  notificationPreferences: z.object({
    includeHistoricalContext: z.boolean().default(true),
    includeActionRecommendations: z.boolean().default(true),
    maxEmailLength: z.enum(['short', 'medium', 'long']).default('medium')
  }).default({})
});

export const NotificationContextSchema = z.object({
  notificationType: z.nativeEnum(NotificationType),
  urgencyLevel: z.nativeEnum(UrgencyLevel),
  triggerReason: z.string(),
  monitorData: MonitorDataSchema,
  userContext: UserContextSchema,
  historicalData: z.array(z.object({
    value: z.union([z.string(), z.number(), z.boolean()]),
    timestamp: z.date()
  })).optional(),
  customInstructions: z.string().optional()
});

export const GeneratedNotificationSchema = z.object({
  // Email content
  subject: z.string(),
  bodyText: z.string(),
  bodyHtml: z.string().optional(),
  
  // Metadata
  urgencyLevel: z.nativeEnum(UrgencyLevel),
  estimatedReadTime: z.string(), // e.g., "2 min read"
  
  // Content analysis
  keyPoints: z.array(z.string()),
  actionRecommendations: z.array(z.string()).optional(),
  
  // Technical details
  templateVariables: z.record(z.any()),
  personalizationUsed: z.array(z.string()),
  
  // Quality metrics
  confidenceScore: z.number().min(0).max(1),
  readabilityScore: z.string().optional(), // e.g., "Grade 8"
  
  // Metadata
  generationTime: z.number(),
  timestamp: z.date().default(() => new Date())
});

// TypeScript types
export type MonitorData = z.infer<typeof MonitorDataSchema>;
export type UserContext = z.infer<typeof UserContextSchema>;
export type NotificationContext = z.infer<typeof NotificationContextSchema>;
export type GeneratedNotification = z.infer<typeof GeneratedNotificationSchema>;

/**
 * Main Notification Generation Service
 */
export class NotificationGenerationService {
  private aiManager = getGlobalAIManager();
  
  /**
   * Generate a complete email notification for a monitor trigger
   */
  async generateNotification(
    context: NotificationContext,
    options: {
      preferredProvider?: AIProviderType;
      includeHtml?: boolean;
      testMode?: boolean;
    } = {}
  ): Promise<GeneratedNotification> {
    const startTime = Date.now();
    
    try {
      // Validate input
      const validatedContext = NotificationContextSchema.parse(context);
      
      // Generate the notification content
      const prompt = this.createNotificationPrompt(validatedContext, options.includeHtml);
      
      const aiResponse = await this.aiManager.generateResponse(
        {
          content: prompt,
          role: 'user',
          maxTokens: 1000,
          temperature: 0.4, // Lower temperature for consistent, professional output
          context: {
            system: createMonitorSystemPrompt({
              task: 'generate',
              domain: 'email_notifications',
              instructions: 'Generate professional email notifications with clear explanations and appropriate urgency'
            })
          }
        },
        options.preferredProvider
      );
      
      // Parse the AI response
      const rawResult = this.parseNotificationResponse(aiResponse.content);
      const generationTime = Date.now() - startTime;
      
      // Enhance with metadata and analysis
      const notification: GeneratedNotification = {
        ...rawResult,
        urgencyLevel: validatedContext.urgencyLevel,
        templateVariables: this.extractTemplateVariables(validatedContext),
        personalizationUsed: this.getPersonalizationFeatures(validatedContext),
        generationTime,
        timestamp: new Date()
      };
      
      // Validate the result
      return GeneratedNotificationSchema.parse(notification);
      
    } catch (error) {
      // Return fallback notification on error
      return this.createFallbackNotification(context, Date.now() - startTime, error as Error);
    }
  }
  
  /**
   * Generate multiple notification variations for A/B testing
   */
  async generateNotificationVariations(
    context: NotificationContext,
    variations: Array<{
      tone: ToneStyle;
      length: 'short' | 'medium' | 'long';
      style: string;
    }>,
    options: {
      preferredProvider?: AIProviderType;
    } = {}
  ): Promise<GeneratedNotification[]> {
    const promises = variations.map(async (variation) => {
      const modifiedContext = {
        ...context,
        userContext: {
          ...context.userContext,
          preferredTone: variation.tone,
          notificationPreferences: {
            ...context.userContext.notificationPreferences,
            maxEmailLength: variation.length
          }
        },
        customInstructions: variation.style
      };
      
      return this.generateNotification(modifiedContext, options);
    });
    
    return Promise.all(promises);
  }
  
  /**
   * Determine urgency level based on monitor data and trigger
   */
  determineUrgencyLevel(
    monitorData: MonitorData,
    notificationType: NotificationType,
    changePercentage?: number
  ): UrgencyLevel {
    // Critical conditions
    if (notificationType === NotificationType.ERROR_OCCURRED) {
      return UrgencyLevel.CRITICAL;
    }
    
    if (changePercentage && Math.abs(changePercentage) > 50) {
      return UrgencyLevel.CRITICAL;
    }
    
    // High urgency conditions
    if (notificationType === NotificationType.THRESHOLD_EXCEEDED ||
        notificationType === NotificationType.THRESHOLD_BELOW) {
      return UrgencyLevel.HIGH;
    }
    
    if (changePercentage && Math.abs(changePercentage) > 20) {
      return UrgencyLevel.HIGH;
    }
    
    // Medium urgency conditions
    if (notificationType === NotificationType.TREND_DETECTED ||
        notificationType === NotificationType.VALUE_CHANGED) {
      return UrgencyLevel.MEDIUM;
    }
    
    // Default to low for status updates and scheduled reports
    return UrgencyLevel.LOW;
  }
  
  /**
   * Generate action recommendations based on the trigger
   */
  generateActionRecommendations(
    context: NotificationContext
  ): string[] {
    const { notificationType, monitorData } = context;
    const recommendations: string[] = [];
    
    switch (notificationType) {
      case NotificationType.THRESHOLD_EXCEEDED:
        recommendations.push(`Consider reviewing your ${monitorData.monitorName} threshold settings`);
        recommendations.push('Check if this change aligns with your expectations');
        if (monitorData.source) {
          recommendations.push(`Visit ${monitorData.source} for more details`);
        }
        break;
        
      case NotificationType.TREND_DETECTED:
        recommendations.push('Monitor this trend over the next few data points');
        recommendations.push('Consider adjusting your monitoring frequency if needed');
        break;
        
      case NotificationType.ERROR_OCCURRED:
        recommendations.push('Check your monitor configuration');
        recommendations.push('Verify that the data source is accessible');
        recommendations.push('Contact support if this error persists');
        break;
        
      case NotificationType.SCHEDULED_REPORT:
        recommendations.push('Review the data for any unexpected patterns');
        recommendations.push('Update your monitoring settings if needed');
        break;
        
      default:
        recommendations.push('Review your monitor dashboard for more information');
    }
    
    return recommendations;
  }
  
  /**
   * Create the AI prompt for notification generation
   */
  private createNotificationPrompt(context: NotificationContext, includeHtml: boolean = false): string {
    const { monitorData, userContext, notificationType, urgencyLevel, triggerReason } = context;
    
    const toneInstructions = {
      [ToneStyle.PROFESSIONAL]: 'Use formal, business-appropriate language',
      [ToneStyle.CASUAL]: 'Use friendly, conversational tone',
      [ToneStyle.TECHNICAL]: 'Include technical details and precise terminology',
      [ToneStyle.BRIEF]: 'Keep content concise and to the point',
      [ToneStyle.ENTHUSIASTIC]: 'Use energetic and engaging language'
    };
    
    const lengthInstructions = {
      'short': '1-2 sentences, essential information only',
      'medium': '2-4 sentences with context and explanation',
      'long': 'Comprehensive explanation with background and recommendations'
    };
    
    return `Generate an email notification for a monitor trigger with the following details:

MONITOR INFORMATION:
- Monitor Name: ${monitorData.monitorName}
- Current Value: ${monitorData.currentValue}${monitorData.unit ? ` ${monitorData.unit}` : ''}
${monitorData.previousValue !== undefined ? `- Previous Value: ${monitorData.previousValue}${monitorData.unit ? ` ${monitorData.unit}` : ''}` : ''}
${monitorData.threshold !== undefined ? `- Threshold: ${monitorData.threshold}${monitorData.unit ? ` ${monitorData.unit}` : ''}` : ''}
- Trigger Reason: ${triggerReason}
- Notification Type: ${notificationType}
- Urgency: ${urgencyLevel}

USER PREFERENCES:
- Name: ${userContext.userName || 'User'}
- Tone: ${toneInstructions[userContext.preferredTone]}
- Length: ${lengthInstructions[userContext.notificationPreferences.maxEmailLength]}
- Timezone: ${userContext.timezone}

${context.historicalData ? `HISTORICAL CONTEXT:
${context.historicalData.map(d => `- ${d.timestamp.toISOString()}: ${d.value}`).join('\n')}` : ''}

${context.customInstructions ? `CUSTOM INSTRUCTIONS: ${context.customInstructions}` : ''}

Generate a JSON response with the following structure:
{
  "subject": "Concise email subject line (under 50 characters)",
  "bodyText": "Plain text email body with clear explanation",
  ${includeHtml ? '"bodyHtml": "HTML formatted version of the email body",' : ''}
  "keyPoints": ["Key insight 1", "Key insight 2"],
  ${userContext.notificationPreferences.includeActionRecommendations ? '"actionRecommendations": ["Action 1", "Action 2"],' : ''}
  "estimatedReadTime": "X min read",
  "confidenceScore": 0.95,
  "readabilityScore": "Grade 8"
}

REQUIREMENTS:
- Subject must be attention-grabbing and informative
- Body must explain what happened, why it matters, and what it means
- Use appropriate urgency language for ${urgencyLevel} level notifications
- Include timestamp in user's timezone (${userContext.timezone})
- Make it actionable and clear
${userContext.notificationPreferences.includeHistoricalContext ? '- Include relevant historical context' : ''}
- Maintain ${userContext.preferredTone} tone throughout

Return ONLY the JSON response, no additional text.`;
  }
  
  /**
   * Parse AI response and extract notification content
   */
  private parseNotificationResponse(response: string): Partial<GeneratedNotification> {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        subject: parsed.subject || 'Monitor Alert',
        bodyText: parsed.bodyText || 'Your monitor has triggered an alert.',
        bodyHtml: parsed.bodyHtml,
        keyPoints: parsed.keyPoints || [],
        actionRecommendations: parsed.actionRecommendations,
        estimatedReadTime: parsed.estimatedReadTime || '1 min read',
        confidenceScore: parsed.confidenceScore || 0.7,
        readabilityScore: parsed.readabilityScore || 'Grade 8'
      };
      
    } catch (error) {
      // Return minimal valid content if parsing fails
      return {
        subject: 'Monitor Alert - Processing Error',
        bodyText: 'Your monitor has triggered an alert, but there was an issue generating the detailed notification.',
        keyPoints: ['Monitor alert triggered'],
        estimatedReadTime: '1 min read',
        confidenceScore: 0.3,
        readabilityScore: 'Grade 6'
      };
    }
  }
  
  /**
   * Extract template variables for email customization
   */
  private extractTemplateVariables(context: NotificationContext): Record<string, any> {
    return {
      monitorName: context.monitorData.monitorName,
      currentValue: context.monitorData.currentValue,
      previousValue: context.monitorData.previousValue,
      threshold: context.monitorData.threshold,
      unit: context.monitorData.unit,
      userName: context.userContext.userName,
      urgency: context.urgencyLevel,
      timestamp: context.monitorData.timestamp.toISOString(),
      timezone: context.userContext.timezone,
      notificationType: context.notificationType,
      triggerReason: context.triggerReason
    };
  }
  
  /**
   * Get list of personalization features used
   */
  private getPersonalizationFeatures(context: NotificationContext): string[] {
    const features: string[] = [];
    
    if (context.userContext.userName) {
      features.push('user_name');
    }
    
    if (context.userContext.timezone !== 'UTC') {
      features.push('timezone_localization');
    }
    
    if (context.userContext.preferredTone !== ToneStyle.PROFESSIONAL) {
      features.push('tone_customization');
    }
    
    if (context.userContext.language !== 'en') {
      features.push('language_localization');
    }
    
    if (context.historicalData && context.historicalData.length > 0) {
      features.push('historical_context');
    }
    
    if (context.customInstructions) {
      features.push('custom_instructions');
    }
    
    return features;
  }
  
  /**
   * Create fallback notification when generation fails
   */
  private createFallbackNotification(
    context: NotificationContext,
    generationTime: number,
    error: Error
  ): GeneratedNotification {
    const { monitorData, userContext, urgencyLevel } = context;
    
    return {
      subject: `${monitorData.monitorName} Alert`,
      bodyText: `Your monitor "${monitorData.monitorName}" has triggered an alert. Current value: ${monitorData.currentValue}${monitorData.unit ? ` ${monitorData.unit}` : ''}. Please check your dashboard for more details.`,
      urgencyLevel,
      estimatedReadTime: '1 min read',
      keyPoints: [`${monitorData.monitorName} alert triggered`],
      templateVariables: this.extractTemplateVariables(context),
      personalizationUsed: [],
      confidenceScore: 0.2,
      generationTime,
      timestamp: new Date()
    };
  }
  
  /**
   * Validate notification content for quality and appropriateness
   */
  validateNotificationContent(notification: GeneratedNotification): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check subject line
    if (notification.subject.length > 60) {
      issues.push('Subject line too long (over 60 characters)');
    }
    
    if (notification.subject.length < 10) {
      issues.push('Subject line too short (under 10 characters)');
    }
    
    // Check body content
    if (notification.bodyText.length < 50) {
      issues.push('Email body too short (under 50 characters)');
    }
    
    if (notification.bodyText.length > 2000) {
      suggestions.push('Consider shortening email body for better readability');
    }
    
    // Check confidence score
    if (notification.confidenceScore < 0.5) {
      issues.push('Low confidence score - content quality may be poor');
    }
    
    // Check key points
    if (notification.keyPoints.length === 0) {
      suggestions.push('Add key points to improve content structure');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// Export singleton instance
export const notificationGenerationService = new NotificationGenerationService();

/**
 * Convenience function for quick notification generation
 */
export async function generateNotification(
  context: NotificationContext,
  options?: {
    preferredProvider?: AIProviderType;
    includeHtml?: boolean;
    testMode?: boolean;
  }
): Promise<GeneratedNotification> {
  return notificationGenerationService.generateNotification(context, options);
}

/**
 * Quick urgency level determination
 */
export function determineUrgency(
  monitorData: MonitorData,
  notificationType: NotificationType,
  changePercentage?: number
): UrgencyLevel {
  return notificationGenerationService.determineUrgencyLevel(
    monitorData,
    notificationType,
    changePercentage
  );
}

/**
 * Generate action recommendations
 */
export function getActionRecommendations(context: NotificationContext): string[] {
  return notificationGenerationService.generateActionRecommendations(context);
}