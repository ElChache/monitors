/**
 * OpenAI Provider Implementation (Fallback)
 */

import OpenAI from 'openai';
import type { AIProvider, ExtractedFacts, MonitorType, EvaluationResult, ChangeResult } from '../types.js';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async extractFacts(prompt: string): Promise<ExtractedFacts> {
    const systemPrompt = `You are an expert at analyzing monitoring requests and extracting structured facts. 
    Your task is to analyze the user's natural language prompt and extract specific facts that can be monitored.
    
    Return a JSON response with this structure:
    {
      "facts": [
        {
          "name": "descriptive name for the fact",
          "prompt": "specific instruction for extracting this fact's value",
          "dataSourceType": "api|web_scraping|calculated" (optional)
        }
      ],
      "confidence": 0.0-1.0,
      "reasoning": "explanation of your analysis"
    }
    
    Guidelines:
    - Each fact should be atomic and independently verifiable
    - Prompts should be specific enough for consistent extraction
    - For combinations, extract each individual fact separately
    - Consider data availability and feasibility`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      throw new Error(`OpenAI fact extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async classifyMonitorType(prompt: string): Promise<MonitorType> {
    const systemPrompt = `Classify monitoring requests into two types:
    1. "current_state" - monitoring the current state of something (e.g., "Tesla stock is below $100")
    2. "historical_change" - monitoring changes over time (e.g., "Tesla stock dropped 10% in last hour")
    
    Return JSON:
    {
      "type": "current_state" | "historical_change",
      "confidence": 0.0-1.0,
      "reasoning": "explanation of classification"
    }`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 300,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      throw new Error(`OpenAI monitor type classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async evaluateState(facts: Record<string, any>, logic: string): Promise<EvaluationResult> {
    const systemPrompt = `Evaluate the current state of a monitor based on fact values and logic expression.
    
    Given:
    - Fact values as key-value pairs
    - Boolean logic expression referencing the facts
    
    Return JSON:
    {
      "result": true|false,
      "confidence": 0.0-1.0,
      "reasoning": "step-by-step evaluation explanation",
      "factValues": {} // the provided fact values for reference
    }
    
    Evaluate the logic expression carefully and show your reasoning.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 500,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Facts: ${JSON.stringify(facts)}\nLogic: ${logic}`
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const result = JSON.parse(content);
      result.factValues = facts;
      return result;
    } catch (error) {
      throw new Error(`OpenAI state evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async evaluateChange(
    currentValues: Record<string, any>, 
    previousValues: Record<string, any>, 
    changeCondition: string
  ): Promise<ChangeResult> {
    const systemPrompt = `Evaluate whether a significant change has occurred based on current and previous values.
    
    Return JSON:
    {
      "hasChanged": true|false,
      "significance": 0.0-1.0,
      "confidence": 0.0-1.0,
      "reasoning": "detailed analysis of the change",
      "changeDetails": {} // specific change metrics
    }`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 600,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Current: ${JSON.stringify(currentValues)}\nPrevious: ${JSON.stringify(previousValues)}\nCondition: ${changeCondition}`
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      throw new Error(`OpenAI change evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async optimizeFrequency(monitorType: string, facts: string[]): Promise<number> {
    const systemPrompt = `Recommend optimal evaluation frequency in minutes for a monitor.
    
    Consider:
    - Monitor type (current_state vs historical_change)
    - Nature of facts being monitored
    - Typical update frequency of data sources
    - Performance implications
    
    Return just a number representing minutes between evaluations (minimum 5, maximum 1440).`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 100,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Monitor type: ${monitorType}\nFacts: ${facts.join(', ')}`
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const frequency = parseInt(content.trim());
      return Math.max(5, Math.min(1440, frequency || 60));
    } catch (error) {
      throw new Error(`OpenAI frequency optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}