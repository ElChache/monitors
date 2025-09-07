/**
 * Test suite for AI002: Prompt Classification Service
 * 
 * Comprehensive tests for prompt classification, entity extraction,
 * condition parsing, and frequency determination.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  PromptClassificationService,
  classifyPrompt,
  isValidMonitorPrompt,
  MonitorType,
  EntityType,
  ConditionType,
  MonitoringFrequency,
  type PromptClassificationResult
} from '../promptClassification.js';
import { AIManager } from '../../manager.js';
import { AIProviderType } from '../../types/index.js';

// Mock the AI manager
vi.mock('../../manager.js', () => ({
  getGlobalAIManager: vi.fn(() => ({
    generateResponse: vi.fn()
  }))
}));

describe('PromptClassificationService', () => {
  let service: PromptClassificationService;
  let mockAIManager: { generateResponse: Mock };

  beforeEach(() => {
    service = new PromptClassificationService();
    mockAIManager = {
      generateResponse: vi.fn()
    };
    
    // Mock the global AI manager
    const { getGlobalAIManager } = require('../../manager.js');
    (getGlobalAIManager as Mock).mockReturnValue(mockAIManager);
  });

  describe('State Monitor Classification', () => {
    it('should classify state monitoring prompts correctly', async () => {
      const mockResponse = {
        content: JSON.stringify({
          monitorType: 'state',
          confidence: 0.95,
          reasoning: 'User wants current value information',
          entities: [{
            type: 'stock',
            value: 'TSLA',
            confidence: 0.90
          }],
          primaryEntity: {
            type: 'stock', 
            value: 'TSLA',
            confidence: 0.90
          },
          conditions: [],
          frequency: {
            recommended: 'frequent',
            reasoning: 'Stock prices change frequently',
            confidence: 0.85
          },
          isValid: true,
          validationErrors: [],
          qualityScore: 0.90
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.classifyPrompt("What is Tesla's current stock price?");

      expect(result.monitorType).toBe(MonitorType.STATE);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].type).toBe(EntityType.STOCK);
      expect(result.entities[0].value).toBe('TSLA');
      expect(result.isValid).toBe(true);
    });

    it('should handle weather state monitoring', async () => {
      const mockResponse = {
        content: JSON.stringify({
          monitorType: 'state',
          confidence: 0.88,
          reasoning: 'User wants current weather information',
          entities: [{
            type: 'weather',
            value: 'New York',
            confidence: 0.92
          }],
          primaryEntity: {
            type: 'weather',
            value: 'New York', 
            confidence: 0.92
          },
          conditions: [],
          frequency: {
            recommended: 'regular',
            reasoning: 'Weather updates every 30-60 minutes',
            confidence: 0.80
          },
          isValid: true,
          validationErrors: [],
          qualityScore: 0.85
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.classifyPrompt("What's the weather in New York?");

      expect(result.monitorType).toBe(MonitorType.STATE);
      expect(result.entities[0].type).toBe(EntityType.WEATHER);
      expect(result.entities[0].value).toBe('New York');
      expect(result.frequency.recommended).toBe(MonitoringFrequency.REGULAR);
    });
  });

  describe('Change Monitor Classification', () => {
    it('should classify change monitoring prompts with thresholds', async () => {
      const mockResponse = {
        content: JSON.stringify({
          monitorType: 'change',
          confidence: 0.95,
          reasoning: 'User wants notification when threshold is exceeded',
          entities: [{
            type: 'stock',
            value: 'TSLA',
            confidence: 0.95
          }],
          primaryEntity: {
            type: 'stock',
            value: 'TSLA',
            confidence: 0.95
          },
          conditions: [{
            type: 'greater_than',
            value: 200,
            confidence: 0.90,
            metadata: { unit: 'USD' }
          }],
          frequency: {
            recommended: 'frequent',
            reasoning: 'Stock price monitoring needs frequent checks',
            customInterval: 15,
            confidence: 0.90
          },
          isValid: true,
          validationErrors: [],
          qualityScore: 0.95
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.classifyPrompt("Tell me when Tesla stock goes above $200");

      expect(result.monitorType).toBe(MonitorType.CHANGE);
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0].type).toBe(ConditionType.GREATER_THAN);
      expect(result.conditions[0].value).toBe(200);
      expect(result.frequency.customInterval).toBe(15);
    });

    it('should handle complex multi-condition monitoring', async () => {
      const mockResponse = {
        content: JSON.stringify({
          monitorType: 'change',
          confidence: 0.85,
          reasoning: 'Multiple conditions for comprehensive monitoring',
          entities: [{
            type: 'stock',
            value: 'AAPL',
            confidence: 0.90
          }],
          primaryEntity: {
            type: 'stock',
            value: 'AAPL',
            confidence: 0.90
          },
          conditions: [
            {
              type: 'greater_than',
              value: 150,
              confidence: 0.90
            },
            {
              type: 'less_than',
              value: 200,
              confidence: 0.85
            }
          ],
          frequency: {
            recommended: 'frequent',
            reasoning: 'Range monitoring requires frequent checks',
            confidence: 0.85
          },
          isValid: true,
          validationErrors: [],
          qualityScore: 0.80
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.classifyPrompt("Alert me when Apple stock is between $150 and $200");

      expect(result.conditions).toHaveLength(2);
      expect(result.conditions[0].type).toBe(ConditionType.GREATER_THAN);
      expect(result.conditions[1].type).toBe(ConditionType.LESS_THAN);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract cryptocurrency entities', async () => {
      const mockResponse = {
        content: JSON.stringify({
          monitorType: 'change',
          confidence: 0.90,
          reasoning: 'Cryptocurrency price threshold monitoring',
          entities: [{
            type: 'cryptocurrency',
            value: 'BTC',
            confidence: 0.95,
            metadata: { fullName: 'Bitcoin' }
          }],
          primaryEntity: {
            type: 'cryptocurrency',
            value: 'BTC',
            confidence: 0.95
          },
          conditions: [{
            type: 'greater_than',
            value: 50000,
            confidence: 0.90
          }],
          frequency: {
            recommended: 'real_time',
            reasoning: 'Crypto prices are highly volatile',
            confidence: 0.88
          },
          isValid: true,
          validationErrors: [],
          qualityScore: 0.90
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.classifyPrompt("Notify me when Bitcoin goes above $50,000");

      expect(result.entities[0].type).toBe(EntityType.CRYPTOCURRENCY);
      expect(result.entities[0].value).toBe('BTC');
      expect(result.frequency.recommended).toBe(MonitoringFrequency.REAL_TIME);
    });

    it('should extract sports team entities', async () => {
      const mockResponse = {
        content: JSON.stringify({
          monitorType: 'change',
          confidence: 0.85,
          reasoning: 'Sports team status monitoring',
          entities: [{
            type: 'sports_team',
            value: 'Lakers',
            confidence: 0.88
          }],
          primaryEntity: {
            type: 'sports_team',
            value: 'Lakers',
            confidence: 0.88
          },
          conditions: [{
            type: 'contains',
            value: 'win',
            confidence: 0.80
          }],
          frequency: {
            recommended: 'daily',
            reasoning: 'Sports updates typically daily during season',
            confidence: 0.85
          },
          isValid: true,
          validationErrors: [],
          qualityScore: 0.75
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.classifyPrompt("Tell me when the Lakers win a game");

      expect(result.entities[0].type).toBe(EntityType.SPORTS_TEAM);
      expect(result.entities[0].value).toBe('Lakers');
    });
  });

  describe('Frequency Determination', () => {
    it('should recommend appropriate frequencies for different content types', async () => {
      const testCases = [
        {
          prompt: "Monitor Tesla stock price",
          expectedFrequency: MonitoringFrequency.FREQUENT
        },
        {
          prompt: "Check weather in Miami daily",
          expectedFrequency: MonitoringFrequency.DAILY
        },
        {
          prompt: "Weekly report on Apple news",
          expectedFrequency: MonitoringFrequency.WEEKLY
        }
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          content: JSON.stringify({
            monitorType: 'state',
            confidence: 0.80,
            reasoning: 'Test frequency determination',
            entities: [],
            conditions: [],
            frequency: {
              recommended: testCase.expectedFrequency,
              reasoning: 'Frequency based on content type',
              confidence: 0.80
            },
            isValid: true,
            validationErrors: [],
            qualityScore: 0.75
          })
        };

        mockAIManager.generateResponse.mockResolvedValue(mockResponse);
        const result = await service.classifyPrompt(testCase.prompt);
        expect(result.frequency.recommended).toBe(testCase.expectedFrequency);
      }
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle AI response parsing errors gracefully', async () => {
      mockAIManager.generateResponse.mockResolvedValue({
        content: 'Invalid JSON response'
      });

      const result = await service.classifyPrompt("Test invalid response");

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.monitorType).toBe(MonitorType.STATE); // fallback
    });

    it('should handle AI manager errors', async () => {
      mockAIManager.generateResponse.mockRejectedValue(new Error('API Error'));

      const result = await service.classifyPrompt("Test API error");

      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContain('Processing error: API Error');
      expect(result.qualityScore).toBeLessThan(0.5);
    });

    it('should validate entity quality', () => {
      const entities = [
        { type: EntityType.STOCK, value: 'TSLA', confidence: 0.95 },
        { type: EntityType.STOCK, value: '', confidence: 0.80 }, // empty value
        { type: EntityType.STOCK, value: 'AAPL', confidence: 0.20 } // low confidence
      ];

      const errors = service.validateEntities(entities);

      expect(errors).toContain('Entity 2 has empty value');
      expect(errors).toContain('Entity 3 has very low confidence (0.2)');
    });

    it('should validate condition quality', () => {
      const conditions = [
        { type: ConditionType.GREATER_THAN, value: 100, confidence: 0.90 },
        { type: ConditionType.GREATER_THAN, value: 'invalid', confidence: 0.80 }, // wrong type
        { type: ConditionType.LESS_THAN, value: 50, confidence: 0.15 } // low confidence
      ];

      const errors = service.validateConditions(conditions);

      expect(errors).toContain('Condition 2: greater_than requires numeric value');
      expect(errors).toContain('Condition 3 has very low confidence');
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple prompts in batches', async () => {
      const prompts = [
        "What is Tesla stock price?",
        "Tell me when Apple goes above $150",
        "Monitor Bitcoin price"
      ];

      // Mock responses for each prompt
      const mockResponses = prompts.map((_, index) => ({
        content: JSON.stringify({
          monitorType: index % 2 === 0 ? 'state' : 'change',
          confidence: 0.85,
          reasoning: `Test classification ${index}`,
          entities: [],
          conditions: [],
          frequency: {
            recommended: 'daily',
            reasoning: 'Test frequency',
            confidence: 0.80
          },
          isValid: true,
          validationErrors: [],
          qualityScore: 0.80
        })
      }));

      mockResponses.forEach(response => {
        mockAIManager.generateResponse.mockResolvedValueOnce(response);
      });

      const results = await service.classifyPrompts(prompts);

      expect(results).toHaveLength(3);
      expect(results[0].monitorType).toBe(MonitorType.STATE);
      expect(results[1].monitorType).toBe(MonitorType.CHANGE);
      expect(results[2].monitorType).toBe(MonitorType.STATE);
    });
  });

  describe('Improvement Suggestions', () => {
    it('should generate improvement suggestions for low-quality prompts', async () => {
      const classificationMockResponse = {
        content: JSON.stringify({
          monitorType: 'state',
          confidence: 0.40,
          reasoning: 'Unclear prompt classification',
          entities: [],
          conditions: [],
          frequency: {
            recommended: 'daily',
            reasoning: 'Default frequency',
            confidence: 0.40
          },
          isValid: false,
          validationErrors: ['No entities found', 'Unclear intent'],
          qualityScore: 0.30
        })
      };

      const improvementMockResponse = {
        content: JSON.stringify({
          suggestions: [
            'Be more specific about what you want to monitor',
            'Include specific threshold values',
            'Specify desired frequency'
          ],
          improvedPrompt: 'Tell me when Tesla (TSLA) stock price goes above $200, check every 15 minutes'
        })
      };

      mockAIManager.generateResponse
        .mockResolvedValueOnce(classificationMockResponse)
        .mockResolvedValueOnce(improvementMockResponse);

      const result = await service.classifyPrompt("Monitor something", {
        includeImprovements: true
      });

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.improvedPrompt).toBeDefined();
      expect(result.improvedPrompt).toContain('Tesla');
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

  describe('classifyPrompt', () => {
    it('should work as convenience function', async () => {
      const mockResponse = {
        content: JSON.stringify({
          monitorType: 'change',
          confidence: 0.90,
          reasoning: 'Test classification',
          entities: [],
          conditions: [],
          frequency: {
            recommended: 'daily',
            reasoning: 'Test frequency',
            confidence: 0.80
          },
          isValid: true,
          validationErrors: [],
          qualityScore: 0.85
        })
      };

      mockAIManager.generateResponse.mockResolvedValue(mockResponse);

      const result = await classifyPrompt("Test prompt");

      expect(result.monitorType).toBe(MonitorType.CHANGE);
      expect(result.confidence).toBe(0.90);
    });
  });

  describe('isValidMonitorPrompt', () => {
    it('should validate high-quality results correctly', () => {
      const goodResult: PromptClassificationResult = {
        monitorType: MonitorType.CHANGE,
        confidence: 0.90,
        reasoning: 'Clear classification',
        entities: [{ type: EntityType.STOCK, value: 'TSLA', confidence: 0.95 }],
        primaryEntity: { type: EntityType.STOCK, value: 'TSLA', confidence: 0.95 },
        conditions: [],
        frequency: {
          recommended: MonitoringFrequency.FREQUENT,
          reasoning: 'Stock monitoring',
          confidence: 0.85
        },
        isValid: true,
        validationErrors: [],
        qualityScore: 0.90,
        processingTime: 1000,
        timestamp: new Date()
      };

      expect(isValidMonitorPrompt(goodResult)).toBe(true);
    });

    it('should reject low-quality results', () => {
      const badResult: PromptClassificationResult = {
        monitorType: MonitorType.STATE,
        confidence: 0.30, // low confidence
        reasoning: 'Unclear classification',
        entities: [], // no entities
        conditions: [],
        frequency: {
          recommended: MonitoringFrequency.DAILY,
          reasoning: 'Default',
          confidence: 0.30
        },
        isValid: false,
        validationErrors: ['No entities found'],
        qualityScore: 0.20, // low quality
        processingTime: 1000,
        timestamp: new Date()
      };

      expect(isValidMonitorPrompt(badResult)).toBe(false);
    });
  });
});