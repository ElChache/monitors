import { BaseAIProvider } from './base.js';
import type { 
  AIPrompt, 
  AIResponse, 
  AIProviderType, 
  AIProviderHealth,
  OpenAIConfig,
  AIProviderStatus
} from '../types/index.js';
import { AIProviderError, AIErrorType } from '../types/index.js';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

/**
 * OpenAI Provider implementation
 * Integrates with OpenAI's GPT API as fallback provider
 */
export class OpenAIProvider extends BaseAIProvider {
  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly defaultModel = 'gpt-4';

  constructor(config: OpenAIConfig) {
    super(config);
  }

  get providerType(): AIProviderType {
    return 'openai' as AIProviderType;
  }

  async generateResponse(prompt: AIPrompt): Promise<AIResponse> {
    this.validateRequest(prompt);
    await this.applyRateLimit();

    const startTime = Date.now();

    try {
      const openaiRequest = this.buildOpenAIRequest(prompt);
      const response = await this.makeOpenAIRequest(openaiRequest);
      const responseTime = Date.now() - startTime;

      const aiResponse = this.parseOpenAIResponse(response, responseTime);
      
      // Update success metrics
      this.updateSuccessMetrics(
        responseTime,
        aiResponse.usage.totalTokens,
        aiResponse.usage.estimatedCost || 0
      );

      return aiResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const aiError = this.handleOpenAIError(error, responseTime);
      
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

  private buildOpenAIRequest(prompt: AIPrompt): OpenAIRequest {
    const config = this.config as OpenAIConfig;
    
    const messages: OpenAIMessage[] = [];

    // Add system message if provided in context
    if (prompt.context?.system) {
      messages.push({
        role: 'system',
        content: prompt.context.system
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: prompt.content
    });

    const request: OpenAIRequest = {
      model: config.model || this.defaultModel,
      messages
    };

    if (prompt.maxTokens) {
      request.max_tokens = prompt.maxTokens;
    }

    if (prompt.temperature !== undefined) {
      request.temperature = prompt.temperature;
    }

    return request;
  }

  private async makeOpenAIRequest(request: OpenAIRequest): Promise<OpenAIResponse> {
    const config = this.config as OpenAIConfig;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'User-Agent': 'monitors-ai-system/1.0'
    };

    // Add organization header if configured
    if (config.organization) {
      headers['OpenAI-Organization'] = config.organization;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
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

  private parseOpenAIResponse(response: OpenAIResponse, responseTime: number): AIResponse {
    const content = response.choices[0]?.message?.content || '';
    
    const promptTokens = response.usage.prompt_tokens;
    const completionTokens = response.usage.completion_tokens;
    const totalTokens = response.usage.total_tokens;
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
        finishReason: response.choices[0]?.finish_reason
      },
      timestamp: new Date()
    };
  }

  private handleOpenAIError(error: any, responseTime: number): AIProviderError {
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
      const errorData = error.data as OpenAIError;
      
      switch (error.status) {
        case 400:
          errorType = AIErrorType.INVALID_REQUEST;
          message = `Invalid request: ${errorData?.error?.message || 'Bad request'}`;
          retryable = false;
          break;
        case 401:
          errorType = AIErrorType.AUTHENTICATION;
          message = 'Authentication failed - check API key';
          retryable = false;
          break;
        case 403:
          if (errorData?.error?.code === 'insufficient_quota') {
            errorType = AIErrorType.QUOTA_EXCEEDED;
            message = 'Quota exceeded - check billing';
            retryable = false;
          } else {
            errorType = AIErrorType.AUTHENTICATION;
            message = 'Access denied';
            retryable = false;
          }
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
          message = `OpenAI API error: ${error.statusText}`;
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

    if (errorRate > 0.5 || avgResponseTime > 15000) {
      return 'critical' as AIProviderStatus;
    } else if (errorRate > 0.2 || avgResponseTime > 8000) {
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
    const config = this.config as OpenAIConfig;
    const model = config.model || this.defaultModel;

    // OpenAI pricing as of 2024 (approximate)
    let inputCostPerToken = 0.000003;  // Default for GPT-4
    let outputCostPerToken = 0.000006;

    switch (model) {
      case 'gpt-4':
        inputCostPerToken = 0.00003;
        outputCostPerToken = 0.00006;
        break;
      case 'gpt-4-turbo':
        inputCostPerToken = 0.00001;
        outputCostPerToken = 0.00003;
        break;
      case 'gpt-3.5-turbo':
        inputCostPerToken = 0.0000005;
        outputCostPerToken = 0.0000015;
        break;
      case 'gpt-3.5-turbo-16k':
        inputCostPerToken = 0.000003;
        outputCostPerToken = 0.000004;
        break;
    }
    
    return (promptTokens * inputCostPerToken) + (completionTokens * outputCostPerToken);
  }
}