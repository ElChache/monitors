import { BaseAIProvider } from './base.js';
import type { 
  AIPrompt, 
  AIResponse, 
  AIProviderType, 
  AIProviderHealth,
  ClaudeConfig,
  AIProviderStatus
} from '../types/index.js';
import { AIProviderError, AIErrorType } from '../types/index.js';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  temperature?: number;
  system?: string;
}

interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeError {
  type: string;
  message: string;
}

/**
 * Claude AI Provider implementation
 * Integrates with Anthropic's Claude API
 */
export class ClaudeProvider extends BaseAIProvider {
  private readonly baseUrl = 'https://api.anthropic.com/v1';
  private readonly defaultModel = 'claude-3-sonnet-20240229';
  private readonly apiVersion = '2023-06-01';

  constructor(config: ClaudeConfig) {
    super(config);
  }

  get providerType(): AIProviderType {
    return 'claude' as AIProviderType;
  }

  async generateResponse(prompt: AIPrompt): Promise<AIResponse> {
    this.validateRequest(prompt);
    await this.applyRateLimit();

    const startTime = Date.now();

    try {
      const claudeRequest = this.buildClaudeRequest(prompt);
      const response = await this.makeClaudeRequest(claudeRequest);
      const responseTime = Date.now() - startTime;

      const aiResponse = this.parseClaudeResponse(response, responseTime);
      
      // Update success metrics
      this.updateSuccessMetrics(
        responseTime,
        aiResponse.usage.totalTokens,
        aiResponse.usage.estimatedCost || 0
      );

      return aiResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const aiError = this.handleClaudeError(error, responseTime);
      
      // Update error metrics
      this.updateErrorMetrics(aiError.type);
      
      throw aiError;
    }
  }

  async checkHealth(): Promise<AIProviderHealth> {
    const startTime = Date.now();
    
    try {
      // Simple health check with minimal token usage
      const healthPrompt: AIPrompt = {
        content: 'Hi',
        role: 'user',
        maxTokens: 5
      };

      await this.generateResponse(healthPrompt);
      
      const responseTime = Date.now() - startTime;
      this.lastHealthCheck = new Date();

      return {
        provider: this.providerType,
        status: this.determineHealthStatus(),
        responseTime,
        errorRate: this.calculateErrorRate(),
        lastChecked: this.lastHealthCheck,
        uptime: this.metrics.uptime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.lastHealthCheck = new Date();

      return {
        provider: this.providerType,
        status: 'critical' as AIProviderStatus,
        responseTime,
        errorRate: this.calculateErrorRate(),
        lastChecked: this.lastHealthCheck,
        uptime: this.metrics.uptime,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private buildClaudeRequest(prompt: AIPrompt): ClaudeRequest {
    const config = this.config as ClaudeConfig;
    
    const request: ClaudeRequest = {
      model: config.model || this.defaultModel,
      max_tokens: prompt.maxTokens || 1000,
      messages: [
        {
          role: 'user',
          content: prompt.content
        }
      ]
    };

    if (prompt.temperature !== undefined) {
      request.temperature = prompt.temperature;
    }

    // Add system message if provided in context
    if (prompt.context?.system) {
      request.system = prompt.context.system;
    }

    return request;
  }

  private async makeClaudeRequest(request: ClaudeRequest): Promise<ClaudeResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': this.apiVersion,
        'User-Agent': 'monitors-ai-system/1.0'
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      };
    }

    return await response.json();
  }

  private parseClaudeResponse(response: ClaudeResponse, responseTime: number): AIResponse {
    const content = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');

    const promptTokens = response.usage.input_tokens;
    const completionTokens = response.usage.output_tokens;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = this.calculateCost(promptTokens, completionTokens);

    return {
      content,
      provider: this.providerType,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost
      },
      metadata: {
        model: response.model,
        responseTime,
        requestId: response.id,
        finishReason: response.stop_reason
      },
      timestamp: new Date()
    };
  }

  private handleClaudeError(error: any, responseTime: number): AIProviderError {
    let errorType = AIErrorType.UNKNOWN;
    let message = 'Unknown error occurred';
    let retryable = false;
    let statusCode: number | undefined;

    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      errorType = AIErrorType.TIMEOUT;
      message = 'Request timed out';
      retryable = true;
    } else if (error?.status) {
      statusCode = error.status;
      
      switch (error.status) {
        case 400:
          errorType = AIErrorType.INVALID_REQUEST;
          message = `Invalid request: ${error.data?.error?.message || 'Bad request'}`;
          retryable = false;
          break;
        case 401:
          errorType = AIErrorType.AUTHENTICATION;
          message = 'Authentication failed - check API key';
          retryable = false;
          break;
        case 429:
          errorType = AIErrorType.RATE_LIMIT;
          message = 'Rate limit exceeded';
          retryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = AIErrorType.PROVIDER_ERROR;
          message = `Claude API error: ${error.statusText}`;
          retryable = true;
          break;
        default:
          errorType = AIErrorType.PROVIDER_ERROR;
          message = `HTTP ${error.status}: ${error.statusText}`;
          retryable = error.status >= 500;
      }
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      errorType = AIErrorType.NETWORK_ERROR;
      message = 'Network error - check internet connection';
      retryable = true;
    }

    return new AIProviderError(
      message,
      errorType,
      this.providerType,
      {
        statusCode,
        details: {
          responseTime,
          originalError: error
        },
        retryable,
        cause: error
      }
    );
  }

  private determineHealthStatus(): AIProviderStatus {
    if (this.metrics.requestCount === 0) {
      return 'healthy' as AIProviderStatus;
    }

    const errorRate = this.calculateErrorRate();
    const avgResponseTime = this.metrics.averageResponseTime;

    if (errorRate > 0.5 || avgResponseTime > 10000) {
      return 'critical' as AIProviderStatus;
    } else if (errorRate > 0.2 || avgResponseTime > 5000) {
      return 'warning' as AIProviderStatus;
    }

    return 'healthy' as AIProviderStatus;
  }

  private calculateErrorRate(): number {
    if (this.metrics.requestCount === 0) {
      return 0;
    }
    return this.metrics.errorCount / this.metrics.requestCount;
  }

  protected calculateCost(promptTokens: number, completionTokens: number): number {
    // Claude pricing as of 2024 (approximate)
    // Input: $3 per million tokens, Output: $15 per million tokens for Sonnet
    const inputCostPerToken = 0.000003;
    const outputCostPerToken = 0.000015;
    
    return (promptTokens * inputCostPerToken) + (completionTokens * outputCostPerToken);
  }
}