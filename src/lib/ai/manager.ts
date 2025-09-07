import { BaseAIProvider } from './providers/base.js';
import { ClaudeProvider } from './providers/claude.js';
import { OpenAIProvider } from './providers/openai.js';
import type { 
  AIPrompt, 
  AIResponse, 
  AIProviderType,
  AIProviderHealth,
  AIProviderMetrics,
  ClaudeConfig,
  OpenAIConfig,
  AICostMetrics
} from './types/index.js';
import { AIProviderError, AIErrorType } from './types/index.js';

interface AIManagerConfig {
  providers: {
    claude?: ClaudeConfig;
    openai?: OpenAIConfig;
  };
  retrySettings: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  healthCheckInterval: number; // milliseconds
  costTracking: boolean;
}

/**
 * AI Manager - Central coordinator for all AI providers
 * Handles provider selection, failover, health monitoring, and cost tracking
 */
export class AIManager {
  private providers: Map<AIProviderType, BaseAIProvider> = new Map();
  private config: AIManagerConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: Date = new Date();

  constructor(config: AIManagerConfig) {
    this.config = config;
    this.initializeProviders();
    this.startHealthMonitoring();
  }

  /**
   * Generate AI response with automatic provider selection and failover
   * @param prompt - The prompt to send
   * @param preferredProvider - Optional preferred provider
   * @returns Promise resolving to AI response
   */
  async generateResponse(
    prompt: AIPrompt, 
    preferredProvider?: AIProviderType
  ): Promise<AIResponse> {
    const providers = await this.getAvailableProviders(preferredProvider);
    
    if (providers.length === 0) {
      throw new AIProviderError(
        'No available AI providers',
        AIErrorType.PROVIDER_ERROR,
        'claude' as AIProviderType,
        { retryable: false }
      );
    }

    let lastError: AIProviderError | null = null;

    for (const provider of providers) {
      try {
        const response = await this.executeWithRetry(provider, prompt);
        return response;
      } catch (error) {
        lastError = error instanceof AIProviderError ? error : 
          new AIProviderError(
            error instanceof Error ? error.message : 'Unknown error',
            AIErrorType.UNKNOWN,
            provider.providerType,
            { retryable: false, cause: error }
          );

        // If error is not retryable, don't try next provider for certain error types
        if (!lastError.retryable && [
          AIErrorType.AUTHENTICATION,
          AIErrorType.INVALID_REQUEST
        ].includes(lastError.type)) {
          throw lastError;
        }

        console.warn(`Provider ${provider.providerType} failed, trying next provider:`, lastError.message);
      }
    }

    // All providers failed
    throw lastError || new AIProviderError(
      'All AI providers failed',
      AIErrorType.PROVIDER_ERROR,
      'claude' as AIProviderType,
      { retryable: true }
    );
  }

  /**
   * Get health status of all providers
   */
  async getProvidersHealth(): Promise<AIProviderHealth[]> {
    const healthChecks = Array.from(this.providers.values()).map(
      provider => provider.checkHealth()
    );

    try {
      return await Promise.all(healthChecks);
    } catch (error) {
      console.error('Error checking provider health:', error);
      return [];
    }
  }

  /**
   * Get metrics for all providers
   */
  getProvidersMetrics(): AIProviderMetrics[] {
    return Array.from(this.providers.values()).map(
      provider => provider.getMetrics()
    );
  }

  /**
   * Get cost metrics for a specific time period
   */
  getCostMetrics(startDate?: Date, endDate?: Date): AICostMetrics[] {
    const metrics = this.getProvidersMetrics();
    
    return metrics.map(metric => ({
      provider: metric.provider,
      totalRequests: metric.requestCount,
      totalTokens: metric.totalTokensUsed,
      totalCost: metric.totalCost,
      averageCostPerRequest: metric.requestCount > 0 ? metric.totalCost / metric.requestCount : 0,
      averageResponseTime: metric.averageResponseTime,
      period: {
        start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000), // Default to last 24 hours
        end: endDate || new Date()
      }
    }));
  }

  /**
   * Reset metrics for all providers
   */
  resetAllMetrics(): void {
    this.providers.forEach(provider => provider.resetMetrics());
  }

  /**
   * Get available provider by type
   */
  getProvider(type: AIProviderType): BaseAIProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Update configuration for a specific provider
   */
  updateProviderConfig(type: AIProviderType, config: Partial<ClaudeConfig | OpenAIConfig>): void {
    const provider = this.providers.get(type);
    if (provider) {
      provider.updateConfig(config);
    }
  }

  /**
   * Shutdown the AI manager and cleanup resources
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Initialize providers based on configuration
   */
  private initializeProviders(): void {
    if (this.config.providers.claude) {
      this.providers.set('claude', new ClaudeProvider(this.config.providers.claude));
    }

    if (this.config.providers.openai) {
      this.providers.set('openai', new OpenAIProvider(this.config.providers.openai));
    }

    if (this.providers.size === 0) {
      throw new Error('At least one AI provider must be configured');
    }
  }

  /**
   * Get available providers sorted by priority and health
   */
  private async getAvailableProviders(preferredProvider?: AIProviderType): Promise<BaseAIProvider[]> {
    const allProviders = Array.from(this.providers.values());
    
    // Filter out unavailable providers
    const availableProviders = [];
    for (const provider of allProviders) {
      if (await provider.isAvailable()) {
        availableProviders.push(provider);
      }
    }

    // Sort by preferred provider first, then by priority (higher is better)
    return availableProviders.sort((a, b) => {
      // Preferred provider goes first
      if (preferredProvider) {
        if (a.providerType === preferredProvider && b.providerType !== preferredProvider) return -1;
        if (b.providerType === preferredProvider && a.providerType !== preferredProvider) return 1;
      }
      
      // Then sort by priority (higher priority first)
      return b.getPriority() - a.getPriority();
    });
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(provider: BaseAIProvider, prompt: AIPrompt): Promise<AIResponse> {
    let lastError: Error | null = null;
    let delay = this.config.retrySettings.retryDelay;

    for (let attempt = 0; attempt <= this.config.retrySettings.maxRetries; attempt++) {
      try {
        return await provider.generateResponse(prompt);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on final attempt
        if (attempt === this.config.retrySettings.maxRetries) {
          break;
        }

        // Don't retry non-retryable errors
        if (error instanceof AIProviderError && !error.retryable) {
          throw error;
        }

        // Wait before retrying
        await this.sleep(delay);
        delay *= this.config.retrySettings.backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Start health monitoring for all providers
   */
  private startHealthMonitoring(): void {
    if (this.config.healthCheckInterval <= 0) {
      return; // Health monitoring disabled
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getProvidersHealth();
        this.lastHealthCheck = new Date();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create AI Manager with default configuration
 */
export function createAIManager(config: Partial<AIManagerConfig> = {}): AIManager {
  const defaultConfig: AIManagerConfig = {
    providers: {},
    retrySettings: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    },
    healthCheckInterval: 5 * 60 * 1000, // 5 minutes
    costTracking: true
  };

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    providers: { ...defaultConfig.providers, ...config.providers },
    retrySettings: { ...defaultConfig.retrySettings, ...config.retrySettings }
  };

  return new AIManager(mergedConfig);
}

/**
 * Singleton instance for global access
 */
let globalAIManager: AIManager | null = null;

/**
 * Get or create the global AI Manager instance
 */
export function getGlobalAIManager(config?: Partial<AIManagerConfig>): AIManager {
  if (!globalAIManager) {
    if (!config) {
      throw new Error('AI Manager not initialized. Provide configuration on first call.');
    }
    globalAIManager = createAIManager(config);
  }
  return globalAIManager;
}

/**
 * Initialize the global AI Manager with environment-based configuration
 */
export function initializeAIManager(env: Record<string, string | undefined>): AIManager {
  const config: Partial<AIManagerConfig> = {
    providers: {}
  };

  // Configure Claude if API key is available
  if (env.CLAUDE_API_KEY) {
    config.providers!.claude = {
      apiKey: env.CLAUDE_API_KEY,
      maxRetries: 3,
      timeout: 30000,
      priority: 9, // Higher priority (preferred)
      enabled: true
    };
  }

  // Configure OpenAI if API key is available
  if (env.OPENAI_API_KEY) {
    config.providers!.openai = {
      apiKey: env.OPENAI_API_KEY,
      organization: env.OPENAI_ORGANIZATION,
      maxRetries: 3,
      timeout: 30000,
      priority: 7, // Lower priority (fallback)
      enabled: true
    };
  }

  if (Object.keys(config.providers!).length === 0) {
    throw new Error('No AI provider API keys found in environment variables');
  }

  globalAIManager = createAIManager(config);
  return globalAIManager;
}