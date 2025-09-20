/**
 * AI Service - Main interface for AI operations with provider switching and cost tracking
 * Based on MonitorHub system architecture specification
 */

import { ClaudeProvider } from './providers/claude.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import type { 
  AIProvider, 
  AIProviderType, 
  AIConfig, 
  ExtractedFacts, 
  MonitorType, 
  EvaluationResult, 
  ChangeResult,
  AIUsageMetrics 
} from './types.js';

export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private currentProvider: AIProviderType;
  private config: AIConfig;
  private usageMetrics: AIUsageMetrics[] = [];
  private cache: Map<string, { result: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config?: Partial<AIConfig>) {
    this.config = {
      primaryProvider: 'claude',
      fallbackProvider: 'openai',
      costLimits: {
        dailyLimit: 50, // $50 daily limit
        monthlyLimit: 1000, // $1000 monthly limit
        alertThresholds: [0.75, 0.9] // Alert at 75% and 90%
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000 // 1 second
      },
      ...config
    };

    this.currentProvider = this.config.primaryProvider;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    try {
      this.providers.set('claude', new ClaudeProvider());
    } catch (error) {
      console.warn('Claude provider initialization failed:', error);
    }

    try {
      this.providers.set('openai', new OpenAIProvider());
    } catch (error) {
      console.warn('OpenAI provider initialization failed:', error);
    }

    if (this.providers.size === 0) {
      throw new Error('No AI providers could be initialized. Check API keys.');
    }
  }

  private getProvider(): AIProvider {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} is not available`);
    }
    return provider;
  }

  private getCacheKey(operationName: string, ...args: unknown[]): string {
    return `${operationName}:${JSON.stringify(args)}`;
  }

  private isValidCacheEntry(entry: { result: unknown; timestamp: number }): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  private async executeWithFallback<T>(
    operation: (provider: AIProvider) => Promise<T>,
    operationName: string,
    cacheKey?: string
  ): Promise<T> {
    // Check cache first for non-critical operations
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (this.isValidCacheEntry(cached)) {
        return cached.result as T;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Try primary provider
    try {
      const result = await this.executeWithRetry(operation, this.getProvider());
      this.recordUsage(this.currentProvider, Date.now() - startTime);
      
      // Cache successful results for appropriate operations
      if (cacheKey && (operationName === 'extractFacts' || operationName === 'classifyMonitorType')) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        // Clean up old cache entries periodically
        if (this.cache.size > 100) {
          this.cleanupCache();
        }
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`${operationName} failed with ${this.currentProvider}:`, error);
    }

    // Try fallback provider if available
    if (this.config.fallbackProvider !== this.currentProvider) {
      const fallbackProvider = this.providers.get(this.config.fallbackProvider);
      if (fallbackProvider) {
        try {
          console.log(`Switching to fallback provider: ${this.config.fallbackProvider}`);
          const result = await this.executeWithRetry(operation, fallbackProvider);
          this.recordUsage(this.config.fallbackProvider, Date.now() - startTime);
          return result;
        } catch (fallbackError) {
          console.error(`Fallback provider ${this.config.fallbackProvider} also failed:`, fallbackError);
          lastError = fallbackError as Error;
        }
      }
    }

    this.recordUsage(this.currentProvider, Date.now() - startTime);
    throw new Error(`${operationName} failed with all available providers. Last error: ${lastError?.message}`);
  }

  private async executeWithRetry<T>(
    operation: (provider: AIProvider) => Promise<T>,
    provider: AIProvider
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        return await operation(provider);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retryConfig.maxRetries) {
          console.warn(`Attempt ${attempt + 1} failed, retrying in ${this.config.retryConfig.retryDelay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, this.config.retryConfig.retryDelay));
        }
      }
    }

    throw lastError || new Error('Unknown error during retry execution');
  }

  private recordUsage(provider: AIProviderType, responseTime: number, actualTokens?: number): void {
    const estimatedCost = this.estimateCost(provider, responseTime, actualTokens);
    
    const metric: AIUsageMetrics = {
      provider,
      tokensUsed: actualTokens || Math.floor(responseTime / 10), // Use actual tokens if available
      cost: estimatedCost,
      responseTime,
      timestamp: new Date()
    };

    this.usageMetrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.usageMetrics.length > 1000) {
      this.usageMetrics = this.usageMetrics.slice(-1000);
    }

    // Record metrics in monitoring service for admin dashboard
    try {
      const { MonitoringService } = await import('$lib/services/monitoring.service');
      
      // Record AI processing performance
      MonitoringService.recordAIMetric(
        responseTime,
        provider,
        'ai_processing',
        { tokensUsed: metric.tokensUsed }
      );

      // Track cost data
      MonitoringService.trackCost({
        provider,
        operation: 'ai_processing',
        tokensUsed: metric.tokensUsed,
        cost: estimatedCost
      });
    } catch (error) {
      // Don't fail if monitoring service is not available
      console.warn('Failed to record AI metrics in monitoring service:', error);
    }

    // Check cost limits only periodically to improve performance
    if (this.usageMetrics.length % 10 === 0) {
      this.checkCostLimits();
    }
  }

  private estimateCost(provider: AIProviderType, responseTime: number, actualTokens?: number): number {
    if (actualTokens) {
      // More accurate cost calculation based on actual token usage
      const costPerToken = provider === 'claude' ? 0.000003 : 0.000002; // approximate rates
      return actualTokens * costPerToken;
    }
    
    // Fallback estimation based on response time
    const baseRate = provider === 'claude' ? 0.01 : 0.008; // per request estimate
    return baseRate + (responseTime / 1000) * 0.001;
  }

  private checkCostLimits(): void {
    const now = new Date();
    const dailyCost = this.getDailyCost(now);
    const monthlyCost = this.getMonthlyCost(now);

    for (const threshold of this.config.costLimits.alertThresholds) {
      if (dailyCost >= this.config.costLimits.dailyLimit * threshold) {
        console.warn(`Daily cost alert: $${dailyCost.toFixed(2)} (${(threshold * 100)}% of limit)`);
      }
      if (monthlyCost >= this.config.costLimits.monthlyLimit * threshold) {
        console.warn(`Monthly cost alert: $${monthlyCost.toFixed(2)} (${(threshold * 100)}% of limit)`);
      }
    }
  }

  private getDailyCost(date: Date): number {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    return this.usageMetrics
      .filter(metric => metric.timestamp >= startOfDay)
      .reduce((total, metric) => total + metric.cost, 0);
  }

  private getMonthlyCost(date: Date): number {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    
    return this.usageMetrics
      .filter(metric => metric.timestamp >= startOfMonth)
      .reduce((total, metric) => total + metric.cost, 0);
  }

  private cleanupCache(): void {
    const entriesToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (!this.isValidCacheEntry(entry)) {
        entriesToDelete.push(key);
      }
    });
    entriesToDelete.forEach(key => this.cache.delete(key));
  }

  // Public API methods
  async extractFacts(prompt: string): Promise<ExtractedFacts> {
    const cacheKey = this.getCacheKey('extractFacts', prompt);
    return this.executeWithFallback(
      (provider) => provider.extractFacts(prompt),
      'extractFacts',
      cacheKey
    );
  }

  async classifyMonitorType(prompt: string): Promise<MonitorType> {
    const cacheKey = this.getCacheKey('classifyMonitorType', prompt);
    return this.executeWithFallback(
      (provider) => provider.classifyMonitorType(prompt),
      'classifyMonitorType',
      cacheKey
    );
  }

  async evaluateState(facts: Record<string, string | number | boolean>, logic: string): Promise<EvaluationResult> {
    return this.executeWithFallback(
      (provider) => provider.evaluateState(facts, logic),
      'evaluateState'
    );
  }

  async evaluateChange(
    currentValues: Record<string, string | number | boolean>, 
    previousValues: Record<string, string | number | boolean>, 
    changeCondition: string
  ): Promise<ChangeResult> {
    return this.executeWithFallback(
      (provider) => provider.evaluateChange(currentValues, previousValues, changeCondition),
      'evaluateChange'
    );
  }

  async optimizeFrequency(monitorType: string, facts: string[]): Promise<number> {
    return this.executeWithFallback(
      (provider) => provider.optimizeFrequency(monitorType, facts),
      'optimizeFrequency'
    );
  }

  // Management methods
  switchProvider(providerType: AIProviderType): void {
    if (!this.providers.has(providerType)) {
      throw new Error(`Provider ${providerType} is not available`);
    }
    this.currentProvider = providerType;
    console.log(`Switched to AI provider: ${providerType}`);
  }

  getCurrentProvider(): AIProviderType {
    return this.currentProvider;
  }

  getUsageMetrics(): AIUsageMetrics[] {
    return [...this.usageMetrics];
  }

  async testConnection(providerName: AIProviderType): Promise<boolean> {
    try {
      const provider = this.providers.get(providerName);
      if (!provider) {
        return false;
      }

      // Test with a simple prompt
      await provider.extractFacts('Test connection');
      
      return true;
    } catch (error) {
      console.warn(`Connection test failed for ${providerName}:`, error);
      return false;
    }
  }

  getCostSummary(): { dailyCost: number; monthlyCost: number; limits: AIConfig['costLimits']; totalRequests: number } {
    const now = new Date();
    return {
      dailyCost: this.getDailyCost(now),
      monthlyCost: this.getMonthlyCost(now),
      limits: this.config.costLimits,
      totalRequests: this.usageMetrics.length
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('AI service cache cleared');
  }

  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size,
      // Note: Would need to track cache hits/misses for hit rate calculation
    };
  }
}

// Singleton instance for application-wide use
export const aiService = new AIService();