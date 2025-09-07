import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIManager, createAIManager } from '../manager.js';
import { ClaudeProvider } from '../providers/claude.js';
import { OpenAIProvider } from '../providers/openai.js';
import { AIProviderError, AIErrorType } from '../types/index.js';
import type { AIPrompt } from '../types/index.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AIManager', () => {
  let aiManager: AIManager;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    aiManager = createAIManager({
      providers: {
        claude: {
          apiKey: 'test-claude-key',
          priority: 9,
          enabled: true
        },
        openai: {
          apiKey: 'test-openai-key', 
          priority: 7,
          enabled: true
        }
      },
      retrySettings: {
        maxRetries: 2,
        retryDelay: 100,
        backoffMultiplier: 1.5
      },
      healthCheckInterval: 0 // Disable for testing
    });
  });

  afterEach(() => {
    aiManager.shutdown();
  });

  describe('Provider Management', () => {
    it('should initialize with configured providers', () => {
      const claudeProvider = aiManager.getProvider('claude');
      const openaiProvider = aiManager.getProvider('openai');
      
      expect(claudeProvider).toBeInstanceOf(ClaudeProvider);
      expect(openaiProvider).toBeInstanceOf(OpenAIProvider);
    });

    it('should return metrics for all providers', () => {
      const metrics = aiManager.getProvidersMetrics();
      
      expect(metrics).toHaveLength(2);
      expect(metrics.some(m => m.provider === 'claude')).toBe(true);
      expect(metrics.some(m => m.provider === 'openai')).toBe(true);
    });

    it('should return cost metrics', () => {
      const costMetrics = aiManager.getCostMetrics();
      
      expect(costMetrics).toHaveLength(2);
      expect(costMetrics.every(c => c.totalCost === 0)).toBe(true); // No requests yet
    });
  });

  describe('Response Generation', () => {
    const testPrompt: AIPrompt = {
      content: 'What is the weather like?',
      role: 'user',
      maxTokens: 100
    };

    it('should generate response from primary provider', async () => {
      // Mock successful Claude response
      const mockClaudeResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'The weather is sunny.' }],
          model: 'claude-3-sonnet-20240229',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 }
        })
      };

      (global.fetch as any).mockResolvedValueOnce(mockClaudeResponse);

      const response = await aiManager.generateResponse(testPrompt);

      expect(response.content).toBe('The weather is sunny.');
      expect(response.provider).toBe('claude');
      expect(response.usage.totalTokens).toBe(15);
    });

    it('should fallback to secondary provider on failure', async () => {
      // Mock Claude failure
      const mockClaudeError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({})
      };

      // Mock successful OpenAI response
      const mockOpenAIResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'test-openai-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-4',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: 'The weather is cloudy.' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 8, completion_tokens: 4, total_tokens: 12 }
        })
      };

      (global.fetch as any)
        .mockResolvedValueOnce(mockClaudeError)
        .mockResolvedValueOnce(mockOpenAIResponse);

      const response = await aiManager.generateResponse(testPrompt);

      expect(response.content).toBe('The weather is cloudy.');
      expect(response.provider).toBe('openai');
      expect(response.usage.totalTokens).toBe(12);
    });

    it('should respect preferred provider', async () => {
      // Mock successful OpenAI response
      const mockOpenAIResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'test-openai-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-4',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: 'OpenAI response.' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 8, completion_tokens: 3, total_tokens: 11 }
        })
      };

      (global.fetch as any).mockResolvedValueOnce(mockOpenAIResponse);

      const response = await aiManager.generateResponse(testPrompt, 'openai');

      expect(response.content).toBe('OpenAI response.');
      expect(response.provider).toBe('openai');
    });

    it('should throw error when all providers fail', async () => {
      // Mock failures for both providers
      const mockError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({})
      };

      (global.fetch as any)
        .mockResolvedValueOnce(mockError)
        .mockResolvedValueOnce(mockError);

      await expect(aiManager.generateResponse(testPrompt))
        .rejects
        .toThrow(AIProviderError);
    });
  });

  describe('Health Monitoring', () => {
    it('should check health of all providers', async () => {
      // Mock health check responses
      const mockHealthResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'health-check',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hi' }],
          model: 'claude-3-sonnet-20240229',
          stop_reason: 'end_turn',
          usage: { input_tokens: 2, output_tokens: 1 }
        })
      };

      (global.fetch as any)
        .mockResolvedValueOnce(mockHealthResponse) // Claude health check
        .mockResolvedValueOnce({ // OpenAI health check
          ok: true,
          json: () => Promise.resolve({
            id: 'health-openai',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-4',
            choices: [{
              index: 0,
              message: { role: 'assistant', content: 'Hi' },
              finish_reason: 'stop'
            }],
            usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 }
          })
        });

      const health = await aiManager.getProvidersHealth();

      expect(health).toHaveLength(2);
      expect(health.every(h => h.status === 'healthy')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    const testPrompt: AIPrompt = {
      content: 'Test prompt',
      role: 'user'
    };

    it('should handle rate limit errors with retry', async () => {
      // Mock rate limit error then success
      const rateLimitError = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ error: { message: 'Rate limited' } })
      };

      const successResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'retry-success',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Success after retry' }],
          model: 'claude-3-sonnet-20240229',
          stop_reason: 'end_turn',
          usage: { input_tokens: 5, output_tokens: 3 }
        })
      };

      (global.fetch as any)
        .mockResolvedValueOnce(rateLimitError)
        .mockResolvedValueOnce(successResponse);

      const response = await aiManager.generateResponse(testPrompt);

      expect(response.content).toBe('Success after retry');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry authentication errors', async () => {
      const authError = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } })
      };

      (global.fetch as any).mockResolvedValueOnce(authError);

      await expect(aiManager.generateResponse(testPrompt))
        .rejects
        .toThrow('Authentication failed');

      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry
    });
  });

  describe('Configuration Management', () => {
    it('should update provider configuration', () => {
      aiManager.updateProviderConfig('claude', { priority: 10 });
      
      const provider = aiManager.getProvider('claude');
      expect(provider?.getPriority()).toBe(10);
    });

    it('should reset metrics for all providers', () => {
      aiManager.resetAllMetrics();
      
      const metrics = aiManager.getProvidersMetrics();
      expect(metrics.every(m => m.requestCount === 0)).toBe(true);
    });
  });
});

// Integration test helper
export function createTestAIManager(): AIManager {
  return createAIManager({
    providers: {
      claude: {
        apiKey: process.env.TEST_CLAUDE_API_KEY || 'test-key',
        priority: 9,
        enabled: true
      }
    },
    retrySettings: {
      maxRetries: 1,
      retryDelay: 100,
      backoffMultiplier: 1
    },
    healthCheckInterval: 0
  });
}