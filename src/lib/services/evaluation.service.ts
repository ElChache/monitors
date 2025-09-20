/**
 * Evaluation Service - Combination Intelligence Engine
 * Handles current state and historical change evaluation logic
 */

import { aiService } from '../ai/index.js';
import type { EvaluationResult, ChangeResult } from '../ai/types.js';

export interface CombinationEvaluation {
  result: boolean;
  confidence: number;
  reasoning: string;
  factResults: Record<string, {
    value: unknown;
    evaluated: boolean;
    contribution: number;
  }>;
  logicExpression: string;
  evaluationTime: number;
}

export interface TemporalEvaluation {
  hasChanged: boolean;
  changeType: 'increase' | 'decrease' | 'volatility' | 'pattern' | 'none';
  significance: number;
  confidence: number;
  reasoning: string;
  previousValues: Record<string, unknown>;
  currentValues: Record<string, unknown>;
  changeDetails: Record<string, unknown>;
  evaluationTime: number;
}

export class EvaluationService {
  /**
   * Evaluates current state monitors using Combination Intelligence
   */
  async evaluateCurrentState(
    facts: Record<string, unknown>,
    logicExpression: string
  ): Promise<CombinationEvaluation> {
    const startTime = Date.now();
    
    try {
      // Use AI to evaluate the combination logic
      const aiResult = await aiService.evaluateState(facts, logicExpression);
      
      // Process individual fact contributions
      const factResults = this.analyzeFacts(facts, logicExpression, aiResult);
      
      return {
        result: aiResult.result,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        factResults,
        logicExpression,
        evaluationTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Current state evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluates historical change monitors using temporal logic
   */
  async evaluateHistoricalChange(
    currentValues: Record<string, unknown>,
    previousValues: Record<string, unknown>,
    changeCondition: string
  ): Promise<TemporalEvaluation> {
    const startTime = Date.now();
    
    try {
      // Use AI to evaluate temporal change
      const aiResult = await aiService.evaluateChange(currentValues, previousValues, changeCondition);
      
      // Determine change type based on the data
      const changeType = this.determineChangeType(currentValues, previousValues, aiResult);
      
      return {
        hasChanged: aiResult.hasChanged,
        changeType,
        significance: aiResult.significance,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        previousValues,
        currentValues,
        changeDetails: aiResult.changeDetails,
        evaluationTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Historical change evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluates combination of current state and historical change
   */
  async evaluateCombination(
    currentFacts: Record<string, unknown>,
    previousFacts: Record<string, unknown>,
    stateLogic: string,
    changeCondition?: string
  ): Promise<{
    stateEvaluation: CombinationEvaluation;
    changeEvaluation: TemporalEvaluation | null;
    combinedResult: boolean;
    confidence: number;
    reasoning: string;
  }> {
    try {
      // Evaluate current state
      const stateEvaluation = await this.evaluateCurrentState(currentFacts, stateLogic);
      
      // Evaluate change if condition provided
      let changeEvaluation: TemporalEvaluation | null = null;
      if (changeCondition && previousFacts) {
        changeEvaluation = await this.evaluateHistoricalChange(
          currentFacts, 
          previousFacts, 
          changeCondition
        );
      }
      
      // Combine results
      const combinedResult = this.combineEvaluations(stateEvaluation, changeEvaluation);
      const confidence = this.calculateCombinedConfidence(stateEvaluation, changeEvaluation);
      const reasoning = this.generateCombinedReasoning(stateEvaluation, changeEvaluation);
      
      return {
        stateEvaluation,
        changeEvaluation,
        combinedResult,
        confidence,
        reasoning
      };
    } catch (error) {
      throw new Error(`Combination evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates logic expressions for syntax and feasibility
   */
  validateLogicExpression(expression: string, availableFacts: string[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for basic syntax
    if (!expression.trim()) {
      issues.push('Logic expression cannot be empty');
      suggestions.push('Provide a Boolean logic expression like "fact1 AND fact2"');
      return { isValid: false, issues, suggestions };
    }
    
    // Check for balanced parentheses
    const openParens = (expression.match(/\(/g) || []).length;
    const closeParens = (expression.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push('Unbalanced parentheses in logic expression');
      suggestions.push('Ensure all opening parentheses have matching closing parentheses');
    }
    
    // Check for valid operators
    const validOperators = ['AND', 'OR', 'NOT', '&&', '||', '!'];
    const operators = expression.match(/\b(AND|OR|NOT|&&|\|\||!)\b/gi) || [];
    
    // Extract referenced facts
    const referencedFacts = this.extractReferencedFacts(expression);
    
    // Check if all referenced facts are available
    for (const fact of referencedFacts) {
      if (!availableFacts.includes(fact)) {
        issues.push(`Referenced fact "${fact}" is not available`);
        suggestions.push(`Available facts: ${availableFacts.join(', ')}`);
      }
    }
    
    // Check for logical structure
    if (referencedFacts.length === 0) {
      issues.push('No facts referenced in logic expression');
      suggestions.push('Reference at least one fact in your logic expression');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  private analyzeFacts(
    facts: Record<string, unknown>,
    logicExpression: string,
    aiResult: EvaluationResult
  ): Record<string, { value: unknown; evaluated: boolean; contribution: number }> {
    const factResults: Record<string, { value: unknown; evaluated: boolean; contribution: number }> = {};
    
    for (const [factName, value] of Object.entries(facts)) {
      factResults[factName] = {
        value,
        evaluated: true,
        contribution: this.calculateFactContribution(factName, logicExpression, aiResult.result)
      };
    }
    
    return factResults;
  }

  private calculateFactContribution(
    factName: string,
    logicExpression: string,
    overallResult: boolean
  ): number {
    // Simplified contribution calculation
    // In production, this would be more sophisticated
    const expressionLower = logicExpression.toLowerCase();
    if (expressionLower.includes(factName.toLowerCase())) {
      return overallResult ? 1.0 : -1.0;
    }
    return 0.0;
  }

  private determineChangeType(
    currentValues: Record<string, unknown>,
    previousValues: Record<string, unknown>,
    aiResult: ChangeResult
  ): 'increase' | 'decrease' | 'volatility' | 'pattern' | 'none' {
    if (!aiResult.hasChanged) return 'none';
    
    // Analyze numeric changes
    for (const [key, currentValue] of Object.entries(currentValues)) {
      const previousValue = previousValues[key];
      
      if (typeof currentValue === 'number' && typeof previousValue === 'number') {
        const change = currentValue - previousValue;
        const changePercent = Math.abs(change) / Math.abs(previousValue);
        
        if (changePercent > 0.1) { // 10% change threshold
          return change > 0 ? 'increase' : 'decrease';
        }
      }
    }
    
    // Check for volatility or patterns based on AI reasoning
    const reasoning = aiResult.reasoning.toLowerCase();
    if (reasoning.includes('volatil') || reasoning.includes('fluctuat')) {
      return 'volatility';
    }
    
    if (reasoning.includes('pattern') || reasoning.includes('trend')) {
      return 'pattern';
    }
    
    return 'pattern'; // Default for other types of changes
  }

  private combineEvaluations(
    stateEvaluation: CombinationEvaluation,
    changeEvaluation: TemporalEvaluation | null
  ): boolean {
    // If only state evaluation, return its result
    if (!changeEvaluation) {
      return stateEvaluation.result;
    }
    
    // Combine state and change evaluations
    // This logic can be customized based on monitor requirements
    return stateEvaluation.result && changeEvaluation.hasChanged;
  }

  private calculateCombinedConfidence(
    stateEvaluation: CombinationEvaluation,
    changeEvaluation: TemporalEvaluation | null
  ): number {
    if (!changeEvaluation) {
      return stateEvaluation.confidence;
    }
    
    // Average of both confidences, weighted by complexity
    return (stateEvaluation.confidence + changeEvaluation.confidence) / 2;
  }

  private generateCombinedReasoning(
    stateEvaluation: CombinationEvaluation,
    changeEvaluation: TemporalEvaluation | null
  ): string {
    let reasoning = `State evaluation: ${stateEvaluation.reasoning}`;
    
    if (changeEvaluation) {
      reasoning += `\n\nChange evaluation: ${changeEvaluation.reasoning}`;
      
      if (changeEvaluation.hasChanged) {
        reasoning += `\n\nDetected ${changeEvaluation.changeType} with ${(changeEvaluation.significance * 100).toFixed(1)}% significance.`;
      }
    }
    
    return reasoning;
  }

  private extractReferencedFacts(expression: string): string[] {
    // Simple fact extraction - in production, this would be more sophisticated
    const words = expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const operators = ['AND', 'OR', 'NOT', 'and', 'or', 'not'];
    
    return words.filter(word => !operators.includes(word));
  }
}

// Singleton instance
export const evaluationService = new EvaluationService();