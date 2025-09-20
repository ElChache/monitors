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

  private initializeProviders() {
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

  private async executeWithFallback<T>(
    operation: (provider: AIProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Try primary provider
    try {
      const result = await this.executeWithRetry(operation, this.getProvider());
      this.recordUsage(this.currentProvider, Date.now() - startTime, true);
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
          this.recordUsage(this.config.fallbackProvider, Date.now() - startTime, true);
          return result;
        } catch (fallbackError) {
          console.error(`Fallback provider ${this.config.fallbackProvider} also failed:`, fallbackError);
          lastError = fallbackError as Error;
        }
      }
    }

    this.recordUsage(this.currentProvider, Date.now() - startTime, false);
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

  private recordUsage(provider: AIProviderType, responseTime: number, _success: boolean) {
    // Simplified cost calculation - in production, this would be more sophisticated
    const estimatedCost = this.estimateCost(provider, responseTime);
    
    const metric: AIUsageMetrics = {
      provider,
      tokensUsed: Math.floor(responseTime / 10), // Rough estimate
      cost: estimatedCost,
      responseTime,
      timestamp: new Date()
    };

    this.usageMetrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.usageMetrics.length > 1000) {
      this.usageMetrics = this.usageMetrics.slice(-1000);
    }

    // Check cost limits
    this.checkCostLimits();
  }

  private estimateCost(provider: AIProviderType, responseTime: number): number {
    // Simplified cost estimation - replace with actual token counting
    const baseRate = provider === 'claude' ? 0.01 : 0.008; // per request estimate
    return baseRate + (responseTime / 1000) * 0.001;
  }

  private checkCostLimits() {
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

  // Public API methods
  async extractFacts(prompt: string): Promise<ExtractedFacts> {
    return this.executeWithFallback(
      (provider) => provider.extractFacts(prompt),
      'extractFacts'
    );
  }

  async classifyMonitorType(prompt: string): Promise<MonitorType> {
    return this.executeWithFallback(
      (provider) => provider.classifyMonitorType(prompt),
      'classifyMonitorType'
    );
  }

  async evaluateState(facts: Record<string, any>, logic: string): Promise<EvaluationResult> {
    return this.executeWithFallback(
      (provider) => provider.evaluateState(facts, logic),
      'evaluateState'
    );
  }

  async evaluateChange(
    currentValues: Record<string, any>, 
    previousValues: Record<string, any>, 
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

  getCostSummary() {
    const now = new Date();
    return {
      dailyCost: this.getDailyCost(now),
      monthlyCost: this.getMonthlyCost(now),
      limits: this.config.costLimits,
      totalRequests: this.usageMetrics.length
    };
  }
}

// Singleton instance for application-wide use
export const aiService = new AIService();