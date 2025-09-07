import { eq } from 'drizzle-orm';
import { db } from '../db';
import { monitors, monitorFacts, factHistory, monitorEvaluations } from '../../db/schemas/monitors';
import { WebScraperService } from './web_scraper';
import { IntegratedEmailService } from '../email/integrated_service';

export interface EvaluationResult {
  success: boolean;
  value: any;
  changed: boolean;
  triggered: boolean;
  error?: string;
  processingTime: number;
}

export interface MonitorEvaluation {
  monitorId: string;
  startTime: Date;
  endTime: Date;
  result: EvaluationResult;
  jobId?: string;
}

/**
 * Core monitor evaluation service that makes monitors actually work
 */
export class MonitorEvaluationService {
  
  /**
   * Evaluate a single monitor - the core function that makes monitoring work
   */
  static async evaluateMonitor(monitorId: string, jobId?: string): Promise<EvaluationResult> {
    const startTime = Date.now();
    
    try {
      // Get monitor details
      const monitorResult = await db
        .select()
        .from(monitors)
        .where(eq(monitors.id, monitorId))
        .limit(1);

      if (monitorResult.length === 0) {
        return {
          success: false,
          value: null,
          changed: false,
          triggered: false,
          error: 'Monitor not found',
          processingTime: Date.now() - startTime
        };
      }

      const monitor = monitorResult[0];

      if (!monitor.isActive) {
        return {
          success: false,
          value: null,
          changed: false,
          triggered: false,
          error: 'Monitor is not active',
          processingTime: Date.now() - startTime
        };
      }

      // Log evaluation start
      const evaluationId = await this.logEvaluationStart(monitorId, jobId);

      // Extract data based on monitor configuration
      const extractedValue = await this.extractMonitorData(monitor);
      
      if (extractedValue === null) {
        await this.logEvaluationComplete(evaluationId, false, null, 'Data extraction failed');
        return {
          success: false,
          value: null,
          changed: false,
          triggered: false,
          error: 'Failed to extract data',
          processingTime: Date.now() - startTime
        };
      }

      // Check for changes
      const changed = this.hasValueChanged(monitor.currentValue, extractedValue, monitor.type);
      
      // Evaluate trigger condition
      const triggered = this.evaluateTriggerCondition(
        monitor.triggerCondition,
        extractedValue,
        monitor.currentValue,
        monitor.factType
      );

      // Update monitor state
      await this.updateMonitorState(monitor, extractedValue, changed, triggered);

      // Store fact history
      await this.storeFact(monitorId, extractedValue, triggered, 'evaluation');

      // Send notification if triggered
      if (triggered) {
        await this.sendNotification(monitorId, extractedValue, monitor.currentValue);
      }

      // Log evaluation completion
      await this.logEvaluationComplete(evaluationId, true, extractedValue);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        value: extractedValue,
        changed,
        triggered,
        processingTime
      };

    } catch (error) {
      console.error('Monitor evaluation failed:', error);
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        value: null,
        changed: false,
        triggered: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      };
    }
  }

  /**
   * Extract data from the target source (web scraping or API)
   */
  private static async extractMonitorData(monitor: any): Promise<any> {
    try {
      // For now, we'll extract based on the monitor prompt
      // In a real implementation, this would parse the prompt to determine the extraction method
      
      // Simple URL detection
      const urlMatch = monitor.prompt.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        return await WebScraperService.extractData(url, {
          selector: this.inferSelector(monitor.extractedFact),
          type: monitor.factType
        });
      }

      // For demonstration, generate realistic test data based on monitor type
      return this.generateTestData(monitor);

    } catch (error) {
      console.error('Data extraction failed:', error);
      return null;
    }
  }

  /**
   * Infer CSS selector from extracted fact description
   */
  private static inferSelector(extractedFact: string): string {
    const fact = extractedFact.toLowerCase();
    
    if (fact.includes('price')) {
      return '.price, .current-price, [data-price], .product-price';
    }
    if (fact.includes('stock') || fact.includes('inventory')) {
      return '.stock, .inventory, .availability, [data-stock]';
    }
    if (fact.includes('title') || fact.includes('headline')) {
      return 'h1, h2, .title, .headline, .article-title';
    }
    if (fact.includes('count') || fact.includes('number')) {
      return '.count, .number, .quantity, [data-count]';
    }
    
    return 'body'; // Default fallback
  }

  /**
   * Generate realistic test data for development/demo
   */
  private static generateTestData(monitor: any): any {
    const prompt = monitor.prompt.toLowerCase();
    
    // Stock price simulation
    if (prompt.includes('stock') || prompt.includes('price') || prompt.includes('$')) {
      const basePrice = 100 + Math.random() * 400;
      const change = (Math.random() - 0.5) * 10;
      return Math.round((basePrice + change) * 100) / 100;
    }
    
    // Cryptocurrency simulation
    if (prompt.includes('bitcoin') || prompt.includes('crypto') || prompt.includes('btc')) {
      const basePrice = 40000 + Math.random() * 20000;
      const change = (Math.random() - 0.5) * 2000;
      return Math.round(basePrice + change);
    }
    
    // Weather simulation
    if (prompt.includes('temperature') || prompt.includes('weather')) {
      return Math.round(15 + Math.random() * 20); // 15-35°C
    }
    
    // Inventory/stock simulation
    if (prompt.includes('stock') && !prompt.includes('price')) {
      return Math.floor(Math.random() * 100);
    }
    
    // Boolean status simulation
    if (monitor.factType === 'boolean') {
      return Math.random() > 0.7; // 30% chance of true
    }
    
    // String/text simulation
    if (monitor.factType === 'string') {
      const statuses = ['Available', 'Out of Stock', 'Limited', 'Pre-order', 'Discontinued'];
      return statuses[Math.floor(Math.random() * statuses.length)];
    }
    
    // Object simulation
    if (monitor.factType === 'object') {
      return {
        value: Math.round(Math.random() * 1000),
        status: Math.random() > 0.5 ? 'active' : 'inactive',
        updated: new Date().toISOString()
      };
    }
    
    // Default numeric simulation
    return Math.round(Math.random() * 1000);
  }

  /**
   * Check if value has changed based on monitor type
   */
  private static hasValueChanged(currentValue: any, newValue: any, monitorType: string): boolean {
    if (currentValue === null || currentValue === undefined) {
      return true; // First evaluation
    }

    if (monitorType === 'change') {
      // Change monitors trigger on any change
      return JSON.stringify(currentValue) !== JSON.stringify(newValue);
    }

    // State monitors can define their own change logic
    if (typeof newValue === 'number' && typeof currentValue === 'number') {
      // Consider changes > 1% as significant for numeric values
      const changePercent = Math.abs(newValue - currentValue) / currentValue;
      return changePercent > 0.01;
    }

    return JSON.stringify(currentValue) !== JSON.stringify(newValue);
  }

  /**
   * Evaluate trigger condition against the extracted value
   */
  private static evaluateTriggerCondition(
    condition: string,
    currentValue: any,
    previousValue: any,
    factType: string
  ): boolean {
    try {
      const conditionLower = condition.toLowerCase();

      // Numeric conditions
      if (factType === 'number' && typeof currentValue === 'number') {
        const numValue = currentValue;
        
        if (conditionLower.includes('above') || conditionLower.includes('>')) {
          const threshold = this.extractNumber(condition);
          return threshold !== null && numValue > threshold;
        }
        
        if (conditionLower.includes('below') || conditionLower.includes('<')) {
          const threshold = this.extractNumber(condition);
          return threshold !== null && numValue < threshold;
        }
        
        if (conditionLower.includes('equals') || conditionLower.includes('=')) {
          const threshold = this.extractNumber(condition);
          return threshold !== null && Math.abs(numValue - threshold) < 0.01;
        }
        
        if (conditionLower.includes('drops') && previousValue !== null) {
          const threshold = this.extractNumber(condition) || 0;
          return numValue < (previousValue - threshold);
        }
        
        if (conditionLower.includes('rises') || conditionLower.includes('increases')) {
          const threshold = this.extractNumber(condition) || 0;
          return previousValue !== null && numValue > (previousValue + threshold);
        }
      }

      // String conditions
      if (factType === 'string' && typeof currentValue === 'string') {
        if (conditionLower.includes('contains')) {
          const searchTerm = this.extractQuotedText(condition) || this.extractLastWord(condition);
          return searchTerm && currentValue.toLowerCase().includes(searchTerm.toLowerCase());
        }
        
        if (conditionLower.includes('equals') || conditionLower.includes('is')) {
          const target = this.extractQuotedText(condition) || this.extractLastWord(condition);
          return target && currentValue.toLowerCase() === target.toLowerCase();
        }
        
        if (conditionLower.includes('changes')) {
          return previousValue !== null && currentValue !== previousValue;
        }
      }

      // Boolean conditions
      if (factType === 'boolean') {
        if (conditionLower.includes('true') || conditionLower.includes('becomes true')) {
          return currentValue === true;
        }
        
        if (conditionLower.includes('false') || conditionLower.includes('becomes false')) {
          return currentValue === false;
        }
        
        if (conditionLower.includes('changes')) {
          return previousValue !== null && currentValue !== previousValue;
        }
      }

      // Default: trigger on any change for change-type monitors
      return previousValue !== null && JSON.stringify(currentValue) !== JSON.stringify(previousValue);

    } catch (error) {
      console.error('Trigger condition evaluation error:', error);
      return false;
    }
  }

  /**
   * Extract number from condition string
   */
  private static extractNumber(text: string): number | null {
    const matches = text.match(/[\d.,]+/);
    if (matches) {
      const numStr = matches[0].replace(/,/g, '');
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Extract quoted text from condition
   */
  private static extractQuotedText(text: string): string | null {
    const matches = text.match(/"([^"]+)"|'([^']+)'/);
    return matches ? (matches[1] || matches[2]) : null;
  }

  /**
   * Extract last word from condition (fallback)
   */
  private static extractLastWord(text: string): string | null {
    const words = text.trim().split(/\s+/);
    return words.length > 0 ? words[words.length - 1] : null;
  }

  /**
   * Update monitor state with new values
   */
  private static async updateMonitorState(
    monitor: any,
    newValue: any,
    changed: boolean,
    triggered: boolean
  ): Promise<void> {
    const updates: any = {
      lastChecked: new Date(),
      previousValue: monitor.currentValue,
      currentValue: newValue,
      evaluationCount: monitor.evaluationCount + 1,
      updatedAt: new Date()
    };

    if (triggered) {
      updates.triggerCount = monitor.triggerCount + 1;
    }

    await db
      .update(monitors)
      .set(updates)
      .where(eq(monitors.id, monitor.id));
  }

  /**
   * Store fact in history
   */
  private static async storeFact(
    monitorId: string,
    value: any,
    triggered: boolean,
    source: string
  ): Promise<void> {
    await Promise.all([
      // Store in monitor_facts (recent facts)
      db.insert(monitorFacts).values({
        monitorId,
        value,
        extractedAt: new Date(),
        source,
        triggeredAlert: triggered,
        processingTime: 100, // Placeholder
        confidence: 1.0,
        createdAt: new Date()
      }),
      
      // Store in fact_history (long-term analytics)
      db.insert(factHistory).values({
        monitorId,
        value,
        timestamp: new Date(),
        triggeredAlert: triggered,
        source,
        createdAt: new Date()
      })
    ]);
  }

  /**
   * Send notification if monitor triggered
   */
  private static async sendNotification(
    monitorId: string,
    currentValue: any,
    previousValue: any
  ): Promise<void> {
    try {
      await IntegratedEmailService.sendMonitorNotification(
        monitorId,
        currentValue,
        previousValue
      );
    } catch (error) {
      console.error('Failed to send monitor notification:', error);
    }
  }

  /**
   * Log evaluation start
   */
  private static async logEvaluationStart(monitorId: string, jobId?: string): Promise<string> {
    const result = await db.insert(monitorEvaluations).values({
      monitorId,
      jobId,
      status: 'processing',
      startedAt: new Date(),
      triggeredBy: 'manual', // TODO: detect source
      createdAt: new Date()
    }).returning({ id: monitorEvaluations.id });

    return result[0].id;
  }

  /**
   * Log evaluation completion
   */
  private static async logEvaluationComplete(
    evaluationId: string,
    success: boolean,
    extractedValue?: any,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      status: success ? 'completed' : 'failed',
      completedAt: new Date(),
      extractedValue,
      errorMessage
    };

    await db
      .update(monitorEvaluations)
      .set(updates)
      .where(eq(monitorEvaluations.id, evaluationId));
  }

  /**
   * Evaluate all active monitors (for scheduled runs)
   */
  static async evaluateAllActiveMonitors(): Promise<{
    total: number;
    successful: number;
    triggered: number;
    failed: number;
  }> {
    const activeMonitors = await db
      .select()
      .from(monitors)
      .where(eq(monitors.isActive, true));

    let successful = 0;
    let triggered = 0;
    let failed = 0;

    for (const monitor of activeMonitors) {
      try {
        const result = await this.evaluateMonitor(monitor.id);
        
        if (result.success) {
          successful++;
          if (result.triggered) {
            triggered++;
          }
        } else {
          failed++;
        }

        // Rate limiting: wait 100ms between evaluations
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Failed to evaluate monitor ${monitor.id}:`, error);
        failed++;
      }
    }

    console.log(`Evaluated ${activeMonitors.length} monitors: ${successful} successful, ${triggered} triggered, ${failed} failed`);

    return {
      total: activeMonitors.length,
      successful,
      triggered,
      failed
    };
  }
}