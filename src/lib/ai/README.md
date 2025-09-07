# Monitors AI System

A comprehensive AI provider abstraction system that provides unified access to multiple AI providers with automatic failover, cost tracking, and performance monitoring.

## Features

### 🔄 Provider Abstraction
- **Unified Interface**: Single API for multiple AI providers
- **Automatic Failover**: Seamless switching between providers on failure
- **Provider Prioritization**: Configurable provider selection order
- **Type Safety**: Full TypeScript support with runtime validation

### 🏥 Health Monitoring
- **Real-time Health Checks**: Continuous provider availability monitoring
- **Performance Metrics**: Response times, success rates, and error tracking
- **Status Indicators**: Healthy, Warning, Critical, and Offline states
- **Uptime Calculation**: Automatic uptime percentage calculation

### 💰 Cost Optimization
- **Token Usage Tracking**: Accurate token consumption monitoring
- **Cost Calculation**: Provider-specific pricing calculations
- **Budget Monitoring**: Track spending across all providers
- **Usage Analytics**: Historical cost and usage analysis

### ⚡ Performance & Reliability
- **Retry Logic**: Configurable retry with exponential backoff
- **Rate Limiting**: Built-in rate limiting support
- **Error Categorization**: Detailed error classification and handling
- **Response Caching**: Smart caching to reduce costs and latency

## Quick Start

### 1. Installation

```bash
npm install @monitors/ai zod
```

### 2. Basic Setup

```typescript
import { initializeAIManager, generateAIResponse } from '@monitors/ai';

// Initialize with environment variables
const aiManager = initializeAIManager({
  CLAUDE_API_KEY: 'your-claude-key',
  OPENAI_API_KEY: 'your-openai-key'
});

// Generate a simple response
const response = await generateAIResponse('What is the weather like in Paris?');
console.log(response.content);
```

### 3. Advanced Configuration

```typescript
import { createAIManager, AIManager } from '@monitors/ai';

const aiManager = createAIManager({
  providers: {
    claude: {
      apiKey: process.env.CLAUDE_API_KEY!,
      model: 'claude-3-sonnet-20240229',
      priority: 9, // Higher priority
      enabled: true,
      timeout: 30000,
      maxRetries: 3
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
      priority: 7, // Lower priority (fallback)
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      organization: process.env.OPENAI_ORGANIZATION
    }
  },
  retrySettings: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  },
  healthCheckInterval: 5 * 60 * 1000, // 5 minutes
  costTracking: true
});
```

## API Reference

### Core Types

#### AIPrompt
```typescript
interface AIPrompt {
  content: string;           // The main prompt text
  role: 'system' | 'user' | 'assistant';
  context?: Record<string, any>;  // Additional context
  maxTokens?: number;        // Maximum response tokens
  temperature?: number;      // Response creativity (0-2)
  metadata?: Record<string, string>;
}
```

#### AIResponse
```typescript
interface AIResponse {
  content: string;           // The AI's response
  provider: AIProviderType;  // Which provider generated this
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost?: number;
  };
  metadata: {
    model: string;
    responseTime: number;    // Milliseconds
    requestId?: string;
    finishReason?: string;
  };
  timestamp: Date;
}
```

### AI Manager Methods

#### generateResponse(prompt, preferredProvider?)
```typescript
const response = await aiManager.generateResponse({
  content: "Explain quantum computing",
  maxTokens: 500,
  temperature: 0.7
}, 'claude'); // Optional: prefer Claude
```

#### getProvidersHealth()
```typescript
const health = await aiManager.getProvidersHealth();
console.log(health.map(h => `${h.provider}: ${h.status}`));
```

#### getProvidersMetrics()
```typescript
const metrics = aiManager.getProvidersMetrics();
console.log(`Total requests: ${metrics[0].requestCount}`);
```

#### getCostMetrics()
```typescript
const costs = aiManager.getCostMetrics();
const totalCost = costs.reduce((sum, c) => sum + c.totalCost, 0);
console.log(`Total spent: $${totalCost.toFixed(4)}`);
```

## Monitor-Specific Helpers

The AI system includes specialized helpers for monitor-related tasks:

### System Prompts
```typescript
import { createMonitorSystemPrompt } from '@monitors/ai';

const classificationPrompt = createMonitorSystemPrompt({
  task: 'classify',
  domain: 'finance',
  instructions: 'Focus on stock price monitoring'
});
```

### Validation
```typescript
import { validateAIPrompt } from '@monitors/ai';

const validPrompt = validateAIPrompt({
  content: "Monitor Tesla stock price",
  maxTokens: 100
}); // Throws if invalid
```

### Health Check
```typescript
import { isAISystemHealthy, getAISystemStatus } from '@monitors/ai';

if (await isAISystemHealthy()) {
  const status = await getAISystemStatus();
  console.log(`${status.providers.length} providers available`);
}
```

## Error Handling

The system provides detailed error categorization:

```typescript
import { AIProviderError, AIErrorType } from '@monitors/ai';

try {
  const response = await aiManager.generateResponse(prompt);
} catch (error) {
  if (error instanceof AIProviderError) {
    switch (error.type) {
      case AIErrorType.RATE_LIMIT:
        // Handle rate limiting
        break;
      case AIErrorType.AUTHENTICATION:
        // Handle auth errors
        break;
      case AIErrorType.QUOTA_EXCEEDED:
        // Handle quota issues
        break;
      default:
        // Handle other errors
    }
  }
}
```

## Provider Configuration

### Claude Configuration
```typescript
interface ClaudeConfig {
  apiKey: string;
  model?: 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' | 'claude-3-opus-20240229';
  version?: string;
  priority: number;
  enabled: boolean;
  timeout: number;
  maxRetries: number;
}
```

### OpenAI Configuration
```typescript
interface OpenAIConfig {
  apiKey: string;
  model?: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  organization?: string;
  priority: number;
  enabled: boolean;
  timeout: number;
  maxRetries: number;
}
```

## Testing

The system includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run dev
```

### Test Helpers
```typescript
import { createTestAIManager } from '@monitors/ai/tests';

const testManager = createTestAIManager();
// Use in your tests
```

## Best Practices

1. **Provider Priority**: Set Claude as primary (higher priority) and OpenAI as fallback
2. **Cost Monitoring**: Regularly check cost metrics and set budgets
3. **Health Checks**: Monitor provider health and respond to degradation
4. **Error Handling**: Implement proper retry logic for retryable errors
5. **Caching**: Consider caching responses for repeated queries
6. **Rate Limiting**: Respect provider rate limits to avoid throttling

## Environment Variables

```bash
# Required
CLAUDE_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# Optional
OPENAI_ORGANIZATION=your_org_id
AI_HEALTH_CHECK_INTERVAL=300000  # 5 minutes
AI_MAX_RETRIES=3
AI_RETRY_DELAY=1000
```

## Contributing

When contributing to the AI system:

1. Follow TypeScript best practices
2. Add comprehensive tests for new features
3. Update this README for API changes
4. Consider cost implications of changes
5. Test with both providers
6. Document error scenarios

## License

MIT License - see LICENSE file for details