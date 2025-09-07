/**
 * AI-Powered Monitor Template Suggestion System
 * 
 * Generates intelligent monitor template suggestions based on user input patterns,
 * popular monitors, and domain expertise to help users create effective monitors.
 */

import { z } from 'zod';
import type { AIManager } from '../manager.js';
import { getGlobalAIManager } from '../manager.js';
import { createMonitorSystemPrompt } from '../index.js';
import { 
  classifyPrompt, 
  MonitorType, 
  EntityType, 
  ConditionType,
  MonitoringFrequency,
  type PromptClassificationResult 
} from './promptClassification.js';

// Core template types and enums
export enum TemplateCategory {
  FINANCE = 'finance',
  WEATHER = 'weather',
  SPORTS = 'sports',
  NEWS = 'news',
  TECHNOLOGY = 'technology',
  HEALTH = 'health',
  ECOMMERCE = 'ecommerce',
  SOCIAL_MEDIA = 'social_media',
  CRYPTOCURRENCY = 'cryptocurrency',
  STOCKS = 'stocks',
  GENERAL = 'general'
}

export enum TemplatePopularity {
  VERY_POPULAR = 'very_popular',     // Top 10% of templates
  POPULAR = 'popular',               // Top 25% of templates
  COMMON = 'common',                 // Middle 50% of templates
  UNCOMMON = 'uncommon',             // Bottom 25% of templates
  EXPERIMENTAL = 'experimental'      // New or rarely used templates
}

export enum TemplateEffectiveness {
  HIGHLY_EFFECTIVE = 'highly_effective',   // >90% success rate
  EFFECTIVE = 'effective',                 // 70-90% success rate
  MODERATELY_EFFECTIVE = 'moderately_effective', // 50-70% success rate
  NEEDS_IMPROVEMENT = 'needs_improvement', // 30-50% success rate
  EXPERIMENTAL = 'experimental'            // <30% success rate or insufficient data
}

// Input schemas
export const TemplateSuggestionInputSchema = z.object({
  userInput: z.string().min(3, 'User input must be at least 3 characters'),
  userContext: z.object({
    userId: z.string().optional(),
    previousMonitors: z.array(z.object({
      type: z.nativeEnum(MonitorType),
      category: z.nativeEnum(TemplateCategory),
      success: z.boolean(),
      frequency: z.nativeEnum(MonitoringFrequency)
    })).optional(),
    preferences: z.object({
      preferredCategories: z.array(z.nativeEnum(TemplateCategory)).optional(),
      complexityLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
      frequencyPreference: z.nativeEnum(MonitoringFrequency).optional()
    }).optional()
  }).optional(),
  suggestionOptions: z.object({
    maxSuggestions: z.number().min(1).max(10).default(5),
    includeExamples: z.boolean().default(true),
    prioritizePopular: z.boolean().default(true),
    includeAdvanced: z.boolean().default(false),
    categoryFilter: z.array(z.nativeEnum(TemplateCategory)).optional()
  }).default({})
});

export const BatchSuggestionInputSchema = z.object({
  inputs: z.array(TemplateSuggestionInputSchema).min(1).max(5),
  correlateAcrossInputs: z.boolean().default(true),
  generateCombined: z.boolean().default(false)
});

// Template definition types
export interface MonitorTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: MonitorType;
  popularity: TemplatePopularity;
  effectiveness: TemplateEffectiveness;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  template: {
    prompt: string;
    expectedFacts: string[];
    triggerCondition: string;
    frequency: MonitoringFrequency;
    factType: 'number' | 'string' | 'boolean' | 'object';
  };
  variations: Array<{
    name: string;
    prompt: string;
    description: string;
  }>;
  examples: Array<{
    scenario: string;
    customization: string;
    expectedResult: string;
  }>;
  tags: string[];
  metadata: {
    createdAt: Date;
    lastUpdated: Date;
    usageCount: number;
    successRate: number;
    avgProcessingTime: number;
    commonErrors: string[];
  };
}

export interface TemplateSuggestion {
  template: MonitorTemplate;
  matchScore: number;
  matchReasons: string[];
  customization: {
    suggestedPrompt: string;
    suggestedFacts: string[];
    suggestedCondition: string;
    suggestedFrequency: MonitoringFrequency;
  };
  confidence: number;
  similarTemplates: Array<{
    templateId: string;
    similarity: number;
    reason: string;
  }>;
}

export interface TemplateSuggestionResult {
  success: boolean;
  userInput: string;
  classification: PromptClassificationResult;
  suggestions: TemplateSuggestion[];
  processingTime: number;
  insights: {
    detectedCategory: TemplateCategory;
    confidenceLevel: number;
    recommendedComplexity: 'beginner' | 'intermediate' | 'advanced';
    improvementTips: string[];
  };
  error?: string;
}

export interface BatchSuggestionResult {
  success: boolean;
  results: TemplateSuggestionResult[];
  combinedSuggestions?: TemplateSuggestion[];
  crossInputAnalysis: {
    commonPatterns: string[];
    suggestedCombinations: Array<{
      description: string;
      templates: string[];
      benefits: string[];
    }>;
  };
  processingTime: number;
  error?: string;
}

// Built-in template library
const BUILTIN_TEMPLATES: MonitorTemplate[] = [
  {
    id: 'stock-price-drop',
    name: 'Stock Price Drop Alert',
    description: 'Monitor when a specific stock drops below a threshold',
    category: TemplateCategory.STOCKS,
    type: MonitorType.THRESHOLD_CHANGE,
    popularity: TemplatePopularity.VERY_POPULAR,
    effectiveness: TemplateEffectiveness.HIGHLY_EFFECTIVE,
    complexity: 'beginner',
    template: {
      prompt: 'Alert me when {STOCK_SYMBOL} stock drops below ${THRESHOLD}',
      expectedFacts: ['{STOCK_SYMBOL} current price'],
      triggerCondition: 'current_price < {THRESHOLD}',
      frequency: MonitoringFrequency.EVERY_15_MINUTES,
      factType: 'number'
    },
    variations: [
      {
        name: 'Multiple Stock Alert',
        prompt: 'Alert me when any of {STOCK_LIST} drops below ${THRESHOLD}',
        description: 'Monitor multiple stocks with the same threshold'
      },
      {
        name: 'Percentage Drop',
        prompt: 'Alert me when {STOCK_SYMBOL} drops more than {PERCENTAGE}% from yesterday',
        description: 'Monitor percentage-based changes instead of absolute values'
      }
    ],
    examples: [
      {
        scenario: 'Apple stock monitoring',
        customization: 'Replace {STOCK_SYMBOL} with AAPL, {THRESHOLD} with 150',
        expectedResult: 'Alert when Apple stock drops below $150'
      },
      {
        scenario: 'Tesla stock monitoring',
        customization: 'Replace {STOCK_SYMBOL} with TSLA, {THRESHOLD} with 200',
        expectedResult: 'Alert when Tesla stock drops below $200'
      }
    ],
    tags: ['finance', 'investment', 'stocks', 'alerts', 'price-monitoring'],
    metadata: {
      createdAt: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-15'),
      usageCount: 1250,
      successRate: 0.94,
      avgProcessingTime: 850,
      commonErrors: ['Invalid stock symbol', 'Market hours restriction']
    }
  },
  {
    id: 'crypto-surge',
    name: 'Cryptocurrency Surge Alert',
    description: 'Monitor when cryptocurrency rises above a threshold',
    category: TemplateCategory.CRYPTOCURRENCY,
    type: MonitorType.THRESHOLD_CHANGE,
    popularity: TemplatePopularity.POPULAR,
    effectiveness: TemplateEffectiveness.EFFECTIVE,
    complexity: 'beginner',
    template: {
      prompt: 'Alert me when {CRYPTO_SYMBOL} rises above ${THRESHOLD}',
      expectedFacts: ['{CRYPTO_SYMBOL} current price'],
      triggerCondition: 'current_price > {THRESHOLD}',
      frequency: MonitoringFrequency.EVERY_5_MINUTES,
      factType: 'number'
    },
    variations: [
      {
        name: 'Percentage Surge',
        prompt: 'Alert me when {CRYPTO_SYMBOL} rises more than {PERCENTAGE}% in 24 hours',
        description: 'Monitor percentage-based increases over time periods'
      },
      {
        name: 'Multi-crypto Alert',
        prompt: 'Alert me when any of {CRYPTO_LIST} surges above their thresholds',
        description: 'Monitor multiple cryptocurrencies simultaneously'
      }
    ],
    examples: [
      {
        scenario: 'Bitcoin price monitoring',
        customization: 'Replace {CRYPTO_SYMBOL} with BTC, {THRESHOLD} with 50000',
        expectedResult: 'Alert when Bitcoin rises above $50,000'
      },
      {
        scenario: 'Ethereum monitoring',
        customization: 'Replace {CRYPTO_SYMBOL} with ETH, {THRESHOLD} with 3000',
        expectedResult: 'Alert when Ethereum rises above $3,000'
      }
    ],
    tags: ['cryptocurrency', 'bitcoin', 'ethereum', 'price-surge', 'alerts'],
    metadata: {
      createdAt: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-10'),
      usageCount: 890,
      successRate: 0.89,
      avgProcessingTime: 720,
      commonErrors: ['High volatility noise', 'Exchange rate differences']
    }
  },
  {
    id: 'weather-alert',
    name: 'Weather Condition Alert',
    description: 'Monitor specific weather conditions for a location',
    category: TemplateCategory.WEATHER,
    type: MonitorType.STATE_CHANGE,
    popularity: TemplatePopularity.POPULAR,
    effectiveness: TemplateEffectiveness.HIGHLY_EFFECTIVE,
    complexity: 'beginner',
    template: {
      prompt: 'Alert me when it will {WEATHER_CONDITION} in {LOCATION} tomorrow',
      expectedFacts: ['weather forecast for {LOCATION}'],
      triggerCondition: 'forecast includes {WEATHER_CONDITION}',
      frequency: MonitoringFrequency.TWICE_DAILY,
      factType: 'string'
    },
    variations: [
      {
        name: 'Temperature Alert',
        prompt: 'Alert me when temperature in {LOCATION} goes {ABOVE/BELOW} {TEMPERATURE}°F',
        description: 'Monitor temperature thresholds instead of conditions'
      },
      {
        name: 'Multi-day Weather',
        prompt: 'Alert me if it will {WEATHER_CONDITION} for {NUMBER} consecutive days in {LOCATION}',
        description: 'Monitor weather patterns over multiple days'
      }
    ],
    examples: [
      {
        scenario: 'Rain alert for commuting',
        customization: 'Replace {WEATHER_CONDITION} with rain, {LOCATION} with New York',
        expectedResult: 'Alert when rain is forecast for New York tomorrow'
      },
      {
        scenario: 'Snow alert for travel',
        customization: 'Replace {WEATHER_CONDITION} with snow, {LOCATION} with Denver',
        expectedResult: 'Alert when snow is forecast for Denver tomorrow'
      }
    ],
    tags: ['weather', 'forecast', 'rain', 'snow', 'temperature', 'location-based'],
    metadata: {
      createdAt: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-12'),
      usageCount: 2150,
      successRate: 0.91,
      avgProcessingTime: 950,
      commonErrors: ['Location not found', 'Forecast data unavailable']
    }
  },
  {
    id: 'news-mention',
    name: 'News Mention Alert',
    description: 'Monitor when specific topics or entities are mentioned in news',
    category: TemplateCategory.NEWS,
    type: MonitorType.PATTERN_DETECTION,
    popularity: TemplatePopularity.COMMON,
    effectiveness: TemplateEffectiveness.EFFECTIVE,
    complexity: 'intermediate',
    template: {
      prompt: 'Alert me when {TOPIC/COMPANY} is mentioned in {NEWS_SOURCE} news',
      expectedFacts: ['recent news articles mentioning {TOPIC/COMPANY}'],
      triggerCondition: 'new articles found',
      frequency: MonitoringFrequency.HOURLY,
      factType: 'object'
    },
    variations: [
      {
        name: 'Sentiment-based News',
        prompt: 'Alert me when {TOPIC} is mentioned {POSITIVELY/NEGATIVELY} in news',
        description: 'Monitor news mentions with sentiment analysis'
      },
      {
        name: 'Breaking News',
        prompt: 'Alert me immediately when breaking news about {TOPIC} is published',
        description: 'High-priority alerts for breaking news'
      }
    ],
    examples: [
      {
        scenario: 'Company news monitoring',
        customization: 'Replace {TOPIC/COMPANY} with Apple Inc, {NEWS_SOURCE} with major',
        expectedResult: 'Alert when Apple Inc is mentioned in major news sources'
      },
      {
        scenario: 'Technology trend monitoring',
        customization: 'Replace {TOPIC/COMPANY} with artificial intelligence, {NEWS_SOURCE} with tech',
        expectedResult: 'Alert when AI is mentioned in tech news'
      }
    ],
    tags: ['news', 'mentions', 'companies', 'topics', 'media-monitoring'],
    metadata: {
      createdAt: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-08'),
      usageCount: 654,
      successRate: 0.78,
      avgProcessingTime: 1200,
      commonErrors: ['Too many results', 'Source access issues', 'Language detection']
    }
  },
  {
    id: 'website-downtime',
    name: 'Website Availability Monitor',
    description: 'Monitor when a website goes down or becomes unavailable',
    category: TemplateCategory.TECHNOLOGY,
    type: MonitorType.STATE_CHANGE,
    popularity: TemplatePopularity.POPULAR,
    effectiveness: TemplateEffectiveness.HIGHLY_EFFECTIVE,
    complexity: 'beginner',
    template: {
      prompt: 'Alert me when {WEBSITE_URL} goes down or becomes unavailable',
      expectedFacts: ['{WEBSITE_URL} response status'],
      triggerCondition: 'status_code != 200',
      frequency: MonitoringFrequency.EVERY_5_MINUTES,
      factType: 'number'
    },
    variations: [
      {
        name: 'Response Time Alert',
        prompt: 'Alert me when {WEBSITE_URL} response time exceeds {THRESHOLD} seconds',
        description: 'Monitor website performance instead of just availability'
      },
      {
        name: 'Content Change Alert',
        prompt: 'Alert me when content on {WEBSITE_URL} changes',
        description: 'Monitor specific page content for changes'
      }
    ],
    examples: [
      {
        scenario: 'E-commerce site monitoring',
        customization: 'Replace {WEBSITE_URL} with https://mystore.com',
        expectedResult: 'Alert when mystore.com goes down'
      },
      {
        scenario: 'API endpoint monitoring',
        customization: 'Replace {WEBSITE_URL} with https://api.myservice.com/health',
        expectedResult: 'Alert when API health endpoint fails'
      }
    ],
    tags: ['website', 'uptime', 'availability', 'monitoring', 'downtime', 'performance'],
    metadata: {
      createdAt: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-14'),
      usageCount: 1890,
      successRate: 0.96,
      avgProcessingTime: 650,
      commonErrors: ['DNS resolution issues', 'Timeout errors']
    }
  },
  {
    id: 'sports-score',
    name: 'Sports Game Score Alert',
    description: 'Monitor live sports game scores and results',
    category: TemplateCategory.SPORTS,
    type: MonitorType.REAL_TIME_TRACKING,
    popularity: TemplatePopularity.COMMON,
    effectiveness: TemplateEffectiveness.EFFECTIVE,
    complexity: 'beginner',
    template: {
      prompt: 'Alert me with updates on {TEAM1} vs {TEAM2} {SPORT} game',
      expectedFacts: ['current score', 'game status'],
      triggerCondition: 'score changes or game ends',
      frequency: MonitoringFrequency.EVERY_5_MINUTES,
      factType: 'object'
    },
    variations: [
      {
        name: 'Team Season Tracker',
        prompt: 'Alert me when {TEAM} wins/loses any game this season',
        description: 'Monitor all games for a specific team'
      },
      {
        name: 'Fantasy Sports Alert',
        prompt: 'Alert me when {PLAYER} scores in {SPORT}',
        description: 'Monitor individual player performance'
      }
    ],
    examples: [
      {
        scenario: 'NFL game monitoring',
        customization: 'Replace {TEAM1} with Patriots, {TEAM2} with Jets, {SPORT} with NFL',
        expectedResult: 'Alert with Patriots vs Jets game updates'
      },
      {
        scenario: 'NBA game monitoring',
        customization: 'Replace {TEAM1} with Lakers, {TEAM2} with Warriors, {SPORT} with NBA',
        expectedResult: 'Alert with Lakers vs Warriors game updates'
      }
    ],
    tags: ['sports', 'games', 'scores', 'teams', 'live-updates'],
    metadata: {
      createdAt: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-11'),
      usageCount: 445,
      successRate: 0.83,
      avgProcessingTime: 1100,
      commonErrors: ['Game schedule changes', 'Score data delays']
    }
  }
];

/**
 * Template matching and suggestion engine
 */
class TemplateMatcher {
  
  /**
   * Find templates that match user input based on classification and context
   */
  static findMatchingTemplates(
    classification: PromptClassificationResult,
    userContext?: any,
    options: any = {}
  ): TemplateSuggestion[] {
    const suggestions: TemplateSuggestion[] = [];
    
    // Filter templates based on classification
    let candidateTemplates = BUILTIN_TEMPLATES.filter(template => {
      // Match monitor type
      if (template.type !== classification.monitorType) return false;
      
      // Filter by category if specified
      if (options.categoryFilter && !options.categoryFilter.includes(template.category)) {
        return false;
      }
      
      // Filter by complexity if not including advanced
      if (!options.includeAdvanced && template.complexity === 'advanced') {
        return false;
      }
      
      return true;
    });

    // Score and rank templates
    candidateTemplates.forEach(template => {
      const matchScore = this.calculateMatchScore(template, classification, userContext);
      
      if (matchScore > 0.3) { // Minimum threshold for suggestions
        const customization = this.generateCustomization(template, classification);
        const confidence = this.calculateConfidence(template, matchScore, classification);
        
        suggestions.push({
          template,
          matchScore,
          matchReasons: this.getMatchReasons(template, classification),
          customization,
          confidence,
          similarTemplates: this.findSimilarTemplates(template.id, candidateTemplates)
        });
      }
    });

    // Sort by match score (descending) and popularity
    suggestions.sort((a, b) => {
      const scoreWeight = 0.7;
      const popularityWeight = 0.3;
      
      const aScore = (a.matchScore * scoreWeight) + (this.getPopularityScore(a.template) * popularityWeight);
      const bScore = (b.matchScore * scoreWeight) + (this.getPopularityScore(b.template) * popularityWeight);
      
      return bScore - aScore;
    });

    return suggestions.slice(0, options.maxSuggestions || 5);
  }

  private static calculateMatchScore(
    template: MonitorTemplate,
    classification: PromptClassificationResult,
    userContext?: any
  ): number {
    let score = 0.5; // Base score
    
    // Monitor type match (strong weight)
    if (template.type === classification.monitorType) {
      score += 0.3;
    }
    
    // Entity type relevance
    classification.extractedEntities.forEach(entity => {
      if (this.entityMatchesTemplate(entity, template)) {
        score += 0.15;
      }
    });
    
    // Condition type relevance
    classification.extractedConditions.forEach(condition => {
      if (this.conditionMatchesTemplate(condition, template)) {
        score += 0.1;
      }
    });
    
    // User history preference boost
    if (userContext?.previousMonitors) {
      const categoryMatches = userContext.previousMonitors.filter(
        (m: any) => m.category === template.category && m.success
      ).length;
      
      if (categoryMatches > 0) {
        score += Math.min(categoryMatches * 0.05, 0.2);
      }
    }
    
    // Complexity preference match
    if (userContext?.preferences?.complexityLevel === template.complexity) {
      score += 0.1;
    }
    
    // Frequency preference match
    if (userContext?.preferences?.frequencyPreference === template.template.frequency) {
      score += 0.05;
    }
    
    return Math.min(score, 1);
  }

  private static entityMatchesTemplate(entity: any, template: MonitorTemplate): boolean {
    const entityType = entity.type;
    const templateCategory = template.category;
    
    const matches: Record<string, TemplateCategory[]> = {
      [EntityType.STOCK_SYMBOL]: [TemplateCategory.FINANCE, TemplateCategory.STOCKS],
      [EntityType.CRYPTOCURRENCY]: [TemplateCategory.CRYPTOCURRENCY, TemplateCategory.FINANCE],
      [EntityType.WEATHER_LOCATION]: [TemplateCategory.WEATHER],
      [EntityType.SPORTS_TEAM]: [TemplateCategory.SPORTS],
      [EntityType.COMPANY]: [TemplateCategory.NEWS, TemplateCategory.FINANCE, TemplateCategory.STOCKS],
      [EntityType.WEBSITE_URL]: [TemplateCategory.TECHNOLOGY],
      [EntityType.PRICE]: [TemplateCategory.ECOMMERCE, TemplateCategory.FINANCE],
      [EntityType.KEYWORD]: [TemplateCategory.NEWS, TemplateCategory.SOCIAL_MEDIA]
    };
    
    return matches[entityType]?.includes(templateCategory) || false;
  }

  private static conditionMatchesTemplate(condition: any, template: MonitorTemplate): boolean {
    const conditionType = condition.type;
    const templateType = template.type;
    
    const matches: Record<string, MonitorType[]> = {
      [ConditionType.THRESHOLD]: [MonitorType.THRESHOLD_CHANGE],
      [ConditionType.RANGE]: [MonitorType.THRESHOLD_CHANGE],
      [ConditionType.COMPARISON]: [MonitorType.THRESHOLD_CHANGE],
      [ConditionType.PATTERN]: [MonitorType.PATTERN_DETECTION],
      [ConditionType.CHANGE_DETECTION]: [MonitorType.STATE_CHANGE],
      [ConditionType.TIME_BASED]: [MonitorType.REAL_TIME_TRACKING]
    };
    
    return matches[conditionType]?.includes(templateType) || false;
  }

  private static generateCustomization(
    template: MonitorTemplate,
    classification: PromptClassificationResult
  ): {
    suggestedPrompt: string;
    suggestedFacts: string[];
    suggestedCondition: string;
    suggestedFrequency: MonitoringFrequency;
  } {
    let suggestedPrompt = template.template.prompt;
    let suggestedFacts = [...template.template.expectedFacts];
    let suggestedCondition = template.template.triggerCondition;
    let suggestedFrequency = classification.frequencyRecommendation?.frequency || template.template.frequency;
    
    // Replace template variables with extracted entities
    classification.extractedEntities.forEach(entity => {
      const placeholder = this.getPlaceholderForEntity(entity.type);
      if (placeholder && suggestedPrompt.includes(placeholder)) {
        suggestedPrompt = suggestedPrompt.replace(placeholder, entity.value);
        suggestedFacts = suggestedFacts.map(fact => 
          fact.replace(placeholder, entity.value)
        );
        suggestedCondition = suggestedCondition.replace(placeholder, entity.value);
      }
    });
    
    // Apply conditions
    classification.extractedConditions.forEach(condition => {
      const placeholder = this.getPlaceholderForCondition(condition.type);
      if (placeholder && suggestedPrompt.includes(placeholder)) {
        suggestedPrompt = suggestedPrompt.replace(placeholder, condition.value.toString());
        suggestedCondition = suggestedCondition.replace(placeholder, condition.value.toString());
      }
    });
    
    return {
      suggestedPrompt,
      suggestedFacts,
      suggestedCondition,
      suggestedFrequency
    };
  }

  private static getPlaceholderForEntity(entityType: EntityType): string | null {
    const placeholders: Record<EntityType, string> = {
      [EntityType.STOCK_SYMBOL]: '{STOCK_SYMBOL}',
      [EntityType.CRYPTOCURRENCY]: '{CRYPTO_SYMBOL}',
      [EntityType.WEATHER_LOCATION]: '{LOCATION}',
      [EntityType.SPORTS_TEAM]: '{TEAM1}',
      [EntityType.COMPANY]: '{TOPIC/COMPANY}',
      [EntityType.WEBSITE_URL]: '{WEBSITE_URL}',
      [EntityType.PRICE]: '{THRESHOLD}',
      [EntityType.KEYWORD]: '{TOPIC}'
    };
    
    return placeholders[entityType] || null;
  }

  private static getPlaceholderForCondition(conditionType: ConditionType): string | null {
    const placeholders: Record<ConditionType, string> = {
      [ConditionType.THRESHOLD]: '{THRESHOLD}',
      [ConditionType.COMPARISON]: '{THRESHOLD}',
      [ConditionType.RANGE]: '{THRESHOLD}',
      [ConditionType.PATTERN]: '{WEATHER_CONDITION}',
      [ConditionType.CHANGE_DETECTION]: '{PERCENTAGE}',
      [ConditionType.TIME_BASED]: '{NUMBER}'
    };
    
    return placeholders[conditionType] || null;
  }

  private static calculateConfidence(
    template: MonitorTemplate,
    matchScore: number,
    classification: PromptClassificationResult
  ): number {
    let confidence = matchScore * 0.6; // Base on match score
    
    // Boost for high-effectiveness templates
    switch (template.effectiveness) {
      case TemplateEffectiveness.HIGHLY_EFFECTIVE:
        confidence += 0.2;
        break;
      case TemplateEffectiveness.EFFECTIVE:
        confidence += 0.15;
        break;
      case TemplateEffectiveness.MODERATELY_EFFECTIVE:
        confidence += 0.1;
        break;
    }
    
    // Boost for high classification confidence
    if (classification.confidence > 0.8) {
      confidence += 0.1;
    }
    
    // Penalize experimental templates
    if (template.effectiveness === TemplateEffectiveness.EXPERIMENTAL) {
      confidence -= 0.1;
    }
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  private static getMatchReasons(
    template: MonitorTemplate,
    classification: PromptClassificationResult
  ): string[] {
    const reasons: string[] = [];
    
    if (template.type === classification.monitorType) {
      reasons.push(`Matches ${classification.monitorType} monitor type`);
    }
    
    if (template.effectiveness === TemplateEffectiveness.HIGHLY_EFFECTIVE) {
      reasons.push('Highly effective template with 90%+ success rate');
    }
    
    if (template.popularity === TemplatePopularity.VERY_POPULAR) {
      reasons.push('Very popular template used by many users');
    }
    
    const relevantEntities = classification.extractedEntities.filter(entity => 
      this.entityMatchesTemplate(entity, template)
    );
    
    if (relevantEntities.length > 0) {
      reasons.push(`Matches detected ${relevantEntities.map(e => e.type).join(', ')}`);
    }
    
    return reasons;
  }

  private static findSimilarTemplates(
    templateId: string,
    allTemplates: MonitorTemplate[]
  ): Array<{ templateId: string; similarity: number; reason: string }> {
    const currentTemplate = allTemplates.find(t => t.id === templateId);
    if (!currentTemplate) return [];
    
    return allTemplates
      .filter(t => t.id !== templateId)
      .map(template => {
        let similarity = 0;
        let reason = '';
        
        // Same category
        if (template.category === currentTemplate.category) {
          similarity += 0.4;
          reason = `Same category (${template.category})`;
        }
        
        // Same type
        if (template.type === currentTemplate.type) {
          similarity += 0.3;
          reason += reason ? ` and type (${template.type})` : `Same type (${template.type})`;
        }
        
        // Similar tags
        const commonTags = template.tags.filter(tag => currentTemplate.tags.includes(tag));
        if (commonTags.length > 0) {
          similarity += commonTags.length * 0.1;
          reason += reason ? ` with common tags` : `Common tags: ${commonTags.join(', ')}`;
        }
        
        return {
          templateId: template.id,
          similarity: Math.min(similarity, 1),
          reason: reason || 'Similar template'
        };
      })
      .filter(s => s.similarity > 0.2)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
  }

  private static getPopularityScore(template: MonitorTemplate): number {
    switch (template.popularity) {
      case TemplatePopularity.VERY_POPULAR: return 1.0;
      case TemplatePopularity.POPULAR: return 0.8;
      case TemplatePopularity.COMMON: return 0.6;
      case TemplatePopularity.UNCOMMON: return 0.4;
      case TemplatePopularity.EXPERIMENTAL: return 0.2;
      default: return 0.5;
    }
  }
}

/**
 * Main Template Suggestion Service
 */
export class TemplateSuggestionService {
  private aiManager: AIManager;

  constructor(aiManager?: AIManager) {
    this.aiManager = aiManager || getGlobalAIManager();
  }

  /**
   * Generate template suggestions based on user input
   */
  async generateSuggestions(
    input: z.infer<typeof TemplateSuggestionInputSchema>
  ): Promise<TemplateSuggestionResult> {
    const startTime = Date.now();
    
    try {
      const validatedInput = TemplateSuggestionInputSchema.parse(input);
      
      // Step 1: Classify the user input
      const classification = await classifyPrompt(validatedInput.userInput);
      
      if (!classification.success) {
        throw new Error(`Classification failed: ${classification.error}`);
      }
      
      // Step 2: Detect category and insights
      const insights = await this.generateInsights(
        validatedInput.userInput, 
        classification, 
        validatedInput.userContext
      );
      
      // Step 3: Find matching templates
      const suggestions = TemplateMatcher.findMatchingTemplates(
        classification,
        validatedInput.userContext,
        validatedInput.suggestionOptions
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        userInput: validatedInput.userInput,
        classification,
        suggestions,
        processingTime,
        insights
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        userInput: input.userInput,
        classification: {
          success: false,
          monitorType: MonitorType.STATE_MONITORING,
          extractedEntities: [],
          extractedConditions: [],
          confidence: 0,
          reasoning: '',
          improvementSuggestions: [],
          error: 'Classification failed'
        },
        suggestions: [],
        processingTime,
        insights: {
          detectedCategory: TemplateCategory.GENERAL,
          confidenceLevel: 0,
          recommendedComplexity: 'beginner',
          improvementTips: ['Please provide more specific details about what you want to monitor']
        },
        error: error instanceof Error ? error.message : 'Unknown suggestion error'
      };
    }
  }

  /**
   * Generate suggestions for multiple inputs with correlation analysis
   */
  async generateBatchSuggestions(
    input: z.infer<typeof BatchSuggestionInputSchema>
  ): Promise<BatchSuggestionResult> {
    const startTime = Date.now();
    
    try {
      const validatedInput = BatchSuggestionInputSchema.parse(input);
      
      // Process each input
      const results = await Promise.all(
        validatedInput.inputs.map(singleInput => this.generateSuggestions(singleInput))
      );
      
      // Cross-input analysis
      let crossInputAnalysis = {
        commonPatterns: [],
        suggestedCombinations: []
      };
      
      if (validatedInput.correlateAcrossInputs) {
        crossInputAnalysis = this.performCrossInputAnalysis(results);
      }
      
      // Combined suggestions (if requested)
      let combinedSuggestions;
      if (validatedInput.generateCombined) {
        combinedSuggestions = this.generateCombinedSuggestions(results);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: results.some(r => r.success),
        results,
        combinedSuggestions,
        crossInputAnalysis,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        results: [],
        crossInputAnalysis: {
          commonPatterns: [],
          suggestedCombinations: []
        },
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown batch suggestion error'
      };
    }
  }

  private async generateInsights(
    userInput: string,
    classification: PromptClassificationResult,
    userContext?: any
  ): Promise<{
    detectedCategory: TemplateCategory;
    confidenceLevel: number;
    recommendedComplexity: 'beginner' | 'intermediate' | 'advanced';
    improvementTips: string[];
  }> {
    // Detect category based on entities and keywords
    const detectedCategory = this.detectCategory(userInput, classification);
    
    // Calculate confidence level
    const confidenceLevel = classification.confidence;
    
    // Recommend complexity based on user input sophistication
    const recommendedComplexity = this.recommendComplexity(userInput, classification, userContext);
    
    // Generate improvement tips
    const improvementTips = this.generateImprovementTips(userInput, classification);
    
    return {
      detectedCategory,
      confidenceLevel,
      recommendedComplexity,
      improvementTips
    };
  }

  private detectCategory(userInput: string, classification: PromptClassificationResult): TemplateCategory {
    const input = userInput.toLowerCase();
    
    // Check for financial keywords
    if (/\b(stock|share|price|trading|investment|portfolio|market)\b/.test(input)) {
      if (/\b(bitcoin|ethereum|crypto|btc|eth|blockchain)\b/.test(input)) {
        return TemplateCategory.CRYPTOCURRENCY;
      }
      return TemplateCategory.STOCKS;
    }
    
    // Check for weather keywords
    if (/\b(weather|rain|snow|temperature|forecast|storm|wind|humid)\b/.test(input)) {
      return TemplateCategory.WEATHER;
    }
    
    // Check for sports keywords
    if (/\b(game|score|team|player|season|match|league|tournament)\b/.test(input)) {
      return TemplateCategory.SPORTS;
    }
    
    // Check for technology keywords
    if (/\b(website|url|server|api|endpoint|down|uptime|response)\b/.test(input)) {
      return TemplateCategory.TECHNOLOGY;
    }
    
    // Check for news keywords
    if (/\b(news|article|mention|reported|published|breaking|headline)\b/.test(input)) {
      return TemplateCategory.NEWS;
    }
    
    // Check for ecommerce keywords
    if (/\b(price|product|sale|discount|shopping|store|inventory)\b/.test(input)) {
      return TemplateCategory.ECOMMERCE;
    }
    
    return TemplateCategory.GENERAL;
  }

  private recommendComplexity(
    userInput: string,
    classification: PromptClassificationResult,
    userContext?: any
  ): 'beginner' | 'intermediate' | 'advanced' {
    let complexityScore = 0;
    
    // Check input sophistication
    if (userInput.length > 100) complexityScore += 1;
    if (classification.extractedConditions.length > 2) complexityScore += 1;
    if (classification.extractedEntities.length > 3) complexityScore += 1;
    
    // Check for advanced patterns
    if (/\b(percentage|ratio|correlation|aggregate|trend|pattern)\b/.test(userInput.toLowerCase())) {
      complexityScore += 2;
    }
    
    // Consider user history
    if (userContext?.preferences?.complexityLevel) {
      return userContext.preferences.complexityLevel;
    }
    
    if (userContext?.previousMonitors?.length > 5) {
      complexityScore += 1;
    }
    
    // Determine complexity level
    if (complexityScore >= 4) return 'advanced';
    if (complexityScore >= 2) return 'intermediate';
    return 'beginner';
  }

  private generateImprovementTips(
    userInput: string,
    classification: PromptClassificationResult
  ): string[] {
    const tips: string[] = [];
    
    if (classification.confidence < 0.6) {
      tips.push('Be more specific about what you want to monitor');
    }
    
    if (classification.extractedEntities.length === 0) {
      tips.push('Include specific entities like stock symbols, locations, or company names');
    }
    
    if (classification.extractedConditions.length === 0) {
      tips.push('Add clear conditions like thresholds, percentages, or time periods');
    }
    
    if (userInput.length < 20) {
      tips.push('Provide more context about when and why you want to be alerted');
    }
    
    if (!/\b(when|if|alert|notify|tell|inform)\b/.test(userInput.toLowerCase())) {
      tips.push('Use trigger words like "when", "if", or "alert me" to clarify your intent');
    }
    
    if (tips.length === 0) {
      tips.push('Your input looks good! The suggested templates should work well.');
    }
    
    return tips;
  }

  private performCrossInputAnalysis(results: TemplateSuggestionResult[]): {
    commonPatterns: string[];
    suggestedCombinations: Array<{
      description: string;
      templates: string[];
      benefits: string[];
    }>;
  } {
    const commonPatterns: string[] = [];
    const suggestedCombinations: Array<{
      description: string;
      templates: string[];
      benefits: string[];
    }> = [];
    
    // Find common categories
    const categories = results.flatMap(r => r.suggestions.map(s => s.template.category));
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count > 1) {
        commonPatterns.push(`Multiple monitors in ${category} category`);
      }
    });
    
    // Suggest combinations for related monitors
    if (categoryCount[TemplateCategory.STOCKS] && categoryCount[TemplateCategory.CRYPTOCURRENCY]) {
      suggestedCombinations.push({
        description: 'Investment Portfolio Monitor',
        templates: ['stock-price-drop', 'crypto-surge'],
        benefits: ['Comprehensive investment tracking', 'Diversified alert system', 'Market correlation insights']
      });
    }
    
    if (categoryCount[TemplateCategory.WEATHER] && categoryCount[TemplateCategory.SPORTS]) {
      suggestedCombinations.push({
        description: 'Weather-Dependent Activity Planner',
        templates: ['weather-alert', 'sports-score'],
        benefits: ['Activity planning optimization', 'Weather impact awareness', 'Event preparation alerts']
      });
    }
    
    return {
      commonPatterns,
      suggestedCombinations
    };
  }

  private generateCombinedSuggestions(results: TemplateSuggestionResult[]): TemplateSuggestion[] {
    // For now, return the top suggestions from each result
    const allSuggestions = results.flatMap(r => r.suggestions);
    
    // Remove duplicates and sort by confidence
    const uniqueSuggestions = allSuggestions.reduce((acc, suggestion) => {
      const existing = acc.find(s => s.template.id === suggestion.template.id);
      if (!existing || existing.confidence < suggestion.confidence) {
        acc = acc.filter(s => s.template.id !== suggestion.template.id);
        acc.push(suggestion);
      }
      return acc;
    }, [] as TemplateSuggestion[]);
    
    return uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /**
   * Get all available templates (for admin/debugging purposes)
   */
  getAllTemplates(): MonitorTemplate[] {
    return [...BUILTIN_TEMPLATES];
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): MonitorTemplate[] {
    return BUILTIN_TEMPLATES.filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): MonitorTemplate | undefined {
    return BUILTIN_TEMPLATES.find(template => template.id === id);
  }
}

// Utility functions for easy usage
export async function generateTemplateSuggestions(
  input: z.infer<typeof TemplateSuggestionInputSchema>
): Promise<TemplateSuggestionResult> {
  const service = new TemplateSuggestionService();
  return await service.generateSuggestions(input);
}

export async function generateBatchTemplateSuggestions(
  input: z.infer<typeof BatchSuggestionInputSchema>
): Promise<BatchSuggestionResult> {
  const service = new TemplateSuggestionService();
  return await service.generateBatchSuggestions(input);
}

export function getAllMonitorTemplates(): MonitorTemplate[] {
  return [...BUILTIN_TEMPLATES];
}

export function getTemplatesByCategory(category: TemplateCategory): MonitorTemplate[] {
  return BUILTIN_TEMPLATES.filter(template => template.category === category);
}

// Export validation schemas
// Schemas already exported above, removing duplicate exports