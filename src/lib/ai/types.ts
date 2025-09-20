/**
 * AI Integration Types for MonitorHub
 * Based on system architecture specification
 */

export interface ExtractedFacts {
  facts: Array<{
    name: string;
    prompt: string;
    dataSourceType?: string;
  }>;
  confidence: number;
  reasoning: string;
}

export interface MonitorType {
  type: 'current_state' | 'historical_change';
  confidence: number;
  reasoning: string;
}

export interface EvaluationResult {
  result: boolean;
  confidence: number;
  reasoning: string;
  factValues: Record<string, any>;
}

export interface ChangeResult {
  hasChanged: boolean;
  significance: number;
  confidence: number;
  reasoning: string;
  changeDetails: Record<string, any>;
}

export interface AIUsageMetrics {
  provider: string;
  tokensUsed: number;
  cost: number;
  responseTime: number;
  timestamp: Date;
}

export interface AIProvider {
  extractFacts(prompt: string): Promise<ExtractedFacts>;
  classifyMonitorType(prompt: string): Promise<MonitorType>;
  evaluateState(facts: Record<string, any>, logic: string): Promise<EvaluationResult>;
  evaluateChange(
    currentValues: Record<string, any>, 
    previousValues: Record<string, any>, 
    changeCondition: string
  ): Promise<ChangeResult>;
  optimizeFrequency(monitorType: string, facts: string[]): Promise<number>;
}

export type AIProviderType = 'claude' | 'openai';

export interface AIConfig {
  primaryProvider: AIProviderType;
  fallbackProvider: AIProviderType;
  costLimits: {
    dailyLimit: number;
    monthlyLimit: number;
    alertThresholds: number[];
  };
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
}