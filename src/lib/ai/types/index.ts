import { z } from 'zod';

// Core AI provider types
export enum AIProviderType {
  CLAUDE = 'claude',
  OPENAI = 'openai'
}

export enum AIProviderStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  OFFLINE = 'offline'
}

export enum AIErrorType {
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION = 'authentication',
  INVALID_REQUEST = 'invalid_request',
  PROVIDER_ERROR = 'provider_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

// Zod schemas for runtime validation
export const AIPromptSchema = z.object({
  content: z.string().min(1, 'Prompt content cannot be empty'),
  role: z.enum(['system', 'user', 'assistant']).default('user'),
  context: z.record(z.any()).optional(),
  maxTokens: z.number().min(1).max(10000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  metadata: z.record(z.string()).optional()
});

export const AIResponseSchema = z.object({
  content: z.string(),
  provider: z.nativeEnum(AIProviderType),
  usage: z.object({
    promptTokens: z.number().min(0),
    completionTokens: z.number().min(0),
    totalTokens: z.number().min(0),
    estimatedCost: z.number().min(0).optional()
  }),
  metadata: z.object({
    model: z.string(),
    responseTime: z.number().min(0),
    requestId: z.string().optional(),
    finishReason: z.string().optional()
  }),
  timestamp: z.date().default(() => new Date())
});

export const AIProviderConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().url().optional(),
  maxRetries: z.number().min(0).max(10).default(3),
  timeout: z.number().min(1000).max(60000).default(30000),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).default(60),
    tokensPerMinute: z.number().min(100).optional()
  }).optional(),
  priority: z.number().min(1).max(10).default(5),
  enabled: z.boolean().default(true)
});

export const AIProviderHealthSchema = z.object({
  provider: z.nativeEnum(AIProviderType),
  status: z.nativeEnum(AIProviderStatus),
  responseTime: z.number().min(0).optional(),
  errorRate: z.number().min(0).max(1).optional(),
  lastChecked: z.date(),
  uptime: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional()
});

// TypeScript types derived from Zod schemas
export type AIPrompt = z.infer<typeof AIPromptSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type AIProviderConfig = z.infer<typeof AIProviderConfigSchema>;
export type AIProviderHealth = z.infer<typeof AIProviderHealthSchema>;

// Provider-specific configuration types
export interface ClaudeConfig extends AIProviderConfig {
  model?: 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' | 'claude-3-opus-20240229';
  version?: string;
}

export interface OpenAIConfig extends AIProviderConfig {
  model?: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k';
  organization?: string;
}

// Error handling types
export interface AIError extends Error {
  type: AIErrorType;
  provider: AIProviderType;
  statusCode?: number;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

export class AIProviderError extends Error implements AIError {
  type: AIErrorType;
  provider: AIProviderType;
  statusCode?: number;
  details?: any;
  retryable: boolean;
  timestamp: Date;

  constructor(
    message: string,
    type: AIErrorType,
    provider: AIProviderType,
    options: {
      statusCode?: number;
      details?: any;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = 'AIProviderError';
    this.type = type;
    this.provider = provider;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.retryable = options.retryable ?? this.isRetryableError(type);
    this.timestamp = new Date();
  }

  private isRetryableError(type: AIErrorType): boolean {
    return [
      AIErrorType.RATE_LIMIT,
      AIErrorType.NETWORK_ERROR,
      AIErrorType.TIMEOUT,
      AIErrorType.PROVIDER_ERROR
    ].includes(type);
  }
}

// Cost tracking types
export interface AICostMetrics {
  provider: AIProviderType;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageCostPerRequest: number;
  averageResponseTime: number;
  period: {
    start: Date;
    end: Date;
  };
}

// Provider metrics and monitoring
export interface AIProviderMetrics {
  provider: AIProviderType;
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  totalCost: number;
  uptime: number;
  lastRequest: Date;
  errorsByType: Record<AIErrorType, number>;
}