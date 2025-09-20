/**
 * AI Integration Module - MonitorHub
 * Exports all AI-related functionality for Combination Intelligence
 */

export { AIService, aiService } from './ai.service.js';
export { ClaudeProvider } from './providers/claude.provider.js';
export { OpenAIProvider } from './providers/openai.provider.js';
export type {
  AIProvider,
  AIProviderType,
  AIConfig,
  ExtractedFacts,
  MonitorType,
  EvaluationResult,
  ChangeResult,
  AIUsageMetrics
} from './types.js';