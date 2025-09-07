import { test, expect } from '@playwright/test';
import { 
  ClassificationInputSchema, 
  ClassificationOutputSchema 
} from '$lib/ai/test/interfaces';

test.describe('AI-Powered Monitor Creation', () => {
  test('classify simple monitor prompt', async ({ request }) => {
    const response = await request.post('/api/monitors', {
      data: {
        userInput: 'Alert me when Tesla stock drops 5%',
        userContext: { userId: 'test_user_123' }
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();

    // Validate AI classification
    const classification = ClassificationOutputSchema.parse(responseData.aiClassification);
    
    expect(classification.monitorType).toBe('change');
    expect(classification.extractedFact).toContain('Tesla stock');
    expect(classification.confidence).toBeGreaterThan(0.8);
  });

  test('handle complex multi-condition prompt', async ({ request }) => {
    const response = await request.post('/api/monitors', {
      data: {
        userInput: 'Alert me when Tesla stock drops 5% AND trading volume exceeds 10 million',
        userContext: { userId: 'test_user_123' }
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();

    const classification = ClassificationOutputSchema.parse(responseData.aiClassification);
    
    expect(classification.monitorType).toBe('complex');
    expect(classification.extractedFact).toContain('Tesla stock');
    expect(classification.triggerCondition).toContain('volume');
    expect(classification.confidence).toBeGreaterThan(0.75);
  });

  test('provide template suggestions', async ({ request }) => {
    const response = await request.post('/api/monitors', {
      data: {
        userInput: 'Track stock prices',
        userContext: { userId: 'test_user_123' }
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();

    expect(responseData.suggestions).toBeDefined();
    expect(Array.isArray(responseData.suggestions)).toBe(true);
    expect(responseData.suggestions.length).toBeGreaterThan(0);

    responseData.suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('template');
      expect(suggestion).toHaveProperty('confidence');
    });
  });

  test('handle ambiguous prompt', async ({ request }) => {
    const response = await request.post('/api/monitors', {
      data: {
        userInput: 'Something interesting',
        userContext: { userId: 'test_user_123' }
      }
    });

    expect(response.status()).toBe(400);
    const errorResponse = await response.json();

    expect(errorResponse).toHaveProperty('error');
    expect(errorResponse.error).toContain('unclear');
  });

  test('fallback for AI service failure', async ({ request }) => {
    // Simulate AI service failure by using a special test input
    const response = await request.post('/api/monitors', {
      data: {
        userInput: 'TRIGGER_AI_SERVICE_FAILURE',
        userContext: { userId: 'test_user_123' }
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();

    // Verify fallback mechanism
    expect(responseData).toHaveProperty('fallbackClassification');
    expect(responseData.fallbackClassification.monitorType).toBe('manual');
    expect(responseData.fallbackClassification.confidence).toBe(0.5);
  });
});