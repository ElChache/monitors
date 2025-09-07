/**
 * Comprehensive Test Suite for Fact Extraction Service
 * Tests various content types, validation, and quality scoring
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { 
  FactExtractionService, 
  extractFacts, 
  extractFactsBatch,
  ContentType, 
  FactType,
  FactExtractionInputSchema,
  BatchExtractionInputSchema,
  type ExtractedFact,
  type FactExtractionResult 
} from '../factExtraction.js';
import type { AIManager, AIResponse } from '../../manager.js';

// Mock AI Manager for testing
const mockAIManager = {
  generateResponse: vi.fn()
} as unknown as AIManager;

describe('FactExtractionService', () => {
  let service: FactExtractionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FactExtractionService(mockAIManager);
  });

  describe('Content Type Handling', () => {
    it('should handle HTML content extraction', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: JSON.stringify([
          {
            id: 'price-fact',
            type: 'numerical',
            value: 299.99,
            confidence: 0.95,
            location: 'span.price',
            unit: 'USD'
          }
        ]),
        provider: 'claude',
        tokenUsage: { input: 100, output: 50 },
        processingTime: 1500
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const input = {
        content: '<div class="product"><span class="price">$299.99</span></div>',
        contentType: ContentType.HTML,
        expectedFacts: ['price']
      };

      const result = await service.extractFacts(input);

      expect(result.success).toBe(true);
      expect(result.facts).toHaveLength(1);
      expect(result.facts[0].type).toBe(FactType.NUMERICAL);
      expect(result.facts[0].value).toBe(299.99);
      expect(result.facts[0].metadata.unit).toBe('USD');
    });

    it('should handle JSON-LD structured data', async () => {
      const jsonLD = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Example Product',
        price: '49.99',
        currency: 'USD'
      });

      const mockResponse: AIResponse = {
        success: true,
        content: JSON.stringify([
          {
            id: 'product-name',
            type: 'text',
            value: 'Example Product',
            confidence: 0.98
          },
          {
            id: 'product-price', 
            type: 'numerical',
            value: 49.99,
            confidence: 0.95,
            unit: 'USD'
          }
        ]),
        provider: 'claude',
        tokenUsage: { input: 150, output: 75 },
        processingTime: 1200
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const result = await service.extractFacts({
        content: jsonLD,
        contentType: ContentType.JSON_LD
      });

      expect(result.success).toBe(true);
      expect(result.facts).toHaveLength(2);
      expect(result.contentAnalysis.structure).toBe('structured');
    });

    it('should handle table data extraction', async () => {
      const tableHTML = `
        <table>
          <tr><td>Tesla</td><td>$245.67</td><td>+2.3%</td></tr>
          <tr><td>Apple</td><td>$150.23</td><td>-0.5%</td></tr>
        </table>
      `;

      const mockResponse: AIResponse = {
        success: true,
        content: JSON.stringify([
          {
            id: 'tesla-price',
            type: 'numerical',
            value: 245.67,
            confidence: 0.92,
            context: 'Tesla stock price'
          },
          {
            id: 'apple-price',
            type: 'numerical', 
            value: 150.23,
            confidence: 0.92,
            context: 'Apple stock price'
          }
        ]),
        provider: 'claude',
        tokenUsage: { input: 200, output: 100 },
        processingTime: 1800
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const result = await service.extractFacts({
        content: tableHTML,
        contentType: ContentType.TABLE,
        expectedFacts: ['stock prices']
      });

      expect(result.success).toBe(true);
      expect(result.facts).toHaveLength(2);
      expect(result.facts.every(f => f.type === FactType.NUMERICAL)).toBe(true);
    });
  });

  describe('Fact Validation and Quality Scoring', () => {
    it('should validate numerical facts correctly', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: JSON.stringify([
          {
            id: 'valid-number',
            type: 'numerical',
            value: 123.45,
            confidence: 0.9
          },
          {
            id: 'invalid-number',
            type: 'numerical', 
            value: 'not-a-number',
            confidence: 0.8
          }
        ]),
        provider: 'claude',
        tokenUsage: { input: 100, output: 50 },
        processingTime: 1000
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const result = await service.extractFacts({
        content: 'Price is $123.45 and status is not-a-number',
        contentType: ContentType.TEXT
      });

      expect(result.success).toBe(true);
      expect(result.facts).toHaveLength(1); // Invalid fact filtered out
      expect(result.facts[0].validation.isValid).toBe(true);
      expect(result.qualitySummary.validationIssues).toBe(0);
    });

    it('should validate temporal facts correctly', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: JSON.stringify([
          {
            id: 'valid-date',
            type: 'temporal',
            value: '2024-01-15T10:30:00Z',
            confidence: 0.95
          },
          {
            id: 'invalid-date',
            type: 'temporal',
            value: 'invalid-date-string',
            confidence: 0.7
          }
        ]),
        provider: 'claude',
        tokenUsage: { input: 120, output: 60 },
        processingTime: 1100
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const result = await service.extractFacts({
        content: 'Meeting on 2024-01-15T10:30:00Z at invalid-date-string',
        contentType: ContentType.TEXT
      });

      expect(result.success).toBe(true);
      expect(result.facts).toHaveLength(1);
      expect(result.facts[0].type).toBe(FactType.TEMPORAL);
      expect(result.facts[0].validation.isValid).toBe(true);
    });

    it('should validate URL facts correctly', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: JSON.stringify([
          {
            id: 'valid-url',
            type: 'url',
            value: 'https://example.com/page',
            confidence: 0.9
          },
          {
            id: 'invalid-url',
            type: 'url',
            value: 'not-a-valid-url',
            confidence: 0.6
          }
        ]),
        provider: 'claude',
        tokenUsage: { input: 110, output: 55 },
        processingTime: 1050
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const result = await service.extractFacts({
        content: 'Visit https://example.com/page or not-a-valid-url',
        contentType: ContentType.TEXT
      });

      expect(result.success).toBe(true);
      expect(result.facts).toHaveLength(1);
      expect(result.facts[0].type).toBe(FactType.URL);
      expect(result.facts[0].validation.isValid).toBe(true);
    });

    it('should apply quality threshold filtering', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: JSON.stringify([
          {
            id: 'high-quality',
            type: 'text',
            value: 'High quality fact',
            confidence: 0.95
          },
          {
            id: 'low-quality',
            type: 'text',
            value: 'Low quality fact',
            confidence: 0.3
          }
        ]),
        provider: 'claude',
        tokenUsage: { input: 100, output: 50 },
        processingTime: 1000
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const result = await service.extractFacts({
        content: 'Some content with mixed quality facts',
        contentType: ContentType.TEXT,
        qualityThreshold: 0.7
      });

      expect(result.success).toBe(true);
      expect(result.facts).toHaveLength(1);
      expect(result.facts[0].confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.qualitySummary.overallScore).toBeGreaterThan(0.7);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple extractions in parallel', async () => {
      const mockResponse1: AIResponse = {
        success: true,
        content: JSON.stringify([{ id: 'fact1', type: 'text', value: 'Fact 1', confidence: 0.9 }]),
        provider: 'claude',
        tokenUsage: { input: 50, output: 25 },
        processingTime: 500
      };

      const mockResponse2: AIResponse = {
        success: true,
        content: JSON.stringify([{ id: 'fact2', type: 'numerical', value: 42, confidence: 0.85 }]),
        provider: 'claude',
        tokenUsage: { input: 60, output: 30 },
        processingTime: 600
      };

      (mockAIManager.generateResponse as Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const batchInput = {
        extractions: [
          { content: 'Content 1', contentType: ContentType.TEXT },
          { content: 'Content 2 with number 42', contentType: ContentType.TEXT }
        ]
      };

      const result = await service.extractFactsBatch(batchInput);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].facts).toHaveLength(1);
      expect(result.results[1].facts).toHaveLength(1);
      expect(mockAIManager.generateResponse).toHaveBeenCalledTimes(2);
    });

    it('should handle batch timeout correctly', async () => {
      // Mock a slow AI response
      (mockAIManager.generateResponse as Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          content: '[]',
          provider: 'claude',
          tokenUsage: { input: 50, output: 25 },
          processingTime: 3000
        }), 2000))
      );

      const batchInput = {
        extractions: [
          { content: 'Content 1', contentType: ContentType.TEXT }
        ],
        timeout: 1000 // 1 second timeout
      };

      const result = await service.extractFactsBatch(batchInput);

      expect(result.success).toBe(false);
      expect(result.results[0].error).toContain('timed out');
    });

    it('should find correlations between facts when requested', async () => {
      const mockResponse1: AIResponse = {
        success: true,
        content: JSON.stringify([
          { id: 'price1', type: 'numerical', value: 100, confidence: 0.9 }
        ]),
        provider: 'claude',
        tokenUsage: { input: 50, output: 25 },
        processingTime: 500
      };

      const mockResponse2: AIResponse = {
        success: true,
        content: JSON.stringify([
          { id: 'price2', type: 'numerical', value: 105, confidence: 0.85 }
        ]),
        provider: 'claude',
        tokenUsage: { input: 60, output: 30 },
        processingTime: 600
      };

      (mockAIManager.generateResponse as Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const batchInput = {
        extractions: [
          { content: 'Price: $100', contentType: ContentType.TEXT },
          { content: 'Cost: $105', contentType: ContentType.TEXT }
        ],
        correlate: true
      };

      const result = await service.extractFactsBatch(batchInput);

      expect(result.success).toBe(true);
      expect(result.correlations).toHaveLength(1);
      expect(result.correlations[0].relationship).toBe('similar_values');
      expect(result.correlations[0].confidence).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      (mockAIManager.generateResponse as Mock).mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
        provider: 'claude',
        tokenUsage: { input: 0, output: 0 },
        processingTime: 100
      });

      const result = await service.extractFacts({
        content: 'Test content',
        contentType: ContentType.TEXT
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI extraction failed');
      expect(result.facts).toHaveLength(0);
    });

    it('should handle invalid AI response format', async () => {
      (mockAIManager.generateResponse as Mock).mockResolvedValue({
        success: true,
        content: 'Invalid JSON response',
        provider: 'claude',
        tokenUsage: { input: 50, output: 25 },
        processingTime: 500
      });

      const result = await service.extractFacts({
        content: 'Test content',
        contentType: ContentType.TEXT
      });

      expect(result.success).toBe(true);
      expect(result.facts).toHaveLength(0); // No facts extracted due to parsing failure
    });

    it('should validate input schemas', async () => {
      await expect(async () => {
        await service.extractFacts({
          content: '', // Empty content should fail validation
          contentType: ContentType.TEXT
        });
      }).rejects.toThrow();
    });
  });

  describe('Content Analysis', () => {
    it('should analyze content structure correctly', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: '[]',
        provider: 'claude',
        tokenUsage: { input: 50, output: 10 },
        processingTime: 300
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const htmlResult = await service.extractFacts({
        content: '<div>HTML content</div>',
        contentType: ContentType.HTML
      });

      const jsonResult = await service.extractFacts({
        content: '{"key": "value"}',
        contentType: ContentType.JSON_LD
      });

      const textResult = await service.extractFacts({
        content: 'Plain text content',
        contentType: ContentType.TEXT
      });

      expect(htmlResult.contentAnalysis.structure).toBe('semi-structured');
      expect(jsonResult.contentAnalysis.structure).toBe('structured');
      expect(textResult.contentAnalysis.structure).toBe('unstructured');
    });

    it('should detect content language', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: '[]',
        provider: 'claude',
        tokenUsage: { input: 100, output: 10 },
        processingTime: 300
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const result = await service.extractFacts({
        content: 'The quick brown fox jumps over the lazy dog and is very happy',
        contentType: ContentType.TEXT
      });

      expect(result.contentAnalysis.language).toBe('en');
    });
  });

  describe('Quality Summary Generation', () => {
    it('should generate accurate quality summaries', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: JSON.stringify([
          { id: 'fact1', type: 'text', value: 'High quality', confidence: 0.95 },
          { id: 'fact2', type: 'text', value: 'Medium quality', confidence: 0.75 },
          { id: 'fact3', type: 'text', value: 'Low quality', confidence: 0.4 }
        ]),
        provider: 'claude',
        tokenUsage: { input: 100, output: 75 },
        processingTime: 1000
      };

      (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

      const result = await service.extractFacts({
        content: 'Mixed quality content',
        contentType: ContentType.TEXT,
        qualityThreshold: 0.5
      });

      expect(result.qualitySummary.overallScore).toBeGreaterThan(0);
      expect(result.qualitySummary.highConfidenceFacts).toBeGreaterThan(0);
      expect(result.qualitySummary.recommendedActions).toBeDefined();
      expect(Array.isArray(result.qualitySummary.recommendedActions)).toBe(true);
    });
  });
});

// Test utility functions
describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export extractFacts utility function', async () => {
    const mockResponse: AIResponse = {
      success: true,
      content: JSON.stringify([
        { id: 'test-fact', type: 'text', value: 'Test value', confidence: 0.9 }
      ]),
      provider: 'claude',
      tokenUsage: { input: 50, output: 25 },
      processingTime: 500
    };

    // Mock the global AI manager
    const originalGetGlobal = vi.fn().mockReturnValue(mockAIManager);
    (mockAIManager.generateResponse as Mock).mockResolvedValue(mockResponse);

    // This would require mocking the global AI manager import
    // For now, we'll test that the function exists and can be called
    expect(typeof extractFacts).toBe('function');
  });

  it('should export extractFactsBatch utility function', () => {
    expect(typeof extractFactsBatch).toBe('function');
  });
});

// Schema validation tests
describe('Input Schema Validation', () => {
  it('should validate FactExtractionInputSchema correctly', () => {
    const validInput = {
      content: 'Test content',
      contentType: ContentType.TEXT,
      qualityThreshold: 0.8
    };

    const parsed = FactExtractionInputSchema.parse(validInput);
    expect(parsed.content).toBe('Test content');
    expect(parsed.contentType).toBe(ContentType.TEXT);
    expect(parsed.qualityThreshold).toBe(0.8);
  });

  it('should validate BatchExtractionInputSchema correctly', () => {
    const validInput = {
      extractions: [
        { content: 'Content 1', contentType: ContentType.TEXT },
        { content: 'Content 2', contentType: ContentType.HTML }
      ],
      correlate: true,
      timeout: 15000
    };

    const parsed = BatchExtractionInputSchema.parse(validInput);
    expect(parsed.extractions).toHaveLength(2);
    expect(parsed.correlate).toBe(true);
    expect(parsed.timeout).toBe(15000);
  });

  it('should reject invalid input schemas', () => {
    expect(() => {
      FactExtractionInputSchema.parse({
        content: '', // Empty content
        contentType: ContentType.TEXT
      });
    }).toThrow();

    expect(() => {
      BatchExtractionInputSchema.parse({
        extractions: [] // Empty array
      });
    }).toThrow();
  });
});