/**
 * AI-Powered Web Scraping Data Enhancement
 * 
 * Enhances raw web scraping data by identifying relevant content, cleaning noise,
 * and extracting meaningful information for monitor evaluation.
 */

import { z } from 'zod';
import type { AIManager } from '../manager.js';
import { getGlobalAIManager } from '../manager.js';
import { createMonitorSystemPrompt } from '../index.js';
import { 
  FactExtractionService, 
  extractFacts,
  ContentType, 
  FactType,
  type ExtractedFact,
  type FactExtractionResult 
} from './factExtraction.js';

// Enhancement types and enums
export enum ContentRelevance {
  HIGHLY_RELEVANT = 'highly_relevant',
  MODERATELY_RELEVANT = 'moderately_relevant', 
  LOW_RELEVANCE = 'low_relevance',
  NOISE = 'noise'
}

export enum NoiseType {
  ADVERTISEMENT = 'advertisement',
  NAVIGATION = 'navigation',
  HEADER_FOOTER = 'header_footer',
  SIDEBAR = 'sidebar',
  SOCIAL_MEDIA = 'social_media',
  COMMENTS = 'comments',
  BOILERPLATE = 'boilerplate',
  DUPLICATE = 'duplicate'
}

export enum DataNormalization {
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  DATE_TIME = 'date_time',
  MEASUREMENT = 'measurement',
  NUMBERS = 'numbers',
  TEXT = 'text'
}

// Input schemas
export const ScrapingEnhancementInputSchema = z.object({
  rawContent: z.string().min(1, 'Raw content cannot be empty'),
  sourceUrl: z.string().url(),
  contentType: z.string().default('text/html'),
  scrapingTimestamp: z.date().default(() => new Date()),
  targetInformation: z.string().optional(),
  context: z.object({
    expectedDataTypes: z.array(z.nativeEnum(FactType)).optional(),
    relevanceHints: z.array(z.string()).optional(),
    noisePatterns: z.array(z.string()).optional(),
    prioritySelectors: z.array(z.string()).optional()
  }).optional(),
  enhancementOptions: z.object({
    removeNoise: z.boolean().default(true),
    normalizeData: z.boolean().default(true),
    extractTemporal: z.boolean().default(true),
    summarizeContent: z.boolean().default(false),
    detectDuplicates: z.boolean().default(true)
  }).default({})
});

export const BatchEnhancementInputSchema = z.object({
  scrapings: z.array(ScrapingEnhancementInputSchema).min(1).max(5),
  correlateAcrossSources: z.boolean().default(true),
  deduplicationStrategy: z.enum(['strict', 'fuzzy', 'none']).default('fuzzy'),
  outputFormat: z.enum(['enhanced', 'facts_only', 'summary']).default('enhanced')
});

// Output types
export interface ContentSegment {
  id: string;
  content: string;
  relevance: ContentRelevance;
  confidence: number;
  position: {
    selector?: string;
    xpath?: string;
    textPosition?: number;
  };
  metadata: {
    wordCount: number;
    containsNumbers: boolean;
    containsDates: boolean;
    language?: string;
  };
  noiseClassification?: {
    isNoise: boolean;
    noiseTypes: NoiseType[];
    removalConfidence: number;
  };
}

export interface NormalizedData {
  id: string;
  originalValue: any;
  normalizedValue: any;
  normalizationType: DataNormalization;
  confidence: number;
  unit?: string;
  metadata: {
    conversionApplied?: string;
    precision?: number;
    timezone?: string;
    currency?: string;
  };
}

export interface TemporalData {
  id: string;
  extractedDate: Date;
  originalText: string;
  confidence: number;
  precision: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
  timezone?: string;
  relative?: {
    isRelative: boolean;
    referencePoint?: Date;
    description?: string;
  };
}

export interface EnhancedScrapingResult {
  success: boolean;
  sourceUrl: string;
  processingTime: number;
  enhancement: {
    originalSize: number;
    cleanedSize: number;
    noiseRemoved: number;
    relevantSegments: number;
  };
  contentSegments: ContentSegment[];
  normalizedData: NormalizedData[];
  temporalData: TemporalData[];
  extractedFacts: ExtractedFact[];
  contentSummary?: {
    mainTopics: string[];
    keyFindings: string[];
    confidenceScore: number;
  };
  qualityMetrics: {
    overallRelevance: number;
    dataCompleteness: number;
    temporalAccuracy: number;
    normalizationSuccess: number;
  };
  error?: string;
}

export interface BatchEnhancementResult {
  success: boolean;
  results: EnhancedScrapingResult[];
  crossSourceAnalysis: {
    duplicatesFound: number;
    correlations: Array<{
      sources: string[];
      similarity: number;
      matchType: 'exact' | 'fuzzy' | 'semantic';
    }>;
    inconsistencies: Array<{
      sources: string[];
      conflictType: string;
      description: string;
    }>;
  };
  aggregatedMetrics: {
    totalNoiseRemoved: number;
    avgRelevanceScore: number;
    uniqueFactsExtracted: number;
    temporalCoverage: {
      startDate?: Date;
      endDate?: Date;
      timeSpan?: string;
    };
  };
  processingTime: number;
  error?: string;
}

// Content analysis and cleaning utilities
class ContentCleaner {
  private static readonly NOISE_PATTERNS = {
    advertisements: [
      /ad(?:vertisement)?[\s\-_]*(?:banner|block|space)/gi,
      /google[\s\-_]*ads?/gi,
      /sponsored[\s\-_]*content/gi,
      /\bads?\b.*\b(?:by|from)\b/gi
    ],
    navigation: [
      /(?:nav|menu|breadcrumb|sidebar)[\s\-_]*(?:item|link|bar)?/gi,
      /(?:home|about|contact|privacy|terms)[\s\-_]*(?:page|link)?/gi,
      /(?:skip|jump)[\s\-_]*to[\s\-_]*(?:content|navigation|main)/gi
    ],
    boilerplate: [
      /copyright[\s\S]*?(?:\d{4}|\ball\s+rights\s+reserved)/gi,
      /powered[\s\-_]*by[\s\S]*?(?:\.|<)/gi,
      /(?:terms|privacy)[\s\-_]*(?:of[\s\-_]*(?:use|service)|policy)/gi
    ],
    social: [
      /(?:share|like|tweet|follow)[\s\-_]*(?:us|this|on)?/gi,
      /(?:facebook|twitter|instagram|linkedin|youtube)/gi,
      /\d+[\s\-_]*(?:likes?|shares?|comments?|views?)/gi
    ]
  };

  static classifyContent(content: string, selector?: string): ContentSegment {
    const id = `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Basic content analysis
    const wordCount = content.trim().split(/\s+/).length;
    const containsNumbers = /\d/.test(content);
    const containsDates = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/.test(content);
    
    // Noise detection
    const noiseClassification = this.detectNoise(content);
    
    // Relevance scoring
    const relevance = this.scoreRelevance(content, noiseClassification.isNoise);
    const confidence = this.calculateConfidence(content, relevance, noiseClassification.removalConfidence);
    
    return {
      id,
      content,
      relevance,
      confidence,
      position: {
        selector,
        textPosition: 0 // Would be calculated based on original position
      },
      metadata: {
        wordCount,
        containsNumbers,
        containsDates,
        language: this.detectLanguage(content)
      },
      noiseClassification
    };
  }

  private static detectNoise(content: string): {
    isNoise: boolean;
    noiseTypes: NoiseType[];
    removalConfidence: number;
  } {
    const noiseTypes: NoiseType[] = [];
    let noiseScore = 0;

    // Check against noise patterns
    Object.entries(this.NOISE_PATTERNS).forEach(([type, patterns]) => {
      const matchCount = patterns.reduce((count, pattern) => {
        return count + (content.match(pattern) || []).length;
      }, 0);
      
      if (matchCount > 0) {
        noiseTypes.push(type as NoiseType);
        noiseScore += matchCount * 0.2;
      }
    });

    // Additional heuristics
    if (content.length < 10) {
      noiseTypes.push(NoiseType.BOILERPLATE);
      noiseScore += 0.3;
    }

    if (content.split(/\s+/).filter(word => word.length > 2).length < 3) {
      noiseTypes.push(NoiseType.BOILERPLATE);
      noiseScore += 0.2;
    }

    const isNoise = noiseScore > 0.5;
    const removalConfidence = Math.min(noiseScore, 1);

    return { isNoise, noiseTypes, removalConfidence };
  }

  private static scoreRelevance(content: string, isNoise: boolean): ContentRelevance {
    if (isNoise) return ContentRelevance.NOISE;

    // Simple relevance scoring based on content characteristics
    let relevanceScore = 0.5; // Base score

    // Boost for numerical data
    if (/\$?\d+(?:\.\d+)?%?/.test(content)) relevanceScore += 0.2;
    
    // Boost for temporal data
    if (/\b(?:today|yesterday|tomorrow|\d+\s+(?:days?|weeks?|months?|years?)\s+ago)\b/i.test(content)) {
      relevanceScore += 0.15;
    }

    // Boost for structured content
    if (content.includes(':') && content.split(':').length > 1) relevanceScore += 0.1;

    // Penalty for very short content
    if (content.length < 20) relevanceScore -= 0.2;

    // Convert to enum
    if (relevanceScore >= 0.8) return ContentRelevance.HIGHLY_RELEVANT;
    if (relevanceScore >= 0.6) return ContentRelevance.MODERATELY_RELEVANT;
    return ContentRelevance.LOW_RELEVANCE;
  }

  private static calculateConfidence(
    content: string, 
    relevance: ContentRelevance,
    noiseConfidence: number
  ): number {
    let confidence = 0.5;

    // Adjust based on relevance
    switch (relevance) {
      case ContentRelevance.HIGHLY_RELEVANT:
        confidence = 0.9;
        break;
      case ContentRelevance.MODERATELY_RELEVANT:
        confidence = 0.7;
        break;
      case ContentRelevance.LOW_RELEVANCE:
        confidence = 0.4;
        break;
      case ContentRelevance.NOISE:
        confidence = 1 - noiseConfidence;
        break;
    }

    // Adjust based on content length and structure
    if (content.length > 50 && content.split(/\s+/).length > 5) {
      confidence += 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private static detectLanguage(content: string): string {
    // Simple English detection heuristic
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'on', 'are'];
    const words = content.toLowerCase().split(/\s+/).slice(0, 50);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    
    return englishWordCount > words.length * 0.1 ? 'en' : 'unknown';
  }
}

class DataNormalizer {
  static normalizeValue(value: string, type: DataNormalization): NormalizedData {
    const id = `norm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      switch (type) {
        case DataNormalization.CURRENCY:
          return this.normalizeCurrency(id, value);
        case DataNormalization.PERCENTAGE:
          return this.normalizePercentage(id, value);
        case DataNormalization.DATE_TIME:
          return this.normalizeDateTime(id, value);
        case DataNormalization.MEASUREMENT:
          return this.normalizeMeasurement(id, value);
        case DataNormalization.NUMBERS:
          return this.normalizeNumber(id, value);
        default:
          return this.normalizeText(id, value);
      }
    } catch (error) {
      return {
        id,
        originalValue: value,
        normalizedValue: value,
        normalizationType: type,
        confidence: 0,
        metadata: {},
      };
    }
  }

  private static normalizeCurrency(id: string, value: string): NormalizedData {
    const currencyRegex = /([£$€¥])?([\d,]+\.?\d*)\s*([A-Z]{3})?/i;
    const match = value.match(currencyRegex);
    
    if (!match) throw new Error('No currency pattern found');
    
    const symbol = match[1];
    const amount = parseFloat(match[2].replace(/,/g, ''));
    const code = match[3];
    
    let currency = 'USD'; // Default
    if (symbol === '£') currency = 'GBP';
    if (symbol === '€') currency = 'EUR';
    if (symbol === '¥') currency = 'JPY';
    if (code) currency = code.toUpperCase();
    
    return {
      id,
      originalValue: value,
      normalizedValue: amount,
      normalizationType: DataNormalization.CURRENCY,
      confidence: match ? 0.9 : 0.5,
      unit: currency,
      metadata: {
        currency,
        precision: (amount % 1 === 0) ? 0 : 2
      }
    };
  }

  private static normalizePercentage(id: string, value: string): NormalizedData {
    const percentRegex = /([\d.,]+)\s*%/;
    const match = value.match(percentRegex);
    
    if (!match) throw new Error('No percentage pattern found');
    
    const percent = parseFloat(match[1].replace(/,/g, ''));
    
    return {
      id,
      originalValue: value,
      normalizedValue: percent / 100,
      normalizationType: DataNormalization.PERCENTAGE,
      confidence: 0.95,
      unit: 'percent',
      metadata: {
        precision: 4
      }
    };
  }

  private static normalizeDateTime(id: string, value: string): NormalizedData {
    // Try multiple date formats
    const dateFormats = [
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{2})\/(\d{2})\/(\d{4})/,
      /(\d{2})-(\d{2})-(\d{4})/,
    ];

    let normalizedDate: Date | null = null;
    let confidence = 0;

    for (const format of dateFormats) {
      const match = value.match(format);
      if (match) {
        normalizedDate = new Date(value);
        if (!isNaN(normalizedDate.getTime())) {
          confidence = 0.9;
          break;
        }
      }
    }

    if (!normalizedDate) {
      normalizedDate = new Date(value);
      confidence = isNaN(normalizedDate.getTime()) ? 0 : 0.7;
    }

    return {
      id,
      originalValue: value,
      normalizedValue: normalizedDate.toISOString(),
      normalizationType: DataNormalization.DATE_TIME,
      confidence,
      metadata: {
        timezone: 'UTC'
      }
    };
  }

  private static normalizeMeasurement(id: string, value: string): NormalizedData {
    const measurementRegex = /([\d.,]+)\s*([a-zA-Z]+)/;
    const match = value.match(measurementRegex);
    
    if (!match) throw new Error('No measurement pattern found');
    
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const unit = match[2].toLowerCase();
    
    return {
      id,
      originalValue: value,
      normalizedValue: amount,
      normalizationType: DataNormalization.MEASUREMENT,
      confidence: 0.85,
      unit,
      metadata: {
        conversionApplied: 'none'
      }
    };
  }

  private static normalizeNumber(id: string, value: string): NormalizedData {
    const numberRegex = /[\d.,]+/;
    const match = value.match(numberRegex);
    
    if (!match) throw new Error('No number pattern found');
    
    const number = parseFloat(match[0].replace(/,/g, ''));
    
    return {
      id,
      originalValue: value,
      normalizedValue: number,
      normalizationType: DataNormalization.NUMBERS,
      confidence: 0.8,
      metadata: {
        precision: (number % 1 === 0) ? 0 : 2
      }
    };
  }

  private static normalizeText(id: string, value: string): NormalizedData {
    return {
      id,
      originalValue: value,
      normalizedValue: value.trim(),
      normalizationType: DataNormalization.TEXT,
      confidence: 1,
      metadata: {}
    };
  }
}

class TemporalExtractor {
  static extractTemporalData(content: string): TemporalData[] {
    const temporalExpressions = [
      // Absolute dates
      { 
        pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/g, 
        precision: 'day' as const,
        parse: (match: RegExpMatchArray) => new Date(`${match[1]}-${match[2]}-${match[3]}`)
      },
      // Relative dates
      {
        pattern: /\b(\d+)\s+(days?|weeks?|months?|years?)\s+ago\b/gi,
        precision: 'day' as const,
        parse: (match: RegExpMatchArray) => {
          const amount = parseInt(match[1]);
          const unit = match[2].toLowerCase().replace(/s$/, '');
          const date = new Date();
          
          switch (unit) {
            case 'day': date.setDate(date.getDate() - amount); break;
            case 'week': date.setDate(date.getDate() - (amount * 7)); break;
            case 'month': date.setMonth(date.getMonth() - amount); break;
            case 'year': date.setFullYear(date.getFullYear() - amount); break;
          }
          
          return date;
        }
      },
      // Context words
      {
        pattern: /\b(today|yesterday|tomorrow)\b/gi,
        precision: 'day' as const,
        parse: (match: RegExpMatchArray) => {
          const date = new Date();
          switch (match[1].toLowerCase()) {
            case 'yesterday': date.setDate(date.getDate() - 1); break;
            case 'tomorrow': date.setDate(date.getDate() + 1); break;
          }
          return date;
        }
      }
    ];

    const results: TemporalData[] = [];
    
    temporalExpressions.forEach(expr => {
      let match;
      while ((match = expr.pattern.exec(content)) !== null) {
        try {
          const extractedDate = expr.parse(match);
          if (!isNaN(extractedDate.getTime())) {
            results.push({
              id: `temporal-${Date.now()}-${results.length}`,
              extractedDate,
              originalText: match[0],
              confidence: 0.8,
              precision: expr.precision,
              relative: {
                isRelative: expr.pattern.source.includes('ago') || ['today', 'yesterday', 'tomorrow'].includes(match[1]?.toLowerCase()),
                referencePoint: new Date(),
                description: match[0]
              }
            });
          }
        } catch (error) {
          // Skip invalid temporal expressions
        }
      }
    });

    return results;
  }
}

/**
 * Main Web Scraping Enhancement Service
 */
export class WebScrapingEnhancementService {
  private aiManager: AIManager;
  private factExtractor: FactExtractionService;

  constructor(aiManager?: AIManager) {
    this.aiManager = aiManager || getGlobalAIManager();
    this.factExtractor = new FactExtractionService(this.aiManager);
  }

  /**
   * Enhance single web scraping result
   */
  async enhanceScrapingData(
    input: z.infer<typeof ScrapingEnhancementInputSchema>
  ): Promise<EnhancedScrapingResult> {
    const startTime = Date.now();
    
    try {
      const validatedInput = ScrapingEnhancementInputSchema.parse(input);
      
      // Step 1: Content segmentation and noise removal
      const segments = await this.segmentContent(validatedInput.rawContent);
      const cleanedSegments = validatedInput.enhancementOptions.removeNoise 
        ? segments.filter(segment => segment.relevance !== ContentRelevance.NOISE)
        : segments;

      // Step 2: Data normalization
      let normalizedData: NormalizedData[] = [];
      if (validatedInput.enhancementOptions.normalizeData) {
        normalizedData = await this.normalizeContent(cleanedSegments);
      }

      // Step 3: Temporal data extraction
      let temporalData: TemporalData[] = [];
      if (validatedInput.enhancementOptions.extractTemporal) {
        temporalData = this.extractTemporal(validatedInput.rawContent);
      }

      // Step 4: Fact extraction using AI
      const cleanedContent = cleanedSegments
        .filter(s => s.relevance !== ContentRelevance.NOISE)
        .map(s => s.content)
        .join('\n');

      let extractedFacts: ExtractedFact[] = [];
      if (cleanedContent.length > 10) {
        const factExtractionResult = await this.factExtractor.extractFacts({
          content: cleanedContent,
          contentType: ContentType.HTML,
          sourceUrl: validatedInput.sourceUrl,
          expectedFacts: validatedInput.context?.expectedDataTypes?.map(type => type.toString()),
          qualityThreshold: 0.6
        });
        
        extractedFacts = factExtractionResult.facts;
      }

      // Step 5: Content summary (if requested)
      let contentSummary;
      if (validatedInput.enhancementOptions.summarizeContent) {
        contentSummary = await this.generateContentSummary(cleanedContent, validatedInput.targetInformation);
      }

      // Step 6: Quality metrics calculation
      const qualityMetrics = this.calculateQualityMetrics(
        segments, 
        normalizedData, 
        temporalData, 
        extractedFacts
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        sourceUrl: validatedInput.sourceUrl,
        processingTime,
        enhancement: {
          originalSize: validatedInput.rawContent.length,
          cleanedSize: cleanedContent.length,
          noiseRemoved: segments.length - cleanedSegments.length,
          relevantSegments: cleanedSegments.filter(s => 
            s.relevance === ContentRelevance.HIGHLY_RELEVANT || 
            s.relevance === ContentRelevance.MODERATELY_RELEVANT
          ).length
        },
        contentSegments: cleanedSegments,
        normalizedData,
        temporalData,
        extractedFacts,
        contentSummary,
        qualityMetrics
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        sourceUrl: input.sourceUrl || 'unknown',
        processingTime,
        enhancement: {
          originalSize: input.rawContent.length,
          cleanedSize: 0,
          noiseRemoved: 0,
          relevantSegments: 0
        },
        contentSegments: [],
        normalizedData: [],
        temporalData: [],
        extractedFacts: [],
        qualityMetrics: {
          overallRelevance: 0,
          dataCompleteness: 0,
          temporalAccuracy: 0,
          normalizationSuccess: 0
        },
        error: error instanceof Error ? error.message : 'Unknown enhancement error'
      };
    }
  }

  /**
   * Enhance multiple scraping results with cross-source analysis
   */
  async enhanceBatch(
    input: z.infer<typeof BatchEnhancementInputSchema>
  ): Promise<BatchEnhancementResult> {
    const startTime = Date.now();
    
    try {
      const validatedInput = BatchEnhancementInputSchema.parse(input);
      
      // Process each scraping result
      const results = await Promise.all(
        validatedInput.scrapings.map(scraping => this.enhanceScrapingData(scraping))
      );

      // Cross-source analysis
      const crossSourceAnalysis = await this.performCrossSourceAnalysis(
        results, 
        validatedInput.deduplicationStrategy
      );

      // Aggregate metrics
      const aggregatedMetrics = this.calculateAggregatedMetrics(results);

      const processingTime = Date.now() - startTime;

      return {
        success: results.some(r => r.success),
        results,
        crossSourceAnalysis,
        aggregatedMetrics,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        results: [],
        crossSourceAnalysis: {
          duplicatesFound: 0,
          correlations: [],
          inconsistencies: []
        },
        aggregatedMetrics: {
          totalNoiseRemoved: 0,
          avgRelevanceScore: 0,
          uniqueFactsExtracted: 0,
          temporalCoverage: {}
        },
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown batch enhancement error'
      };
    }
  }

  private async segmentContent(content: string): Promise<ContentSegment[]> {
    // Simple content segmentation by paragraphs and significant breaks
    const segments = content
      .split(/\n\s*\n|\. {2,}|<\/p>|<\/div>|<br\s*\/?>/)
      .filter(segment => segment.trim().length > 5)
      .map(segment => ContentCleaner.classifyContent(segment.trim()));

    return segments;
  }

  private async normalizeContent(segments: ContentSegment[]): Promise<NormalizedData[]> {
    const normalizedData: NormalizedData[] = [];

    for (const segment of segments) {
      // Detect potential data types and normalize
      if (segment.metadata.containsNumbers) {
        // Try currency normalization
        if (/[\$£€¥]/.test(segment.content)) {
          try {
            const normalized = DataNormalizer.normalizeValue(segment.content, DataNormalization.CURRENCY);
            normalizedData.push(normalized);
          } catch (error) {
            // Continue to other normalization attempts
          }
        }

        // Try percentage normalization
        if (/%/.test(segment.content)) {
          try {
            const normalized = DataNormalizer.normalizeValue(segment.content, DataNormalization.PERCENTAGE);
            normalizedData.push(normalized);
          } catch (error) {
            // Continue to other normalization attempts
          }
        }

        // Try general number normalization
        try {
          const normalized = DataNormalizer.normalizeValue(segment.content, DataNormalization.NUMBERS);
          normalizedData.push(normalized);
        } catch (error) {
          // Continue to other normalization attempts
        }
      }

      if (segment.metadata.containsDates) {
        try {
          const normalized = DataNormalizer.normalizeValue(segment.content, DataNormalization.DATE_TIME);
          normalizedData.push(normalized);
        } catch (error) {
          // Continue to other normalization attempts
        }
      }
    }

    return normalizedData;
  }

  private extractTemporal(content: string): TemporalData[] {
    return TemporalExtractor.extractTemporalData(content);
  }

  private async generateContentSummary(
    content: string, 
    targetInformation?: string
  ): Promise<{ mainTopics: string[]; keyFindings: string[]; confidenceScore: number }> {
    try {
      const summaryPrompt = this.createSummaryPrompt(content, targetInformation);
      
      const aiResponse = await this.aiManager.generateResponse({
        content: summaryPrompt,
        role: 'user',
        maxTokens: 500,
        temperature: 0.2,
        context: {
          system: createMonitorSystemPrompt({
            task: 'analyze',
            domain: 'content-summarization',
            instructions: 'Provide concise content summary with key topics and findings'
          })
        }
      });

      if (!aiResponse.success) {
        throw new Error(`AI summary failed: ${aiResponse.error}`);
      }

      // Parse AI response
      const parsed = JSON.parse(aiResponse.content);
      return {
        mainTopics: parsed.topics || [],
        keyFindings: parsed.findings || [],
        confidenceScore: parsed.confidence || 0.5
      };

    } catch (error) {
      return {
        mainTopics: ['Content analysis unavailable'],
        keyFindings: ['Unable to generate summary'],
        confidenceScore: 0
      };
    }
  }

  private createSummaryPrompt(content: string, targetInformation?: string): string {
    let prompt = `Analyze and summarize the following web content:\n\n${content.substring(0, 1500)}`;
    
    if (targetInformation) {
      prompt += `\n\nFocus specifically on: ${targetInformation}`;
    }
    
    prompt += `\n\nReturn a JSON object with:
{
  "topics": ["main topic 1", "main topic 2", ...],
  "findings": ["key finding 1", "key finding 2", ...],
  "confidence": 0.8
}

Focus on factual information, numerical data, and actionable insights.`;

    return prompt;
  }

  private calculateQualityMetrics(
    segments: ContentSegment[],
    normalizedData: NormalizedData[],
    temporalData: TemporalData[],
    extractedFacts: ExtractedFact[]
  ): {
    overallRelevance: number;
    dataCompleteness: number;
    temporalAccuracy: number;
    normalizationSuccess: number;
  } {
    // Overall relevance based on segment classification
    const totalSegments = segments.length;
    const relevantSegments = segments.filter(s => 
      s.relevance === ContentRelevance.HIGHLY_RELEVANT || 
      s.relevance === ContentRelevance.MODERATELY_RELEVANT
    ).length;
    const overallRelevance = totalSegments > 0 ? relevantSegments / totalSegments : 0;

    // Data completeness based on extraction success
    const expectedDataPoints = segments.filter(s => 
      s.metadata.containsNumbers || s.metadata.containsDates
    ).length;
    const extractedDataPoints = normalizedData.length + temporalData.length + extractedFacts.length;
    const dataCompleteness = expectedDataPoints > 0 ? Math.min(extractedDataPoints / expectedDataPoints, 1) : 0;

    // Temporal accuracy based on confidence scores
    const temporalAccuracy = temporalData.length > 0 
      ? temporalData.reduce((sum, t) => sum + t.confidence, 0) / temporalData.length 
      : 0;

    // Normalization success based on confidence scores
    const normalizationSuccess = normalizedData.length > 0
      ? normalizedData.reduce((sum, n) => sum + n.confidence, 0) / normalizedData.length
      : 0;

    return {
      overallRelevance: Math.round(overallRelevance * 100) / 100,
      dataCompleteness: Math.round(dataCompleteness * 100) / 100,
      temporalAccuracy: Math.round(temporalAccuracy * 100) / 100,
      normalizationSuccess: Math.round(normalizationSuccess * 100) / 100
    };
  }

  private async performCrossSourceAnalysis(
    results: EnhancedScrapingResult[],
    deduplicationStrategy: 'strict' | 'fuzzy' | 'none'
  ): Promise<{
    duplicatesFound: number;
    correlations: Array<{
      sources: string[];
      similarity: number;
      matchType: 'exact' | 'fuzzy' | 'semantic';
    }>;
    inconsistencies: Array<{
      sources: string[];
      conflictType: string;
      description: string;
    }>;
  }> {
    if (deduplicationStrategy === 'none') {
      return {
        duplicatesFound: 0,
        correlations: [],
        inconsistencies: []
      };
    }

    const correlations: Array<{
      sources: string[];
      similarity: number;
      matchType: 'exact' | 'fuzzy' | 'semantic';
    }> = [];

    const inconsistencies: Array<{
      sources: string[];
      conflictType: string;
      description: string;
    }> = [];

    // Simple duplicate detection for similar facts
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const result1 = results[i];
        const result2 = results[j];

        // Compare extracted facts
        const similarity = this.calculateFactSimilarity(
          result1.extractedFacts,
          result2.extractedFacts
        );

        if (similarity > 0.7) {
          correlations.push({
            sources: [result1.sourceUrl, result2.sourceUrl],
            similarity: Math.round(similarity * 100) / 100,
            matchType: similarity > 0.95 ? 'exact' : 'fuzzy'
          });
        }

        // Detect inconsistencies in normalized data
        const conflicts = this.detectDataConflicts(result1, result2);
        inconsistencies.push(...conflicts);
      }
    }

    return {
      duplicatesFound: correlations.filter(c => c.similarity > 0.9).length,
      correlations,
      inconsistencies
    };
  }

  private calculateFactSimilarity(facts1: ExtractedFact[], facts2: ExtractedFact[]): number {
    if (facts1.length === 0 && facts2.length === 0) return 1;
    if (facts1.length === 0 || facts2.length === 0) return 0;

    let matchingFacts = 0;
    const totalFacts = Math.max(facts1.length, facts2.length);

    for (const fact1 of facts1) {
      for (const fact2 of facts2) {
        if (fact1.type === fact2.type && this.valuesAreSimilar(fact1.value, fact2.value)) {
          matchingFacts++;
          break;
        }
      }
    }

    return matchingFacts / totalFacts;
  }

  private valuesAreSimilar(value1: any, value2: any): boolean {
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return Math.abs(value1 - value2) / Math.max(value1, value2) < 0.05; // 5% tolerance
    }
    
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.toLowerCase().trim() === value2.toLowerCase().trim();
    }

    return value1 === value2;
  }

  private detectDataConflicts(result1: EnhancedScrapingResult, result2: EnhancedScrapingResult): Array<{
    sources: string[];
    conflictType: string;
    description: string;
  }> {
    const conflicts: Array<{
      sources: string[];
      conflictType: string;
      description: string;
    }> = [];

    // Compare normalized data for conflicts
    for (const data1 of result1.normalizedData) {
      for (const data2 of result2.normalizedData) {
        if (data1.normalizationType === data2.normalizationType &&
            data1.unit === data2.unit &&
            !this.valuesAreSimilar(data1.normalizedValue, data2.normalizedValue)) {
          
          conflicts.push({
            sources: [result1.sourceUrl, result2.sourceUrl],
            conflictType: 'value_mismatch',
            description: `Different ${data1.normalizationType} values: ${data1.normalizedValue} vs ${data2.normalizedValue}`
          });
        }
      }
    }

    return conflicts;
  }

  private calculateAggregatedMetrics(results: EnhancedScrapingResult[]): {
    totalNoiseRemoved: number;
    avgRelevanceScore: number;
    uniqueFactsExtracted: number;
    temporalCoverage: {
      startDate?: Date;
      endDate?: Date;
      timeSpan?: string;
    };
  } {
    const totalNoiseRemoved = results.reduce((sum, r) => sum + r.enhancement.noiseRemoved, 0);
    
    const avgRelevanceScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.qualityMetrics.overallRelevance, 0) / results.length
      : 0;

    // Unique facts (simplified - just total count for now)
    const uniqueFactsExtracted = results.reduce((sum, r) => sum + r.extractedFacts.length, 0);

    // Temporal coverage
    const allDates = results.flatMap(r => r.temporalData.map(t => t.extractedDate));
    const startDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : undefined;
    const endDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : undefined;
    
    let timeSpan;
    if (startDate && endDate) {
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      timeSpan = diffDays > 0 ? `${diffDays} days` : 'Same day';
    }

    return {
      totalNoiseRemoved,
      avgRelevanceScore: Math.round(avgRelevanceScore * 100) / 100,
      uniqueFactsExtracted,
      temporalCoverage: {
        startDate,
        endDate,
        timeSpan
      }
    };
  }
}

// Utility functions for easy usage
export async function enhanceScrapingData(
  input: z.infer<typeof ScrapingEnhancementInputSchema>
): Promise<EnhancedScrapingResult> {
  const service = new WebScrapingEnhancementService();
  return await service.enhanceScrapingData(input);
}

export async function enhanceBatch(
  input: z.infer<typeof BatchEnhancementInputSchema>
): Promise<BatchEnhancementResult> {
  const service = new WebScrapingEnhancementService();
  return await service.enhanceBatch(input);
}

// Export validation schemas
// Schemas already exported above, removing duplicate exports