/**
 * AI002: Prompt Classification Service
 * 
 * Classifies user prompts to determine monitor type, extract key parameters,
 * and identify monitoring frequency requirements using AI-powered analysis.
 */

import { z } from 'zod';
import { AIPrompt, AIResponse, AIProviderType } from '../types/index.js';
import { getGlobalAIManager } from '../manager.js';
import { createMonitorSystemPrompt } from '../index.js';

// Monitor types
export enum MonitorType {
  STATE = 'state',           // Track current values (e.g., "What is Tesla's stock price?")
  CHANGE = 'change',         // Detect changes (e.g., "Tell me when Tesla goes above $200")
  TREND = 'trend',           // Monitor trends (e.g., "Tell me if Tesla stock is trending up")
  THRESHOLD = 'threshold',   // Specific threshold monitoring
  SCHEDULE = 'schedule'      // Time-based monitoring (e.g., daily reports)
}

// Entity types that can be monitored
export enum EntityType {
  STOCK = 'stock',
  CRYPTOCURRENCY = 'cryptocurrency', 
  WEATHER = 'weather',
  SPORTS_TEAM = 'sports_team',
  NEWS_TOPIC = 'news_topic',
  WEBSITE = 'website',
  PRICE = 'price',
  AVAILABILITY = 'availability',
  STATUS = 'status',
  METRIC = 'metric',
  UNKNOWN = 'unknown'
}

// Condition types for monitoring
export enum ConditionType {
  EQUALS = 'equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  CONTAINS = 'contains',
  CHANGES = 'changes',
  INCREASES = 'increases',
  DECREASES = 'decreases',
  MATCHES_REGEX = 'matches_regex'
}

// Monitoring frequencies
export enum MonitoringFrequency {
  REAL_TIME = 'real_time',     // < 1 minute
  FREQUENT = 'frequent',       // 1-15 minutes  
  REGULAR = 'regular',         // 15-60 minutes
  HOURLY = 'hourly',          // 1-6 hours
  DAILY = 'daily',            // 24 hours
  WEEKLY = 'weekly',          // 7 days
  CUSTOM = 'custom'           // User-defined
}

// Zod schemas for validation
export const ExtractedEntitySchema = z.object({
  type: z.nativeEnum(EntityType),
  value: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional()
});

export const ExtractedConditionSchema = z.object({
  type: z.nativeEnum(ConditionType),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional()
});

export const FrequencyRecommendationSchema = z.object({
  recommended: z.nativeEnum(MonitoringFrequency),
  reasoning: z.string(),
  alternativeOptions: z.array(z.nativeEnum(MonitoringFrequency)).optional(),
  customInterval: z.number().optional(), // in minutes
  confidence: z.number().min(0).max(1)
});

export const PromptClassificationResultSchema = z.object({
  // Core classification
  monitorType: z.nativeEnum(MonitorType),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  
  // Extracted entities
  entities: z.array(ExtractedEntitySchema),
  primaryEntity: ExtractedEntitySchema.optional(),
  
  // Extracted conditions
  conditions: z.array(ExtractedConditionSchema),
  
  // Frequency recommendation
  frequency: FrequencyRecommendationSchema,
  
  // Validation and quality
  isValid: z.boolean(),
  validationErrors: z.array(z.string()),
  qualityScore: z.number().min(0).max(1),
  
  // Improvement suggestions
  suggestions: z.array(z.string()).optional(),
  improvedPrompt: z.string().optional(),
  
  // Metadata
  processingTime: z.number(),
  timestamp: z.date().default(() => new Date())
});

// TypeScript types
export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;
export type ExtractedCondition = z.infer<typeof ExtractedConditionSchema>;
export type FrequencyRecommendation = z.infer<typeof FrequencyRecommendationSchema>;
export type PromptClassificationResult = z.infer<typeof PromptClassificationResultSchema>;

/**
 * Main Prompt Classification Service
 */
export class PromptClassificationService {
  private aiManager = getGlobalAIManager();
  
  /**
   * Classify a user prompt and extract all relevant monitoring parameters
   */
  async classifyPrompt(
    prompt: string,
    options: {
      userId?: string;
      preferredProvider?: AIProviderType;
      includeImprovements?: boolean;
    } = {}
  ): Promise<PromptClassificationResult> {
    const startTime = Date.now();
    
    try {
      // Create the classification prompt
      const classificationPrompt = this.createClassificationPrompt(prompt);
      
      // Get AI response
      const aiResponse = await this.aiManager.generateResponse(
        {
          content: classificationPrompt,
          role: 'user',
          maxTokens: 2000,
          temperature: 0.3,
          context: {
            system: createMonitorSystemPrompt({
              task: 'classify',
              instructions: 'Provide structured JSON response for prompt classification'
            })
          }
        },
        options.preferredProvider
      );
      
      // Parse and validate the AI response
      const rawResult = this.parseAIResponse(aiResponse.content);
      const processingTime = Date.now() - startTime;
      
      // Add metadata and validate
      const result = {
        ...rawResult,
        processingTime,
        timestamp: new Date()
      };
      
      // Validate the result
      const validatedResult = PromptClassificationResultSchema.parse(result);
      
      // Add improvement suggestions if requested
      if (options.includeImprovements && validatedResult.qualityScore < 0.8) {
        const improvements = await this.generateImprovements(prompt, validatedResult);
        validatedResult.suggestions = improvements.suggestions;
        validatedResult.improvedPrompt = improvements.improvedPrompt;
      }
      
      return validatedResult;
      
    } catch (error) {
      // Return fallback result on error
      return this.createFallbackResult(prompt, Date.now() - startTime, error as Error);
    }
  }
  
  /**
   * Batch classify multiple prompts
   */
  async classifyPrompts(
    prompts: string[],
    options: {
      userId?: string;
      preferredProvider?: AIProviderType;
      includeImprovements?: boolean;
    } = {}
  ): Promise<PromptClassificationResult[]> {
    // Process in parallel with rate limiting
    const batchSize = 5;
    const results: PromptClassificationResult[] = [];
    
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchPromises = batch.map(prompt => this.classifyPrompt(prompt, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Create the AI prompt for classification
   */
  private createClassificationPrompt(userPrompt: string): string {
    return `Analyze the following user prompt for monitor creation and provide a structured classification:

USER PROMPT: "${userPrompt}"

Please analyze this prompt and return a JSON response with the following structure:
{
  "monitorType": "state|change|trend|threshold|schedule",
  "confidence": 0.95,
  "reasoning": "Explanation of classification decision",
  "entities": [
    {
      "type": "stock|cryptocurrency|weather|sports_team|news_topic|website|price|availability|status|metric|unknown",
      "value": "extracted entity name",
      "confidence": 0.90,
      "metadata": {}
    }
  ],
  "primaryEntity": {
    "type": "stock",
    "value": "TSLA",
    "confidence": 0.95
  },
  "conditions": [
    {
      "type": "greater_than|less_than|equals|between|contains|changes|increases|decreases|matches_regex",
      "value": 200,
      "confidence": 0.85,
      "metadata": {"unit": "USD"}
    }
  ],
  "frequency": {
    "recommended": "frequent|regular|hourly|daily|weekly|real_time|custom",
    "reasoning": "Explanation for frequency choice",
    "alternativeOptions": ["daily", "hourly"],
    "customInterval": 15,
    "confidence": 0.80
  },
  "isValid": true,
  "validationErrors": [],
  "qualityScore": 0.85
}

CLASSIFICATION GUIDELINES:
1. STATE: User wants to know current value ("What is...", "Show me...")
2. CHANGE: User wants notification when something changes ("Tell me when...", "Alert me if...")
3. TREND: User wants to track direction/patterns ("Is ... trending up?", "Track growth of...")
4. THRESHOLD: User specifies specific trigger values ("When price > $100")
5. SCHEDULE: User wants regular reports ("Daily report on...", "Weekly summary")

ENTITY EXTRACTION:
- Look for company names, stock symbols, cryptocurrencies, locations for weather
- Extract sports teams, websites, specific products/services
- Identify metrics being monitored (price, temperature, availability, etc.)

CONDITION PARSING:
- Extract numerical thresholds, comparison operators
- Identify percentage changes, ranges, text patterns
- Look for temporal conditions ("within 24 hours", "by end of week")

FREQUENCY DETERMINATION:
- Financial data: frequent to real_time
- Weather: regular to hourly
- News/status: hourly to daily
- General web content: daily
- Consider urgency indicators in prompt

Provide ONLY the JSON response, no additional text.`;
  }
  
  /**
   * Parse AI response and extract classification data
   */
  private parseAIResponse(response: string): Omit<PromptClassificationResult, 'processingTime' | 'timestamp'> {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // Ensure all required fields exist with defaults
      return {
        monitorType: parsed.monitorType || MonitorType.STATE,
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'Classification based on prompt analysis',
        entities: parsed.entities || [],
        primaryEntity: parsed.primaryEntity,
        conditions: parsed.conditions || [],
        frequency: parsed.frequency || {
          recommended: MonitoringFrequency.DAILY,
          reasoning: 'Default daily frequency',
          confidence: 0.5
        },
        isValid: parsed.isValid !== false,
        validationErrors: parsed.validationErrors || [],
        qualityScore: parsed.qualityScore || 0.6
      };
      
    } catch (error) {
      // Return minimal valid result if parsing fails
      return {
        monitorType: MonitorType.STATE,
        confidence: 0.3,
        reasoning: 'Failed to parse AI response, using fallback classification',
        entities: [],
        conditions: [],
        frequency: {
          recommended: MonitoringFrequency.DAILY,
          reasoning: 'Default frequency due to parsing error',
          confidence: 0.3
        },
        isValid: false,
        validationErrors: [`Parsing error: ${(error as Error).message}`],
        qualityScore: 0.3
      };
    }
  }
  
  /**
   * Generate improvement suggestions for low-quality prompts
   */
  private async generateImprovements(
    originalPrompt: string,
    classification: PromptClassificationResult
  ): Promise<{ suggestions: string[]; improvedPrompt: string }> {
    try {
      const improvementPrompt = `The user prompt "${originalPrompt}" has been classified with quality score ${classification.qualityScore}.

Please provide:
1. 3-5 specific suggestions to improve the prompt clarity
2. A rewritten version of the prompt that would be clearer and more specific

Current classification issues:
${classification.validationErrors.join(', ')}

Return JSON:
{
  "suggestions": ["Add specific threshold values", "Specify desired frequency"],
  "improvedPrompt": "Tell me when Tesla (TSLA) stock price goes above $200, check every 15 minutes"
}`;

      const aiResponse = await this.aiManager.generateResponse({
        content: improvementPrompt,
        role: 'user',
        maxTokens: 500,
        temperature: 0.4,
        context: {
          system: createMonitorSystemPrompt({
            task: 'generate',
            instructions: 'Provide helpful suggestions for improving monitor prompts'
          })
        }
      });

      const parsed = JSON.parse(aiResponse.content);
      return {
        suggestions: parsed.suggestions || ['Consider adding more specific details'],
        improvedPrompt: parsed.improvedPrompt || originalPrompt
      };
      
    } catch {
      return {
        suggestions: ['Be more specific about what you want to monitor', 'Include threshold values if applicable'],
        improvedPrompt: originalPrompt
      };
    }
  }
  
  /**
   * Create fallback result when classification fails
   */
  private createFallbackResult(
    prompt: string,
    processingTime: number,
    error: Error
  ): PromptClassificationResult {
    return {
      monitorType: MonitorType.STATE,
      confidence: 0.2,
      reasoning: 'Fallback classification due to processing error',
      entities: [],
      conditions: [],
      frequency: {
        recommended: MonitoringFrequency.DAILY,
        reasoning: 'Default daily frequency',
        confidence: 0.2
      },
      isValid: false,
      validationErrors: [`Processing error: ${error.message}`],
      qualityScore: 0.2,
      processingTime,
      timestamp: new Date()
    };
  }
  
  /**
   * Validate extracted entities against known patterns
   */
  validateEntities(entities: ExtractedEntity[]): string[] {
    const errors: string[] = [];
    
    entities.forEach((entity, index) => {
      if (entity.confidence < 0.3) {
        errors.push(`Entity ${index + 1} has very low confidence (${entity.confidence})`);
      }
      
      if (!entity.value || entity.value.trim().length === 0) {
        errors.push(`Entity ${index + 1} has empty value`);
      }
      
      // Type-specific validation
      if (entity.type === EntityType.STOCK && entity.value) {
        const stockPattern = /^[A-Z]{1,5}$/;
        if (!stockPattern.test(entity.value) && entity.value.length > 10) {
          errors.push(`Entity "${entity.value}" doesn't match expected stock symbol pattern`);
        }
      }
    });
    
    return errors;
  }
  
  /**
   * Validate extracted conditions
   */
  validateConditions(conditions: ExtractedCondition[]): string[] {
    const errors: string[] = [];
    
    conditions.forEach((condition, index) => {
      if (condition.confidence < 0.3) {
        errors.push(`Condition ${index + 1} has very low confidence`);
      }
      
      if (condition.value === null || condition.value === undefined) {
        errors.push(`Condition ${index + 1} has no value`);
      }
      
      // Type-specific validation
      if ([ConditionType.GREATER_THAN, ConditionType.LESS_THAN].includes(condition.type)) {
        if (typeof condition.value !== 'number') {
          errors.push(`Condition ${index + 1}: ${condition.type} requires numeric value`);
        }
      }
    });
    
    return errors;
  }
}

// Export singleton instance
export const promptClassificationService = new PromptClassificationService();

/**
 * Convenience function for quick prompt classification
 */
export async function classifyPrompt(
  prompt: string,
  options?: {
    userId?: string;
    preferredProvider?: AIProviderType;
    includeImprovements?: boolean;
  }
): Promise<PromptClassificationResult> {
  return promptClassificationService.classifyPrompt(prompt, options);
}

/**
 * Validate if a prompt is suitable for monitoring
 */
export function isValidMonitorPrompt(result: PromptClassificationResult): boolean {
  return result.isValid && 
         result.confidence > 0.5 && 
         result.qualityScore > 0.4 &&
         result.entities.length > 0;
}