/**
 * Monitors AI System
 * 
 * This module provides a complete AI provider abstraction system with:
 * - Support for Claude (Anthropic) and OpenAI providers
 * - Automatic failover and error handling
 * - Cost tracking and optimization
 * - Health monitoring and metrics
 * - Provider-agnostic interface
 */

// Core types and interfaces
export type {
  AIPrompt,
  AIResponse,
  AIProviderType,
  AIProviderHealth,
  AIProviderConfig,
  AIProviderMetrics,
  AICostMetrics,
  ClaudeConfig,
  OpenAIConfig,
  AIError
} from './types/index.js';

export {
  AIProviderStatus,
  AIErrorType,
  AIProviderError,
  AIPromptSchema,
  AIResponseSchema,
  AIProviderConfigSchema,
  AIProviderHealthSchema
} from './types/index.js';

// Provider implementations
export { BaseAIProvider } from './providers/base.js';
export { ClaudeProvider } from './providers/claude.js';
export { OpenAIProvider } from './providers/openai.js';

// Main AI Manager
export {
  AIManager,
  createAIManager,
  getGlobalAIManager,
  initializeAIManager
} from './manager.js';

// AI Services
export {
  PromptClassificationService,
  classifyPrompt,
  isValidMonitorPrompt,
  MonitorType,
  EntityType,
  ConditionType,
  MonitoringFrequency,
  type ExtractedEntity,
  type ExtractedCondition,
  type FrequencyRecommendation,
  type PromptClassificationResult
} from './services/promptClassification.js';

// Convenience functions for common use cases

/**
 * Simple function to generate AI response with default configuration
 * Uses the global AI manager instance
 */
export async function generateAIResponse(
  content: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    preferredProvider?: AIProviderType;
    context?: Record<string, any>;
  } = {}
): Promise<AIResponse> {
  const prompt: AIPrompt = {
    content,
    role: 'user',
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    context: {
      system: options.systemPrompt,
      ...options.context
    }
  };

  const manager = getGlobalAIManager();
  return await manager.generateResponse(prompt, options.preferredProvider);
}

/**
 * Check if AI system is healthy and ready
 */
export async function isAISystemHealthy(): Promise<boolean> {
  try {
    const manager = getGlobalAIManager();
    const healthChecks = await manager.getProvidersHealth();
    
    return healthChecks.some(health => 
      health.status === 'healthy' || health.status === 'warning'
    );
  } catch {
    return false;
  }
}

/**
 * Get current AI system metrics
 */
export async function getAISystemStatus(): Promise<{
  healthy: boolean;
  providers: AIProviderHealth[];
  metrics: AIProviderMetrics[];
  costs: AICostMetrics[];
}> {
  const manager = getGlobalAIManager();
  
  const [providers, metrics] = await Promise.all([
    manager.getProvidersHealth(),
    Promise.resolve(manager.getProvidersMetrics())
  ]);
  
  const costs = manager.getCostMetrics();
  const healthy = providers.some(p => p.status === 'healthy' || p.status === 'warning');

  return {
    healthy,
    providers,
    metrics,
    costs
  };
}

/**
 * Utility function to validate AI prompt before sending
 */
export function validateAIPrompt(prompt: Partial<AIPrompt>): AIPrompt {
  return AIPromptSchema.parse(prompt);
}

/**
 * Create a system prompt for monitor-related AI tasks
 */
export function createMonitorSystemPrompt(context: {
  task: 'classify' | 'extract' | 'analyze' | 'generate';
  domain?: string;
  instructions?: string;
}): string {
  const basePrompt = `You are an AI assistant specialized in helping users create and manage real-world monitors.

Your role is to help users track real-world conditions and changes through natural language descriptions.`;

  const taskPrompts = {
    classify: `
Task: Classify the user's request to determine if they want to monitor a current state or detect changes over time.

Guidelines:
- STATE monitors track current values (e.g., "What is Tesla's current stock price?")
- CHANGE monitors detect when something changes (e.g., "Tell me when Tesla stock goes above $200")
- Always provide reasoning for your classification
- Extract key parameters like thresholds, entities, and conditions`,

    extract: `
Task: Extract relevant facts and data from web content for monitor evaluation.

Guidelines:
- Focus on numerical values, dates, status indicators, and key metrics
- Provide confidence scores for extracted data
- Note the source and freshness of information
- Handle various data formats (tables, text, structured data)`,

    analyze: `
Task: Analyze monitor data to determine if trigger conditions have been met.

Guidelines:
- Compare current values with historical data and thresholds
- Identify significant changes or trends
- Provide clear reasoning for trigger decisions
- Consider data quality and confidence levels`,

    generate: `
Task: Generate natural language content for monitor notifications and explanations.

Guidelines:
- Create clear, concise, and actionable notifications
- Explain what changed and why it matters
- Use appropriate urgency levels
- Personalize based on user context and preferences`
  };

  let prompt = basePrompt + (taskPrompts[context.task] || '');

  if (context.domain) {
    prompt += `\n\nDomain: ${context.domain}`;
  }

  if (context.instructions) {
    prompt += `\n\nSpecific Instructions: ${context.instructions}`;
  }

  return prompt;
}