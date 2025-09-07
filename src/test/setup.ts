import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/monitors_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Mock external dependencies
vi.mock('@node-rs/bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('mocked-hash'),
  verify: vi.fn().mockResolvedValue(true),
}));

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(void 0),
    disconnect: vi.fn().mockResolvedValue(void 0),
    ping: vi.fn().mockResolvedValue('PONG'),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(-1),
    incr: vi.fn().mockResolvedValue(1),
    decr: vi.fn().mockResolvedValue(0),
    pipeline: vi.fn().mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 0], [null, 0], [null, 1], [null, 1]])
    }),
    zpopmax: vi.fn().mockResolvedValue([]),
    zremrangebyscore: vi.fn().mockResolvedValue(0),
    zcard: vi.fn().mockResolvedValue(0)
  }))
}));

// Mock Anthropic AI SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: 'Mocked AI response'
        }],
        usage: { input_tokens: 10, output_tokens: 20 }
      })
    }
  }))
}));

// Mock OpenAI SDK
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked OpenAI response'
            }
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      }
    }
  }))
}));

// Mock Puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn().mockResolvedValue(void 0),
        content: vi.fn().mockResolvedValue('<html><body>Mocked content</body></html>'),
        close: vi.fn().mockResolvedValue(void 0)
      }),
      close: vi.fn().mockResolvedValue(void 0)
    })
  }
}));

// Mock AWS SES
vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({
      MessageId: 'mocked-message-id'
    })
  })),
  SendEmailCommand: vi.fn().mockImplementation((params) => params)
}));

// Mock AI services
vi.mock('$lib/ai', () => ({
  classifyPrompt: vi.fn().mockResolvedValue({
    monitorType: 'state',
    extractedFact: 'test fact extraction',
    triggerCondition: 'value !== null',
    factType: 'string',
    recommendedFrequency: 60,
    confidence: 0.95
  }),
  generateTemplateSuggestions: vi.fn().mockResolvedValue([
    {
      name: 'Website Availability Monitor',
      prompt: 'Monitor if the website is available',
      type: 'state',
      extractedFact: 'status code',
      triggerCondition: 'status_code !== 200'
    }
  ]),
  extractFacts: vi.fn().mockResolvedValue({
    success: true,
    extractedValue: 'test extracted value',
    confidence: 0.9,
    processingTime: 1200
  }),
  enhanceScrapingData: vi.fn().mockResolvedValue({
    enhancedContent: 'enhanced test content',
    structuredData: { status: 'ok' },
    processingTime: 800
  }),
  generateNotification: vi.fn().mockResolvedValue({
    subject: 'Test Monitor Alert',
    body: 'Your monitor has detected a change.',
    urgency: 'medium',
    personalized: true
  })
}));

// Mock AI manager initialization
vi.mock('$lib/ai/manager', () => ({
  getGlobalAIManager: vi.fn().mockReturnValue({
    generateResponse: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Mocked AI response' }],
      usage: { input_tokens: 10, output_tokens: 20 }
    }),
    checkHealth: vi.fn().mockResolvedValue([
      { provider: 'anthropic', status: 'healthy', responseTime: 150 },
      { provider: 'openai', status: 'healthy', responseTime: 200 }
    ])
  }),
  createAIManager: vi.fn(),
  AIProviderError: class extends Error {
    constructor(message: string, public type: string, public provider?: string) {
      super(message);
      this.name = 'AIProviderError';
    }
  },
  AIErrorType: {
    PROVIDER_ERROR: 'PROVIDER_ERROR',
    RATE_LIMIT: 'RATE_LIMIT',
    AUTHENTICATION: 'AUTHENTICATION',
    INVALID_REQUEST: 'INVALID_REQUEST',
    NETWORK_ERROR: 'NETWORK_ERROR'
  }
}));

// Global test utilities
global.testDb = null;
global.testRedis = null;