/**
 * AI-Powered Fact Extraction Pipeline
 * 
 * Extracts meaningful facts and data from web content for monitor evaluation.
 * Handles various content types, data formats, and provides quality scoring.
 */

import { z } from 'zod';
import type { AIManager } from '../manager.js';
import { getGlobalAIManager } from '../manager.js';
import { createMonitorSystemPrompt } from '../index.js';

// Core fact extraction types
export enum ContentType {
  TEXT = 'text',
  HTML = 'html',
  JSON_LD = 'json-ld',
  MICRODATA = 'microdata',
  TABLE = 'table',
  LIST = 'list',
  IMAGE_OCR = 'image-ocr',
  PDF = 'pdf'
}

export enum FactType {
  NUMERICAL = 'numerical',
  TEMPORAL = 'temporal',
  TEXT = 'text',
  BOOLEAN = 'boolean',
  URL = 'url',
  STRUCTURED = 'structured'
}

// Input schemas
export const FactExtractionInputSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  contentType: z.nativeEnum(ContentType),
  sourceUrl: z.string().url().optional(),
  expectedFacts: z.array(z.string()).optional(),
  extractionHints: z.object({
    target: z.string().optional(),
    selector: z.string().optional(),
    pattern: z.string().optional(),
    unit: z.string().optional()
  }).optional(),
  qualityThreshold: z.number().min(0).max(1).default(0.7),
});

export const BatchExtractionInputSchema = z.object({
  extractions: z.array(FactExtractionInputSchema).min(1).max(10),
  correlate: z.boolean().default(false),
  timeout: z.number().min(1000).max(30000).default(10000)
});

// Output types
export interface ExtractedFact {
  id: string;
  type: FactType;
  value: any;
  confidence: number;
  source: {
    contentType: ContentType;
    location: string;
    selector?: string;
    timestamp: Date;
  };
  metadata: {
    unit?: string;
    format?: string;
    precision?: number;
    context?: string;
  };
  validation: {
    isValid: boolean;
    issues: string[];
    qualityScore: number;
  };
}

export interface FactExtractionResult {
  success: boolean;
  facts: ExtractedFact[];
  processingTime: number;
  contentAnalysis: {
    contentType: ContentType;
    size: number;
    structure: 'structured' | 'semi-structured' | 'unstructured';
    language?: string;
    encoding?: string;
  };
  qualitySummary: {
    overallScore: number;
    highConfidenceFacts: number;
    validationIssues: number;
    recommendedActions: string[];
  };
  error?: string;
}

export interface BatchExtractionResult {
  success: boolean;
  results: FactExtractionResult[];
  correlations: Array<{
    facts: string[];
    relationship: string;
    confidence: number;
  }>;
  processingTime: number;
  error?: string;
}

// Content analysis helpers
class ContentAnalyzer {
  static analyzeContent(content: string, contentType: ContentType) {
    const size = content.length;
    let structure: 'structured' | 'semi-structured' | 'unstructured' = 'unstructured';
    
    if (contentType === ContentType.JSON_LD || contentType === ContentType.TABLE) {
      structure = 'structured';
    } else if (contentType === ContentType.HTML || contentType === ContentType.MICRODATA) {
      structure = 'semi-structured';
    }

    // Simple language detection
    const language = this.detectLanguage(content);
    
    return {
      contentType,
      size,
      structure,
      language,
      encoding: 'utf-8'
    };
  }

  private static detectLanguage(content: string): string {
    // Simple heuristic language detection
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    const words = content.toLowerCase().split(/\s+/).slice(0, 100);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    
    return englishWordCount > words.length * 0.1 ? 'en' : 'unknown';
  }
}

// Fact validators
class FactValidator {
  static validateFact(fact: Partial<ExtractedFact>): { isValid: boolean; issues: string[]; qualityScore: number } {
    const issues: string[] = [];
    let qualityScore = 1.0;

    // Check required fields
    if (!fact.value) {
      issues.push('Missing fact value');
      qualityScore -= 0.5;
    }

    if (!fact.confidence || fact.confidence < 0 || fact.confidence > 1) {
      issues.push('Invalid confidence score');
      qualityScore -= 0.3;
    }

    // Type-specific validation
    if (fact.type === FactType.NUMERICAL) {
      if (typeof fact.value !== 'number' && isNaN(Number(fact.value))) {
        issues.push('Numerical fact value is not a valid number');
        qualityScore -= 0.4;
      }
    }

    if (fact.type === FactType.TEMPORAL) {
      const date = new Date(fact.value);
      if (isNaN(date.getTime())) {
        issues.push('Temporal fact value is not a valid date');
        qualityScore -= 0.4;
      }
    }

    if (fact.type === FactType.URL) {
      try {
        new URL(fact.value);
      } catch {
        issues.push('URL fact value is not a valid URL');
        qualityScore -= 0.4;
      }
    }

    // Confidence penalty
    if (fact.confidence && fact.confidence < 0.5) {
      qualityScore -= (0.5 - fact.confidence);
    }

    return {
      isValid: issues.length === 0,
      issues,
      qualityScore: Math.max(0, qualityScore)
    };
  }
}

/**
 * Main Fact Extraction Service
 */
export class FactExtractionService {
  private aiManager: AIManager;

  constructor(aiManager?: AIManager) {
    this.aiManager = aiManager || getGlobalAIManager();
  }

  /**
   * Extract facts from single content source
   */
  async extractFacts(input: z.infer<typeof FactExtractionInputSchema>): Promise<FactExtractionResult> {
    const startTime = Date.now();
    
    try {
      const validatedInput = FactExtractionInputSchema.parse(input);
      
      // Analyze content structure
      const contentAnalysis = ContentAnalyzer.analyzeContent(
        validatedInput.content, 
        validatedInput.contentType
      );

      // Generate AI extraction prompt
      const extractionPrompt = this.createExtractionPrompt(validatedInput, contentAnalysis);
      
      // Call AI service for fact extraction
      const aiResponse = await this.aiManager.generateResponse({
        content: extractionPrompt,
        role: 'user',
        maxTokens: 2000,
        temperature: 0.1,
        context: {
          system: createMonitorSystemPrompt({
            task: 'extract',
            domain: 'fact-extraction',
            instructions: 'Extract factual information with high precision and confidence scoring'
          })
        }
      });

      if (!aiResponse.success) {
        throw new Error(`AI extraction failed: ${aiResponse.error}`);
      }

      // Parse AI response into structured facts
      const extractedFacts = this.parseAIResponse(aiResponse.content, validatedInput);
      
      // Validate and score each fact
      const validatedFacts = extractedFacts.map(fact => {
        const validation = FactValidator.validateFact(fact);
        return {
          ...fact,
          validation
        } as ExtractedFact;
      });

      // Filter facts by quality threshold
      const qualityFacts = validatedFacts.filter(
        fact => fact.validation.qualityScore >= validatedInput.qualityThreshold
      );

      // Generate quality summary
      const qualitySummary = this.generateQualitySummary(validatedFacts);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        facts: qualityFacts,
        processingTime,
        contentAnalysis,
        qualitySummary
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        facts: [],
        processingTime,
        contentAnalysis: ContentAnalyzer.analyzeContent(input.content, input.contentType),
        qualitySummary: {
          overallScore: 0,
          highConfidenceFacts: 0,
          validationIssues: 0,
          recommendedActions: ['Fix extraction error and retry']
        },
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }

  /**
   * Extract facts from multiple sources with optional correlation
   */
  async extractFactsBatch(input: z.infer<typeof BatchExtractionInputSchema>): Promise<BatchExtractionResult> {
    const startTime = Date.now();
    
    try {
      const validatedInput = BatchExtractionInputSchema.parse(input);
      
      // Process extractions in parallel with timeout
      const extractionPromises = validatedInput.extractions.map((extraction, index) =>
        Promise.race([
          this.extractFacts(extraction),
          new Promise<FactExtractionResult>((_, reject) => 
            setTimeout(() => reject(new Error(`Extraction ${index} timed out`)), validatedInput.timeout)
          )
        ]).catch(error => ({
          success: false,
          facts: [],
          processingTime: validatedInput.timeout,
          contentAnalysis: ContentAnalyzer.analyzeContent(extraction.content, extraction.contentType),
          qualitySummary: {
            overallScore: 0,
            highConfidenceFacts: 0,
            validationIssues: 1,
            recommendedActions: ['Retry with longer timeout']
          },
          error: error.message
        }))
      );

      const results = await Promise.all(extractionPromises);
      
      // Generate correlations if requested
      let correlations: Array<{ facts: string[]; relationship: string; confidence: number }> = [];
      if (validatedInput.correlate) {
        correlations = await this.findFactCorrelations(results);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: results.some(r => r.success),
        results,
        correlations,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        results: [],
        correlations: [],
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown batch extraction error'
      };
    }
  }

  /**
   * Create AI prompt for fact extraction
   */
  private createExtractionPrompt(
    input: z.infer<typeof FactExtractionInputSchema>,
    analysis: any
  ): string {
    let prompt = `Extract factual information from the following ${input.contentType} content:\n\n`;
    
    prompt += `Content (${analysis.size} characters):\n${input.content.substring(0, 2000)}`;
    if (input.content.length > 2000) {
      prompt += '\n... (truncated)';
    }
    prompt += '\n\n';

    if (input.expectedFacts?.length) {
      prompt += `Expected fact types: ${input.expectedFacts.join(', ')}\n\n`;
    }

    if (input.extractionHints) {
      prompt += 'Extraction hints:\n';
      Object.entries(input.extractionHints).forEach(([key, value]) => {
        if (value) prompt += `- ${key}: ${value}\n`;
      });
      prompt += '\n';
    }

    prompt += `Please extract facts and return them as a JSON array with this structure:
[
  {
    "id": "unique-fact-id",
    "type": "numerical|temporal|text|boolean|url|structured",
    "value": "extracted-value",
    "confidence": 0.95,
    "location": "content-location-or-selector",
    "unit": "optional-unit",
    "context": "surrounding-context"
  }
]

Rules:
1. Only extract verifiable, factual information
2. Assign confidence scores (0-1) based on clarity and certainty
3. Include location/selector information where possible
4. For numerical values, include units when identifiable
5. Provide brief context for ambiguous facts
6. Return empty array if no reliable facts found`;

    return prompt;
  }

  /**
   * Parse AI response into structured facts
   */
  private parseAIResponse(
    response: string, 
    input: z.infer<typeof FactExtractionInputSchema>
  ): Partial<ExtractedFact>[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }

      const parsedFacts = JSON.parse(jsonMatch[0]);
      
      return parsedFacts.map((fact: any, index: number) => ({
        id: fact.id || `fact-${Date.now()}-${index}`,
        type: this.mapFactType(fact.type),
        value: fact.value,
        confidence: Math.min(1, Math.max(0, fact.confidence || 0.5)),
        source: {
          contentType: input.contentType,
          location: fact.location || 'unknown',
          selector: fact.selector,
          timestamp: new Date()
        },
        metadata: {
          unit: fact.unit,
          format: typeof fact.value,
          context: fact.context
        }
      }));

    } catch (error) {
      console.warn('Failed to parse AI fact extraction response:', error);
      return [];
    }
  }

  private mapFactType(type: string): FactType {
    switch (type?.toLowerCase()) {
      case 'numerical':
      case 'number':
        return FactType.NUMERICAL;
      case 'temporal':
      case 'date':
      case 'time':
        return FactType.TEMPORAL;
      case 'boolean':
      case 'bool':
        return FactType.BOOLEAN;
      case 'url':
      case 'link':
        return FactType.URL;
      case 'structured':
      case 'object':
        return FactType.STRUCTURED;
      default:
        return FactType.TEXT;
    }
  }

  /**
   * Generate quality summary for extraction results
   */
  private generateQualitySummary(facts: ExtractedFact[]): {
    overallScore: number;
    highConfidenceFacts: number;
    validationIssues: number;
    recommendedActions: string[];
  } {
    if (facts.length === 0) {
      return {
        overallScore: 0,
        highConfidenceFacts: 0,
        validationIssues: 0,
        recommendedActions: ['No facts extracted - review content and extraction parameters']
      };
    }

    const avgQuality = facts.reduce((sum, fact) => sum + fact.validation.qualityScore, 0) / facts.length;
    const highConfidenceFacts = facts.filter(f => f.confidence >= 0.8).length;
    const validationIssues = facts.reduce((sum, fact) => sum + fact.validation.issues.length, 0);

    const recommendedActions: string[] = [];
    
    if (avgQuality < 0.6) {
      recommendedActions.push('Consider adjusting quality threshold or improving content quality');
    }
    
    if (highConfidenceFacts / facts.length < 0.5) {
      recommendedActions.push('Many facts have low confidence - verify extraction parameters');
    }
    
    if (validationIssues > facts.length * 0.3) {
      recommendedActions.push('High validation issues - review fact extraction logic');
    }

    if (recommendedActions.length === 0) {
      recommendedActions.push('Extraction quality is good');
    }

    return {
      overallScore: Math.round(avgQuality * 100) / 100,
      highConfidenceFacts,
      validationIssues,
      recommendedActions
    };
  }

  /**
   * Find correlations between facts from multiple sources
   */
  private async findFactCorrelations(
    results: FactExtractionResult[]
  ): Promise<Array<{ facts: string[]; relationship: string; confidence: number }>> {
    // For now, implement basic correlation detection
    // In a full implementation, this would use AI to identify semantic relationships
    
    const correlations: Array<{ facts: string[]; relationship: string; confidence: number }> = [];
    const allFacts = results.flatMap(r => r.facts);
    
    // Simple numerical correlation detection
    const numericalFacts = allFacts.filter(f => f.type === FactType.NUMERICAL);
    
    for (let i = 0; i < numericalFacts.length; i++) {
      for (let j = i + 1; j < numericalFacts.length; j++) {
        const fact1 = numericalFacts[i];
        const fact2 = numericalFacts[j];
        
        const val1 = Number(fact1.value);
        const val2 = Number(fact2.value);
        
        // Check for similar values (within 10%)
        if (Math.abs(val1 - val2) / Math.max(val1, val2) < 0.1) {
          correlations.push({
            facts: [fact1.id, fact2.id],
            relationship: 'similar_values',
            confidence: 0.8
          });
        }
      }
    }
    
    return correlations;
  }
}

// Utility functions for easy usage
export async function extractFacts(input: z.infer<typeof FactExtractionInputSchema>): Promise<FactExtractionResult> {
  const service = new FactExtractionService();
  return await service.extractFacts(input);
}

export async function extractFactsBatch(input: z.infer<typeof BatchExtractionInputSchema>): Promise<BatchExtractionResult> {
  const service = new FactExtractionService();
  return await service.extractFactsBatch(input);
}

// Export validation schemas
// Schemas already exported above, removing duplicate exports