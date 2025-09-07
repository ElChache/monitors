/**
 * Test suite for AI008: Natural Language Generation for Notifications
 * 
 * Comprehensive tests for notification generation, personalization,
 * urgency determination, and content validation.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  NotificationGenerationService,
  generateNotification,
  determineUrgency,
  getActionRecommendations,
  UrgencyLevel,
  NotificationType,
  ToneStyle,
  type NotificationContext,
  type MonitorData,
  type UserContext
} from '../notificationGeneration.js';
import { AIManager } from '../../manager.js';
import { AIProviderType } from '../../types/index.js';

// Mock the AI manager
vi.mock('../../manager.js', () => ({
  getGlobalAIManager: vi.fn(() => ({
    generateResponse: vi.fn()
  }))
}));

describe('NotificationGenerationService', () => {
  let service: NotificationGenerationService;
  let mockAIManager: { generateResponse: Mock };

  beforeEach(() => {
    service = new NotificationGenerationService();
    mockAIManager = {
      generateResponse: vi.fn()
    };
    
    // Mock the global AI manager
    const { getGlobalAIManager } = require('../../manager.js');
    (getGlobalAIManager as Mock).mockReturnValue(mockAIManager);
  });

  describe('Stock Price Threshold Notifications', () => {
    it('should generate professional stock price alert', async () => {
      const mockResponse = {
        content: JSON.stringify({
          subject: '🚨 TSLA Alert: Price Above Threshold',
          bodyText: 'Tesla (TSLA) stock has exceeded your threshold of $200, reaching $215.50. This represents a significant movement that may require your attention.',
          keyPoints: [
            'Tesla stock price exceeded $200 threshold',
            'Current price: $215.50 (+7.75% increase)',
            'Threshold breached at 2:30 PM EST'
          ],
          actionRecommendations: [
            'Consider reviewing your position',
            'Check market news for Tesla updates',
            'Evaluate if threshold needs adjustment'
          ],
          estimatedReadTime: '1 min read',
          confidenceScore: 0.95,
          readabilityScore: 'Grade 8'
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const context: NotificationContext = {
        notificationType: NotificationType.THRESHOLD_EXCEEDED,
        urgencyLevel: UrgencyLevel.HIGH,
        triggerReason: 'Stock price exceeded threshold',
        monitorData: {
          monitorId: 'monitor_1',
          monitorName: 'Tesla Stock Price',
          currentValue: 215.50,
          previousValue: 195.00,
          threshold: 200,
          unit: 'USD',
          source: 'Yahoo Finance',
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_1',
          userName: 'John',
          email: 'john@example.com',
          timezone: 'America/New_York',
          preferredTone: ToneStyle.PROFESSIONAL
        }
      };

      const result = await service.generateNotification(context);

      expect(result.subject).toContain('TSLA');
      expect(result.subject).toContain('Alert');
      expect(result.bodyText).toContain('Tesla');
      expect(result.bodyText).toContain('$215.50');
      expect(result.bodyText).toContain('threshold');
      expect(result.urgencyLevel).toBe(UrgencyLevel.HIGH);
      expect(result.keyPoints.length).toBeGreaterThan(0);
      expect(result.actionRecommendations).toBeDefined();
      expect(result.confidenceScore).toBeGreaterThan(0.8);
    });

    it('should handle casual tone for crypto notifications', async () => {
      const mockResponse = {
        content: JSON.stringify({
          subject: '🚀 Bitcoin Alert - Price Jump!',
          bodyText: "Hey there! Just wanted to let you know that Bitcoin just shot above $45,000! That's awesome news since you were watching for it to hit this level. The current price is $45,250 - nice gain from yesterday's $42,800!",
          keyPoints: [
            'Bitcoin crossed your $45,000 threshold',
            'Current price: $45,250',
            'Up from $42,800 yesterday'
          ],
          actionRecommendations: [
            'Maybe check the crypto news to see what triggered this',
            'Consider if you want to adjust your threshold',
            'Keep an eye on the trend over the next few hours'
          ],
          estimatedReadTime: '1 min read',
          confidenceScore: 0.88,
          readabilityScore: 'Grade 6'
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const context: NotificationContext = {
        notificationType: NotificationType.THRESHOLD_EXCEEDED,
        urgencyLevel: UrgencyLevel.HIGH,
        triggerReason: 'Bitcoin price exceeded threshold',
        monitorData: {
          monitorId: 'btc_monitor',
          monitorName: 'Bitcoin Price Watch',
          currentValue: 45250,
          previousValue: 42800,
          threshold: 45000,
          unit: 'USD',
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_2',
          email: 'crypto@example.com',
          preferredTone: ToneStyle.CASUAL,
          notificationPreferences: {
            maxEmailLength: 'medium'
          }
        }
      };

      const result = await service.generateNotification(context);

      expect(result.subject).toMatch(/bitcoin|btc/i);
      expect(result.bodyText).toMatch(/hey|awesome|nice/i); // Casual language
      expect(result.readabilityScore).toBe('Grade 6'); // Simpler for casual tone
      expect(result.personalizationUsed).toContain('tone_customization');
    });
  });

  describe('Weather Alerts', () => {
    it('should generate weather emergency notification', async () => {
      const mockResponse = {
        content: JSON.stringify({
          subject: '⚠️ WEATHER ALERT: Severe Storm Warning',
          bodyText: 'URGENT: A severe thunderstorm warning has been issued for New York. Wind speeds may reach 70 mph with potential for hail. Please take immediate safety precautions and avoid unnecessary travel.',
          keyPoints: [
            'Severe thunderstorm warning active',
            'Wind speeds up to 70 mph expected',
            'Hail possible - seek shelter immediately'
          ],
          actionRecommendations: [
            'Move to a safe, interior room immediately',
            'Avoid windows and doors',
            'Do not drive unless absolutely necessary',
            'Stay tuned to local emergency services'
          ],
          estimatedReadTime: '30 sec read',
          confidenceScore: 0.98,
          readabilityScore: 'Grade 7'
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const context: NotificationContext = {
        notificationType: NotificationType.STATUS_UPDATE,
        urgencyLevel: UrgencyLevel.CRITICAL,
        triggerReason: 'Severe weather warning issued',
        monitorData: {
          monitorId: 'weather_nyc',
          monitorName: 'NYC Weather Monitor',
          currentValue: 'Severe Thunderstorm Warning',
          previousValue: 'Partly Cloudy',
          source: 'National Weather Service',
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_3',
          userName: 'Sarah',
          email: 'sarah@example.com',
          timezone: 'America/New_York',
          preferredTone: ToneStyle.BRIEF,
          notificationPreferences: {
            maxEmailLength: 'short',
            includeActionRecommendations: true
          }
        }
      };

      const result = await service.generateNotification(context);

      expect(result.subject).toContain('WEATHER ALERT');
      expect(result.urgencyLevel).toBe(UrgencyLevel.CRITICAL);
      expect(result.actionRecommendations).toBeDefined();
      expect(result.actionRecommendations!.length).toBeGreaterThan(2);
      expect(result.estimatedReadTime).toContain('30 sec'); // Brief format
    });
  });

  describe('Error Notifications', () => {
    it('should generate monitor error notification', async () => {
      const mockResponse = {
        content: JSON.stringify({
          subject: '❌ Monitor Error: Data Source Unavailable',
          bodyText: 'Your monitor "Website Uptime Check" encountered an error while trying to collect data. The target website (example.com) appears to be temporarily unavailable. We will continue attempting to collect data every 5 minutes.',
          keyPoints: [
            'Monitor failed to collect data',
            'Target website appears offline',
            'Automatic retry every 5 minutes'
          ],
          actionRecommendations: [
            'Check if the website is accessible from your browser',
            'Verify the URL is correct in your monitor settings',
            'Contact support if this error persists for more than 30 minutes'
          ],
          estimatedReadTime: '1 min read',
          confidenceScore: 0.92,
          readabilityScore: 'Grade 8'
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const context: NotificationContext = {
        notificationType: NotificationType.ERROR_OCCURRED,
        urgencyLevel: UrgencyLevel.CRITICAL,
        triggerReason: 'Data source unavailable',
        monitorData: {
          monitorId: 'uptime_monitor',
          monitorName: 'Website Uptime Check',
          currentValue: 'Error: Connection timeout',
          previousValue: 'Online',
          source: 'https://example.com',
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_4',
          email: 'admin@example.com',
          preferredTone: ToneStyle.TECHNICAL,
          notificationPreferences: {
            includeActionRecommendations: true,
            includeHistoricalContext: false
          }
        }
      };

      const result = await service.generateNotification(context);

      expect(result.subject).toContain('Error');
      expect(result.urgencyLevel).toBe(UrgencyLevel.CRITICAL);
      expect(result.bodyText).toContain('error');
      expect(result.bodyText).toContain('unavailable');
      expect(result.actionRecommendations).toBeDefined();
      expect(result.actionRecommendations!.some(rec => 
        rec.includes('support') || rec.includes('contact')
      )).toBe(true);
    });
  });

  describe('Personalization Features', () => {
    it('should include user name and timezone personalization', async () => {
      const mockResponse = {
        content: JSON.stringify({
          subject: 'Apple Stock Alert for Michael',
          bodyText: 'Hi Michael! Your Apple stock monitor triggered at 3:45 PM PST. The current price of $175.30 has exceeded your threshold of $170. This is a 3.2% increase from yesterday.',
          keyPoints: ['Apple stock exceeded threshold', 'Price: $175.30', 'Triggered at 3:45 PM PST'],
          estimatedReadTime: '1 min read',
          confidenceScore: 0.90,
          readabilityScore: 'Grade 7'
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const context: NotificationContext = {
        notificationType: NotificationType.THRESHOLD_EXCEEDED,
        urgencyLevel: UrgencyLevel.MEDIUM,
        triggerReason: 'Stock price threshold exceeded',
        monitorData: {
          monitorId: 'aapl_monitor',
          monitorName: 'Apple Stock Price',
          currentValue: 175.30,
          threshold: 170,
          unit: 'USD',
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_5',
          userName: 'Michael',
          email: 'michael@example.com',
          timezone: 'America/Los_Angeles',
          preferredTone: ToneStyle.CASUAL
        }
      };

      const result = await service.generateNotification(context);

      expect(result.subject).toContain('Michael');
      expect(result.bodyText).toContain('Hi Michael');
      expect(result.bodyText).toContain('PST'); // Timezone reference
      expect(result.personalizationUsed).toContain('user_name');
      expect(result.personalizationUsed).toContain('timezone_localization');
      expect(result.personalizationUsed).toContain('tone_customization');
    });

    it('should handle different email length preferences', async () => {
      const shortResponse = {
        content: JSON.stringify({
          subject: 'Bitcoin Alert',
          bodyText: 'Bitcoin hit $50K. Up from $48K.',
          keyPoints: ['Bitcoin reached threshold'],
          estimatedReadTime: '10 sec read',
          confidenceScore: 0.85,
          readabilityScore: 'Grade 5'
        })
      };

      const longResponse = {
        content: JSON.stringify({
          subject: 'Bitcoin Price Movement Analysis',
          bodyText: 'Your Bitcoin monitor has detected significant price movement. The current price of $50,000 represents a breakthrough of your monitored threshold of $49,000. This 4.17% increase from the previous value of $48,000 occurred during a period of increased institutional adoption and positive regulatory developments. Historical analysis shows this level has acted as resistance three times in the past six months, making this breakthrough particularly significant for technical analysis.',
          keyPoints: [
            'Bitcoin broke through $49K resistance level',
            'Current price: $50,000 (+4.17%)',
            'Historical resistance level now breached',
            'Institutional adoption driving momentum'
          ],
          actionRecommendations: [
            'Review technical analysis charts for next resistance levels',
            'Consider profit-taking strategies if you have an existing position',
            'Monitor news flow for regulatory developments',
            'Evaluate portfolio rebalancing opportunities'
          ],
          estimatedReadTime: '3 min read',
          confidenceScore: 0.95,
          readabilityScore: 'Grade 10'
        })
      };

      // Test short email preference
      mockAIManager.generateResponse.mockResolvedValueOnce(shortResponse);

      const shortContext: NotificationContext = {
        notificationType: NotificationType.THRESHOLD_EXCEEDED,
        urgencyLevel: UrgencyLevel.HIGH,
        triggerReason: 'Price threshold exceeded',
        monitorData: {
          monitorId: 'btc_short',
          monitorName: 'Bitcoin Watch',
          currentValue: 50000,
          previousValue: 48000,
          threshold: 49000,
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_6',
          email: 'short@example.com',
          preferredTone: ToneStyle.BRIEF,
          notificationPreferences: {
            maxEmailLength: 'short'
          }
        }
      };

      const shortResult = await service.generateNotification(shortContext);

      expect(shortResult.bodyText.length).toBeLessThan(100);
      expect(shortResult.estimatedReadTime).toContain('10 sec');

      // Test long email preference  
      mockAIManager.generateResponse.mockResolvedValueOnce(longResponse);

      const longContext: NotificationContext = {
        ...shortContext,
        userContext: {
          ...shortContext.userContext,
          preferredTone: ToneStyle.TECHNICAL,
          notificationPreferences: {
            maxEmailLength: 'long',
            includeHistoricalContext: true,
            includeActionRecommendations: true
          }
        }
      };

      const longResult = await service.generateNotification(longContext);

      expect(longResult.bodyText.length).toBeGreaterThan(200);
      expect(longResult.estimatedReadTime).toContain('3 min');
      expect(longResult.actionRecommendations).toBeDefined();
      expect(longResult.actionRecommendations!.length).toBeGreaterThan(2);
    });
  });

  describe('Urgency Level Determination', () => {
    it('should determine critical urgency for large percentage changes', () => {
      const monitorData: MonitorData = {
        monitorId: 'test',
        monitorName: 'Test Monitor',
        currentValue: 150,
        previousValue: 100,
        threshold: 120,
        timestamp: new Date()
      };

      const urgency = service.determineUrgencyLevel(
        monitorData,
        NotificationType.VALUE_CHANGED,
        50 // 50% change
      );

      expect(urgency).toBe(UrgencyLevel.CRITICAL);
    });

    it('should determine high urgency for threshold exceeded', () => {
      const monitorData: MonitorData = {
        monitorId: 'test',
        monitorName: 'Test Monitor',
        currentValue: 125,
        previousValue: 115,
        threshold: 120,
        timestamp: new Date()
      };

      const urgency = service.determineUrgencyLevel(
        monitorData,
        NotificationType.THRESHOLD_EXCEEDED,
        8.7 // 8.7% change
      );

      expect(urgency).toBe(UrgencyLevel.HIGH);
    });

    it('should determine medium urgency for trends', () => {
      const monitorData: MonitorData = {
        monitorId: 'test',
        monitorName: 'Test Monitor',
        currentValue: 110,
        previousValue: 105,
        timestamp: new Date()
      };

      const urgency = service.determineUrgencyLevel(
        monitorData,
        NotificationType.TREND_DETECTED
      );

      expect(urgency).toBe(UrgencyLevel.MEDIUM);
    });

    it('should determine low urgency for scheduled reports', () => {
      const monitorData: MonitorData = {
        monitorId: 'test',
        monitorName: 'Test Monitor',
        currentValue: 100,
        timestamp: new Date()
      };

      const urgency = service.determineUrgencyLevel(
        monitorData,
        NotificationType.SCHEDULED_REPORT
      );

      expect(urgency).toBe(UrgencyLevel.LOW);
    });
  });

  describe('Action Recommendations', () => {
    it('should generate appropriate recommendations for threshold exceeded', () => {
      const context: NotificationContext = {
        notificationType: NotificationType.THRESHOLD_EXCEEDED,
        urgencyLevel: UrgencyLevel.HIGH,
        triggerReason: 'Price exceeded threshold',
        monitorData: {
          monitorId: 'test',
          monitorName: 'Stock Price Monitor',
          currentValue: 150,
          threshold: 140,
          source: 'Yahoo Finance',
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_test',
          email: 'test@example.com'
        }
      };

      const recommendations = service.generateActionRecommendations(context);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('threshold'))).toBe(true);
      expect(recommendations.some(rec => rec.includes('Yahoo Finance'))).toBe(true);
    });

    it('should generate error-specific recommendations', () => {
      const context: NotificationContext = {
        notificationType: NotificationType.ERROR_OCCURRED,
        urgencyLevel: UrgencyLevel.CRITICAL,
        triggerReason: 'Data source unavailable',
        monitorData: {
          monitorId: 'test',
          monitorName: 'Website Monitor',
          currentValue: 'Error',
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_test',
          email: 'test@example.com'
        }
      };

      const recommendations = service.generateActionRecommendations(context);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('configuration'))).toBe(true);
      expect(recommendations.some(rec => rec.includes('support'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI generation errors gracefully', async () => {
      mockAIManager.generateResponse.mockRejectedValue(new Error('AI service unavailable'));

      const context: NotificationContext = {
        notificationType: NotificationType.THRESHOLD_EXCEEDED,
        urgencyLevel: UrgencyLevel.HIGH,
        triggerReason: 'Test error handling',
        monitorData: {
          monitorId: 'test',
          monitorName: 'Test Monitor',
          currentValue: 100,
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_test',
          email: 'test@example.com'
        }
      };

      const result = await service.generateNotification(context);

      expect(result.subject).toBeDefined();
      expect(result.bodyText).toBeDefined();
      expect(result.confidenceScore).toBeLessThan(0.5);
      expect(result.urgencyLevel).toBe(UrgencyLevel.HIGH); // Should preserve urgency
    });

    it('should handle malformed AI responses', async () => {
      mockAIManager.generateResponse.mockResolvedValue({
        content: 'This is not valid JSON'
      });

      const context: NotificationContext = {
        notificationType: NotificationType.VALUE_CHANGED,
        urgencyLevel: UrgencyLevel.MEDIUM,
        triggerReason: 'Test malformed response',
        monitorData: {
          monitorId: 'test',
          monitorName: 'Test Monitor',
          currentValue: 100,
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_test',
          email: 'test@example.com'
        }
      };

      const result = await service.generateNotification(context);

      expect(result.subject).toBe('Monitor Alert - Processing Error');
      expect(result.bodyText).toContain('issue generating');
      expect(result.confidenceScore).toBe(0.3);
    });
  });

  describe('Content Validation', () => {
    it('should validate notification content quality', () => {
      const goodNotification = {
        subject: 'Tesla Stock Alert: Price Above Threshold',
        bodyText: 'Your Tesla stock monitor has triggered an alert. The current price of $215.50 has exceeded your threshold of $200.00, representing a significant 7.75% increase from the previous value.',
        urgencyLevel: UrgencyLevel.HIGH,
        estimatedReadTime: '1 min read',
        keyPoints: ['Threshold exceeded', 'Price: $215.50', '7.75% increase'],
        templateVariables: {},
        personalizationUsed: [],
        confidenceScore: 0.95,
        generationTime: 1500,
        timestamp: new Date()
      };

      const validation = service.validateNotificationContent(goodNotification);

      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should identify content issues', () => {
      const poorNotification = {
        subject: 'Alert', // Too short
        bodyText: 'Something happened.', // Too short
        urgencyLevel: UrgencyLevel.HIGH,
        estimatedReadTime: '1 min read',
        keyPoints: [], // No key points
        templateVariables: {},
        personalizationUsed: [],
        confidenceScore: 0.3, // Low confidence
        generationTime: 1500,
        timestamp: new Date()
      };

      const validation = service.validateNotificationContent(poorNotification);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues).toContain('Subject line too short (under 10 characters)');
      expect(validation.issues).toContain('Email body too short (under 50 characters)');
      expect(validation.issues).toContain('Low confidence score - content quality may be poor');
      expect(validation.suggestions).toContain('Add key points to improve content structure');
    });
  });

  describe('Batch Generation', () => {
    it('should generate multiple notification variations', async () => {
      const variations = [
        { tone: ToneStyle.PROFESSIONAL, length: 'short' as const, style: 'business formal' },
        { tone: ToneStyle.CASUAL, length: 'medium' as const, style: 'friendly' },
        { tone: ToneStyle.TECHNICAL, length: 'long' as const, style: 'detailed analysis' }
      ];

      // Mock responses for each variation
      const mockResponses = [
        { content: JSON.stringify({ subject: 'Professional Alert', bodyText: 'Formal notification...', keyPoints: ['Alert triggered'], estimatedReadTime: '30 sec read', confidenceScore: 0.90 }) },
        { content: JSON.stringify({ subject: 'Hey! Something happened', bodyText: 'Friendly notification...', keyPoints: ['Alert happened'], estimatedReadTime: '1 min read', confidenceScore: 0.85 }) },
        { content: JSON.stringify({ subject: 'Technical Analysis Alert', bodyText: 'Detailed technical notification...', keyPoints: ['Technical alert', 'Analysis complete'], estimatedReadTime: '2 min read', confidenceScore: 0.95 }) }
      ];

      mockResponses.forEach(response => {
        mockAIManager.generateResponse.mockResolvedValueOnce(response);
      });

      const baseContext: NotificationContext = {
        notificationType: NotificationType.THRESHOLD_EXCEEDED,
        urgencyLevel: UrgencyLevel.HIGH,
        triggerReason: 'Testing variations',
        monitorData: {
          monitorId: 'test',
          monitorName: 'Test Monitor',
          currentValue: 100,
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_test',
          email: 'test@example.com',
          preferredTone: ToneStyle.PROFESSIONAL
        }
      };

      const results = await service.generateNotificationVariations(baseContext, variations);

      expect(results.length).toBe(3);
      expect(results[0].subject).toContain('Professional');
      expect(results[1].subject).toContain('Hey');
      expect(results[2].subject).toContain('Technical');
    });
  });
});

describe('Convenience Functions', () => {
  let mockAIManager: { generateResponse: Mock };

  beforeEach(() => {
    mockAIManager = {
      generateResponse: vi.fn()
    };
    
    const { getGlobalAIManager } = require('../../manager.js');
    (getGlobalAIManager as Mock).mockReturnValue(mockAIManager);
  });

  describe('generateNotification', () => {
    it('should work as convenience function', async () => {
      const mockResponse = {
        content: JSON.stringify({
          subject: 'Test Alert',
          bodyText: 'Test notification body',
          keyPoints: ['Test alert'],
          estimatedReadTime: '1 min read',
          confidenceScore: 0.80
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const context: NotificationContext = {
        notificationType: NotificationType.VALUE_CHANGED,
        urgencyLevel: UrgencyLevel.MEDIUM,
        triggerReason: 'Test notification',
        monitorData: {
          monitorId: 'test',
          monitorName: 'Test',
          currentValue: 100,
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_test',
          email: 'test@example.com'
        }
      };

      const result = await generateNotification(context);

      expect(result.subject).toBe('Test Alert');
      expect(result.bodyText).toBe('Test notification body');
    });
  });

  describe('determineUrgency', () => {
    it('should work as convenience function', () => {
      const monitorData: MonitorData = {
        monitorId: 'test',
        monitorName: 'Test',
        currentValue: 100,
        timestamp: new Date()
      };

      const urgency = determineUrgency(
        monitorData,
        NotificationType.ERROR_OCCURRED
      );

      expect(urgency).toBe(UrgencyLevel.CRITICAL);
    });
  });

  describe('getActionRecommendations', () => {
    it('should work as convenience function', () => {
      const context: NotificationContext = {
        notificationType: NotificationType.TREND_DETECTED,
        urgencyLevel: UrgencyLevel.MEDIUM,
        triggerReason: 'Test recommendations',
        monitorData: {
          monitorId: 'test',
          monitorName: 'Test',
          currentValue: 100,
          timestamp: new Date()
        },
        userContext: {
          userId: 'user_test',
          email: 'test@example.com'
        }
      };

      const recommendations = getActionRecommendations(context);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('trend'))).toBe(true);
    });
  });
});