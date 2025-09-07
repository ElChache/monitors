# AI Services

This directory contains specialized AI services that build upon the core AI provider abstraction system.

## AI002: Prompt Classification Service

The Prompt Classification Service (`promptClassification.ts`) analyzes user prompts to determine monitor types, extract entities, parse conditions, and recommend monitoring frequencies.

### Features

- **Monitor Type Classification**: Distinguishes between state, change, trend, threshold, and scheduled monitoring
- **Entity Extraction**: Identifies stocks, cryptocurrencies, weather locations, sports teams, and other monitorable entities
- **Condition Parsing**: Extracts thresholds, comparisons, ranges, and trigger conditions
- **Frequency Recommendations**: Suggests optimal monitoring intervals based on content type and volatility
- **Confidence Scoring**: Provides reliability scores for all extracted information
- **Quality Assessment**: Validates prompt clarity and provides improvement suggestions
- **Batch Processing**: Handles multiple prompts efficiently with rate limiting

### Usage

```typescript
import { classifyPrompt, PromptClassificationService } from '@/lib/ai/services/promptClassification';

// Simple classification
const result = await classifyPrompt("Tell me when Tesla stock goes above $200");

// Advanced usage with options
const service = new PromptClassificationService();
const result = await service.classifyPrompt(
  "Monitor Apple stock price", 
  {
    includeImprovements: true,
    preferredProvider: AIProviderType.CLAUDE
  }
);

// Batch processing
const results = await service.classifyPrompts([
  "What is Bitcoin price?",
  "Alert me when weather changes",
  "Track Apple news daily"
]);
```

### Classification Types

#### Monitor Types
- `STATE`: Track current values ("What is Tesla's stock price?")
- `CHANGE`: Detect when something changes ("Tell me when Tesla goes above $200")  
- `TREND`: Monitor direction/patterns ("Is Tesla trending up?")
- `THRESHOLD`: Specific trigger values ("When price > $100")
- `SCHEDULE`: Regular reports ("Daily Apple news summary")

#### Entity Types
- `STOCK`: Company stocks and equity securities
- `CRYPTOCURRENCY`: Digital currencies (Bitcoin, Ethereum, etc.)
- `WEATHER`: Weather conditions and forecasts
- `SPORTS_TEAM`: Sports teams and game results
- `NEWS_TOPIC`: News topics and current events
- `WEBSITE`: Website availability and content changes
- `PRICE`: Product prices and cost monitoring
- `AVAILABILITY`: Inventory and availability status
- `STATUS`: Service status and uptime monitoring
- `METRIC`: Custom metrics and KPIs

#### Condition Types
- `EQUALS`: Exact value matching
- `GREATER_THAN`: Threshold exceeded
- `LESS_THAN`: Below threshold
- `BETWEEN`: Range monitoring
- `CONTAINS`: Text pattern matching
- `CHANGES`: Any change detection
- `INCREASES/DECREASES`: Directional changes
- `MATCHES_REGEX`: Regular expression patterns

#### Monitoring Frequencies
- `REAL_TIME`: < 1 minute (high-volatility assets)
- `FREQUENT`: 1-15 minutes (active monitoring)
- `REGULAR`: 15-60 minutes (standard updates)
- `HOURLY`: 1-6 hours (periodic checks)
- `DAILY`: 24 hours (daily reports)
- `WEEKLY`: 7 days (weekly summaries)
- `CUSTOM`: User-defined intervals

### Response Structure

```typescript
interface PromptClassificationResult {
  // Core classification
  monitorType: MonitorType;
  confidence: number;          // 0-1 reliability score
  reasoning: string;           // Explanation of classification
  
  // Extracted entities
  entities: ExtractedEntity[];
  primaryEntity?: ExtractedEntity;
  
  // Extracted conditions  
  conditions: ExtractedCondition[];
  
  // Frequency recommendation
  frequency: FrequencyRecommendation;
  
  // Quality assessment
  isValid: boolean;
  validationErrors: string[];
  qualityScore: number;        // 0-1 overall quality
  
  // Improvements (optional)
  suggestions?: string[];
  improvedPrompt?: string;
  
  // Metadata
  processingTime: number;
  timestamp: Date;
}
```

### Quality Scoring

The service provides quality scores based on:
- **Clarity**: How clear and specific the prompt is
- **Completeness**: Presence of all necessary information
- **Confidence**: Reliability of extracted information
- **Validation**: Technical correctness of parameters

Prompts with quality scores < 0.8 can receive improvement suggestions.

### Error Handling

- **Graceful Degradation**: Returns fallback classifications on AI failures
- **Validation**: Comprehensive input and output validation with Zod schemas
- **Retries**: Built-in retry logic through the AI manager
- **Fallback Results**: Minimal valid responses when processing fails

### Performance

- **Batch Processing**: Handles multiple prompts with configurable batch sizes
- **Rate Limiting**: Respects AI provider rate limits
- **Caching**: Can be integrated with Redis caching for repeated prompts
- **Parallel Processing**: Processes batches concurrently for better throughput

### Testing

Comprehensive test suite covers:
- All monitor types and entity extraction scenarios
- Error handling and edge cases
- Batch processing and performance
- Quality validation and improvement suggestions
- Provider failover scenarios

Run tests with:
```bash
npm test src/lib/ai/services/tests/promptClassification.test.ts
```

### Dependencies

- **AI001**: Core AI provider abstraction system
- **Zod**: Runtime type validation
- **Global AI Manager**: Provider coordination and failover

### Integration

The Prompt Classification Service integrates with:
- **Monitor Creation Flow**: Validates and enhances user input
- **AI003 Fact Extraction**: Provides context for web scraping
- **AI008 Notification Generation**: Informs content personalization
- **Frontend UI**: Real-time prompt validation and suggestions