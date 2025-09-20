/**
 * Fact Extraction Service - Natural Language Processing for Monitor Creation
 * Core service for MonitorHub's Combination Intelligence
 */

import { aiService } from '../ai/index.js';
import type { ExtractedFacts, MonitorType } from '../ai/types.js';

export interface MonitorAnalysis {
  extractedFacts: ExtractedFacts;
  monitorType: MonitorType;
  suggestedFrequency: number;
  complexity: 'simple' | 'moderate' | 'complex';
  feasibility: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface FactValidation {
  isValid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

export class FactExtractionService {
  /**
   * Analyzes a natural language prompt and extracts complete monitor specification
   */
  async analyzeMonitorPrompt(prompt: string): Promise<MonitorAnalysis> {
    if (!prompt?.trim()) {
      throw new Error('Monitor prompt cannot be empty');
    }

    try {
      // Extract facts and classify monitor type in parallel
      const [extractedFacts, monitorType] = await Promise.all([
        aiService.extractFacts(prompt),
        aiService.classifyMonitorType(prompt)
      ]);

      // Get optimized frequency based on extracted facts
      const factNames = extractedFacts.facts.map(fact => fact.name);
      const suggestedFrequency = await aiService.optimizeFrequency(monitorType.type, factNames);

      // Analyze complexity and feasibility
      const complexity = this.determineComplexity(extractedFacts);
      const feasibility = this.assessFeasibility(extractedFacts);
      const recommendations = this.generateRecommendations(extractedFacts, monitorType, complexity);

      return {
        extractedFacts,
        monitorType,
        suggestedFrequency,
        complexity,
        feasibility,
        recommendations
      };
    } catch (error) {
      throw new Error(`Monitor analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates individual facts for data availability and clarity
   */
  async validateFact(factPrompt: string): Promise<FactValidation> {
    if (!factPrompt?.trim()) {
      return {
        isValid: false,
        confidence: 0,
        issues: ['Fact prompt cannot be empty'],
        suggestions: ['Provide a clear description of what you want to monitor']
      };
    }

    try {
      // Use AI to analyze fact clarity and feasibility
      const analysis = await aiService.extractFacts(`Analyze this single fact for monitoring: ${factPrompt}`);
      
      const issues: string[] = [];
      const suggestions: string[] = [];
      let confidence = analysis.confidence;

      // Check for common issues
      if (analysis.facts.length === 0) {
        issues.push('No extractable facts found');
        suggestions.push('Be more specific about what you want to monitor');
        confidence = 0;
      } else if (analysis.facts.length > 1) {
        issues.push('Multiple facts detected - consider breaking into separate monitors');
        suggestions.push('Focus on one specific fact per monitor for clarity');
        confidence *= 0.8;
      }

      // Check fact specificity
      const fact = analysis.facts[0];
      if (fact && fact.prompt.length < 10) {
        issues.push('Fact description is too vague');
        suggestions.push('Provide more specific details about what to monitor');
        confidence *= 0.7;
      }

      // Check data source availability
      if (fact && !fact.dataSourceType) {
        issues.push('Data source unclear');
        suggestions.push('Specify how this data can be obtained (API, website, calculation)');
        confidence *= 0.9;
      }

      return {
        isValid: issues.length === 0 && confidence > 0.6,
        confidence,
        issues,
        suggestions
      };
    } catch (error) {
      return {
        isValid: false,
        confidence: 0,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        suggestions: ['Check your prompt and try again']
      };
    }
  }

  /**
   * Suggests improvements for low-quality prompts
   */
  async improvPrompt(originalPrompt: string): Promise<{
    improvedPrompt: string;
    improvements: string[];
    confidence: number;
  }> {
    try {
      // First analyze the current prompt
      const analysis = await this.analyzeMonitorPrompt(originalPrompt);
      
      const improvements: string[] = [];
      let improvedPrompt = originalPrompt;

      // Check if facts are too vague
      if (analysis.extractedFacts.confidence < 0.7) {
        improvements.push('Made facts more specific and measurable');
        // In a real implementation, you might use AI to actually improve the prompt
        improvedPrompt = `${originalPrompt} (with specific thresholds and clear conditions)`;
      }

      // Check complexity
      if (analysis.complexity === 'complex') {
        improvements.push('Suggested breaking complex monitor into simpler components');
      }

      // Check feasibility
      if (analysis.feasibility === 'low') {
        improvements.push('Adjusted to use more readily available data sources');
      }

      return {
        improvedPrompt,
        improvements,
        confidence: Math.min(analysis.extractedFacts.confidence + 0.2, 1.0)
      };
    } catch (error) {
      throw new Error(`Prompt improvement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates template suggestions based on prompt analysis
   */
  async suggestTemplates(prompt: string): Promise<{
    category: string;
    templates: Array<{
      name: string;
      description: string;
      templatePrompt: string;
      complexity: string;
    }>;
  }> {
    try {
      const analysis = await this.analyzeMonitorPrompt(prompt);
      
      // Determine category based on facts and monitor type
      const category = this.categorizeMonitor(analysis);
      
      // Generate relevant templates
      const templates = this.getTemplatesForCategory(category, analysis.monitorType.type);
      
      return {
        category,
        templates
      };
    } catch (error) {
      // Fallback to general templates
      return {
        category: 'general',
        templates: [
          {
            name: 'Simple Threshold Monitor',
            description: 'Monitor when a value crosses a threshold',
            templatePrompt: 'Alert me when [metric] is [above/below] [threshold]',
            complexity: 'simple'
          },
          {
            name: 'Change Detection',
            description: 'Monitor changes over time',
            templatePrompt: 'Alert me when [metric] changes by more than [percentage] in [time period]',
            complexity: 'moderate'
          }
        ]
      };
    }
  }

  private determineComplexity(facts: ExtractedFacts): 'simple' | 'moderate' | 'complex' {
    const factCount = facts.facts.length;
    
    if (factCount === 1) return 'simple';
    if (factCount <= 3) return 'moderate';
    return 'complex';
  }

  private assessFeasibility(facts: ExtractedFacts): 'high' | 'medium' | 'low' {
    const factsWithDataSource = facts.facts.filter(f => f.dataSourceType).length;
    const ratio = factsWithDataSource / facts.facts.length;
    
    if (ratio >= 0.8 && facts.confidence >= 0.8) return 'high';
    if (ratio >= 0.5 && facts.confidence >= 0.6) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    facts: ExtractedFacts, 
    monitorType: MonitorType, 
    complexity: string
  ): string[] {
    const recommendations: string[] = [];

    if (facts.confidence < 0.7) {
      recommendations.push('Consider being more specific about what you want to monitor');
    }

    if (complexity === 'complex') {
      recommendations.push('Consider breaking this into multiple simpler monitors');
    }

    if (monitorType.type === 'historical_change' && facts.facts.length === 1) {
      recommendations.push('Historical change monitors work best with multiple data points');
    }

    if (facts.facts.some(f => !f.dataSourceType)) {
      recommendations.push('Specify data sources for better reliability');
    }

    return recommendations;
  }

  private categorizeMonitor(analysis: MonitorAnalysis): string {
    const factNames = analysis.extractedFacts.facts.map(f => f.name.toLowerCase());
    
    if (factNames.some(name => name.includes('stock') || name.includes('price') || name.includes('market'))) {
      return 'financial';
    }
    
    if (factNames.some(name => name.includes('weather') || name.includes('temperature'))) {
      return 'weather';
    }
    
    if (factNames.some(name => name.includes('social') || name.includes('mentions') || name.includes('followers'))) {
      return 'social';
    }
    
    if (analysis.monitorType.type === 'historical_change') {
      return 'trending';
    }
    
    return 'general';
  }

  private getTemplatesForCategory(category: string, monitorType: string) {
    const templates = {
      financial: [
        {
          name: 'Stock Price Alert',
          description: 'Monitor stock price thresholds',
          templatePrompt: 'Alert me when [STOCK_SYMBOL] stock price is below $[THRESHOLD]',
          complexity: 'simple'
        },
        {
          name: 'Market Movement',
          description: 'Track significant market changes',
          templatePrompt: 'Alert me when [STOCK_SYMBOL] drops more than [PERCENTAGE]% in [TIME_PERIOD]',
          complexity: 'moderate'
        }
      ],
      weather: [
        {
          name: 'Temperature Alert',
          description: 'Monitor temperature changes',
          templatePrompt: 'Alert me when temperature in [CITY] goes above [TEMPERATURE]°F',
          complexity: 'simple'
        }
      ],
      general: [
        {
          name: 'Custom Threshold',
          description: 'Monitor any metric threshold',
          templatePrompt: 'Alert me when [METRIC] is [CONDITION] [VALUE]',
          complexity: 'simple'
        }
      ]
    };

    return templates[category as keyof typeof templates] || templates.general;
  }
}

// Singleton instance
export const factExtractionService = new FactExtractionService();