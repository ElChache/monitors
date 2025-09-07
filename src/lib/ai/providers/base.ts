import type { 
  AIPrompt, 
  AIResponse, 
  AIProviderType, 
  AIProviderHealth, 
  AIProviderConfig,
  AIProviderMetrics 
} from '../types/index.js';

/**
 * Abstract base class for all AI providers
 * Defines the standard interface that all providers must implement
 */
export abstract class BaseAIProvider {
  protected config: AIProviderConfig;
  protected metrics: AIProviderMetrics;
  protected lastHealthCheck: Date | null = null;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Get the provider type
   */
  abstract get providerType(): AIProviderType;

  /**
   * Send a prompt to the AI provider and get a response
   * @param prompt - The prompt to send
   * @returns Promise resolving to AI response
   */
  abstract generateResponse(prompt: AIPrompt): Promise<AIResponse>;

  /**
   * Check the health status of the provider
   * @returns Promise resolving to health status
   */
  abstract checkHealth(): Promise<AIProviderHealth>;

  /**
   * Get current provider configuration
   */
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Update provider configuration
   * @param updates - Configuration updates
   */
  updateConfig(updates: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current provider metrics
   */
  getMetrics(): AIProviderMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset provider metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Check if the provider is enabled and healthy
   */
  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const health = await this.checkHealth();
      return health.status === 'healthy' || health.status === 'warning';
    } catch {
      return false;
    }
  }

  /**
   * Get the provider's priority for selection
   */
  getPriority(): number {
    return this.config.priority;
  }

  /**
   * Update metrics after a successful request
   */
  protected updateSuccessMetrics(responseTime: number, tokens: number, cost: number): void {
    this.metrics.requestCount++;
    this.metrics.successCount++;
    this.metrics.totalTokensUsed += tokens;
    this.metrics.totalCost += cost;
    this.metrics.lastRequest = new Date();
    
    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.successCount - 1) + responseTime;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.successCount;
    
    // Update uptime calculation
    this.updateUptime(true);
  }

  /**
   * Update metrics after a failed request
   */
  protected updateErrorMetrics(errorType: string): void {
    this.metrics.requestCount++;
    this.metrics.errorCount++;
    this.metrics.lastRequest = new Date();
    
    if (this.metrics.errorsByType[errorType as keyof typeof this.metrics.errorsByType] !== undefined) {
      this.metrics.errorsByType[errorType as keyof typeof this.metrics.errorsByType]++;
    }
    
    // Update uptime calculation
    this.updateUptime(false);
  }

  /**
   * Initialize provider metrics
   */
  private initializeMetrics(): AIProviderMetrics {
    return {
      provider: this.providerType,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      uptime: 1.0,
      lastRequest: new Date(),
      errorsByType: {
        rate_limit: 0,
        quota_exceeded: 0,
        network_error: 0,
        authentication: 0,
        invalid_request: 0,
        provider_error: 0,
        timeout: 0,
        unknown: 0
      }
    };
  }

  /**
   * Update uptime calculation based on request success/failure
   */
  private updateUptime(success: boolean): void {
    const successRate = this.metrics.requestCount > 0 
      ? this.metrics.successCount / this.metrics.requestCount 
      : 1.0;
    
    this.metrics.uptime = Math.max(0, Math.min(1, successRate));
  }

  /**
   * Validate request before sending to provider
   */
  protected validateRequest(prompt: AIPrompt): void {
    if (!this.config.enabled) {
      throw new Error(`Provider ${this.providerType} is disabled`);
    }

    if (!prompt.content || prompt.content.trim().length === 0) {
      throw new Error('Prompt content cannot be empty');
    }

    if (prompt.maxTokens && prompt.maxTokens > 10000) {
      throw new Error('Max tokens cannot exceed 10000');
    }
  }

  /**
   * Apply rate limiting if configured
   */
  protected async applyRateLimit(): Promise<void> {
    // Implementation depends on specific rate limiting strategy
    // This is a placeholder for rate limiting logic
    if (this.config.rateLimit) {
      // Basic rate limiting could be implemented here
      // For now, we'll just add a small delay to prevent spam
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Calculate estimated cost based on token usage
   * Override in specific providers for accurate pricing
   */
  protected calculateCost(promptTokens: number, completionTokens: number): number {
    // Default cost calculation - should be overridden by specific providers
    const totalTokens = promptTokens + completionTokens;
    return totalTokens * 0.00001; // $0.00001 per token as default
  }
}