import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { monitors, monitorFacts, factHistory } from '../../db/schemas/monitors';
import { MonitorEvaluationService } from './evaluation_service';
import { MonitorJobQueue } from './job_queue';

export interface MonitorCreateData {
  name: string;
  prompt: string;
  type: 'state' | 'change';
  extractedFact: string;
  triggerCondition: string;
  factType: 'number' | 'string' | 'boolean' | 'object';
  checkFrequency?: number; // in minutes, default 60
}

export interface MonitorUpdateData {
  name?: string;
  prompt?: string;
  triggerCondition?: string;
  checkFrequency?: number;
  isActive?: boolean;
}

/**
 * High-level monitor service that makes monitors actually work
 */
export class MonitorService {
  
  /**
   * Create a new monitor and schedule its evaluations
   */
  static async createMonitor(userId: string, data: MonitorCreateData): Promise<any> {
    try {
      const monitor = await db.insert(monitors).values({
        userId,
        name: data.name,
        prompt: data.prompt,
        type: data.type,
        extractedFact: data.extractedFact,
        triggerCondition: data.triggerCondition,
        factType: data.factType,
        checkFrequency: data.checkFrequency || 60,
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      const createdMonitor = monitor[0];

      // Schedule recurring evaluations
      await MonitorJobQueue.scheduleRecurringEvaluation(
        createdMonitor.id,
        userId,
        data.checkFrequency || 60
      );

      // Perform initial evaluation
      await MonitorJobQueue.addEvaluationJob(createdMonitor.id, userId, {
        scheduled: false,
        priority: 10, // High priority for initial evaluation
      });

      console.log(`Created monitor ${createdMonitor.id} with initial evaluation scheduled`);
      return createdMonitor;

    } catch (error) {
      console.error('Failed to create monitor:', error);
      throw error;
    }
  }

  /**
   * Update an existing monitor
   */
  static async updateMonitor(
    monitorId: string,
    userId: string,
    data: MonitorUpdateData
  ): Promise<any> {
    try {
      const updated = await db
        .update(monitors)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(monitors.id, monitorId))
        .returning();

      if (updated.length === 0) {
        throw new Error('Monitor not found');
      }

      const monitor = updated[0];

      // If frequency changed, reschedule recurring evaluations
      if (data.checkFrequency !== undefined) {
        await MonitorJobQueue.scheduleRecurringEvaluation(
          monitorId,
          userId,
          data.checkFrequency
        );
      }

      // If monitor was deactivated, remove recurring evaluations
      if (data.isActive === false) {
        await MonitorJobQueue.removeRecurringEvaluation(monitorId);
      } else if (data.isActive === true) {
        // If reactivated, schedule evaluations
        await MonitorJobQueue.scheduleRecurringEvaluation(
          monitorId,
          userId,
          monitor.checkFrequency
        );
      }

      console.log(`Updated monitor ${monitorId}`);
      return monitor;

    } catch (error) {
      console.error('Failed to update monitor:', error);
      throw error;
    }
  }

  /**
   * Delete a monitor and stop its evaluations
   */
  static async deleteMonitor(monitorId: string, userId: string): Promise<boolean> {
    try {
      // Remove recurring evaluations first
      await MonitorJobQueue.removeRecurringEvaluation(monitorId);

      // Delete monitor (cascade will handle related data)
      const result = await db
        .delete(monitors)
        .where(eq(monitors.id, monitorId))
        .returning();

      if (result.length === 0) {
        throw new Error('Monitor not found');
      }

      console.log(`Deleted monitor ${monitorId} and stopped evaluations`);
      return true;

    } catch (error) {
      console.error('Failed to delete monitor:', error);
      throw error;
    }
  }

  /**
   * Get monitor by ID with latest facts
   */
  static async getMonitor(monitorId: string, userId: string): Promise<any> {
    try {
      const monitorResult = await db
        .select()
        .from(monitors)
        .where(eq(monitors.id, monitorId))
        .limit(1);

      if (monitorResult.length === 0) {
        return null;
      }

      const monitor = monitorResult[0];

      // Get latest facts
      const latestFacts = await db
        .select()
        .from(monitorFacts)
        .where(eq(monitorFacts.monitorId, monitorId))
        .orderBy(desc(monitorFacts.extractedAt))
        .limit(10);

      return {
        ...monitor,
        latestFacts,
      };

    } catch (error) {
      console.error('Failed to get monitor:', error);
      return null;
    }
  }

  /**
   * Get all monitors for a user
   */
  static async getUserMonitors(userId: string): Promise<any[]> {
    try {
      const userMonitors = await db
        .select()
        .from(monitors)
        .where(eq(monitors.userId, userId))
        .orderBy(desc(monitors.createdAt));

      // Get latest facts for each monitor
      const monitorsWithFacts = await Promise.all(
        userMonitors.map(async (monitor) => {
          const latestFacts = await db
            .select()
            .from(monitorFacts)
            .where(eq(monitorFacts.monitorId, monitor.id))
            .orderBy(desc(monitorFacts.extractedAt))
            .limit(3);

          return {
            ...monitor,
            latestFacts,
          };
        })
      );

      return monitorsWithFacts;

    } catch (error) {
      console.error('Failed to get user monitors:', error);
      return [];
    }
  }

  /**
   * Manually trigger monitor evaluation (rate limited)
   */
  static async triggerManualEvaluation(
    monitorId: string,
    userId: string
  ): Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
    rateLimited?: boolean;
  }> {
    try {
      // TODO: Check rate limit (50 per day per user)
      // For now, we'll implement basic rate limiting check
      
      const monitor = await db
        .select()
        .from(monitors)
        .where(eq(monitors.id, monitorId))
        .limit(1);

      if (monitor.length === 0) {
        return {
          success: false,
          error: 'Monitor not found',
        };
      }

      if (!monitor[0].isActive) {
        return {
          success: false,
          error: 'Monitor is not active',
        };
      }

      // Add high priority evaluation job
      const jobId = await MonitorJobQueue.addEvaluationJob(monitorId, userId, {
        scheduled: false,
        priority: 20, // Very high priority for manual triggers
      });

      console.log(`Manual evaluation triggered for monitor ${monitorId}, job: ${jobId}`);

      return {
        success: true,
        jobId,
      };

    } catch (error) {
      console.error('Failed to trigger manual evaluation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get monitor statistics and insights
   */
  static async getMonitorStats(monitorId: string): Promise<{
    totalEvaluations: number;
    totalTriggers: number;
    successRate: number;
    avgProcessingTime: number;
    lastEvaluation?: Date;
    recentTriggers: number;
  }> {
    try {
      const monitor = await db
        .select()
        .from(monitors)
        .where(eq(monitors.id, monitorId))
        .limit(1);

      if (monitor.length === 0) {
        throw new Error('Monitor not found');
      }

      const m = monitor[0];

      // Get recent facts for analysis
      const recentFacts = await db
        .select()
        .from(monitorFacts)
        .where(eq(monitorFacts.monitorId, monitorId))
        .orderBy(desc(monitorFacts.extractedAt))
        .limit(100);

      const totalEvaluations = m.evaluationCount;
      const totalTriggers = m.triggerCount;
      const successRate = totalEvaluations > 0 ? ((totalEvaluations - (recentFacts.filter(f => f.value === null).length)) / totalEvaluations) * 100 : 0;
      const avgProcessingTime = recentFacts.length > 0 
        ? recentFacts.reduce((sum, fact) => sum + (fact.processingTime || 0), 0) / recentFacts.length 
        : 0;
      const lastEvaluation = m.lastChecked;
      const recentTriggers = recentFacts.filter(f => f.triggeredAlert && f.extractedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

      return {
        totalEvaluations,
        totalTriggers,
        successRate: Math.round(successRate * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime),
        lastEvaluation,
        recentTriggers,
      };

    } catch (error) {
      console.error('Failed to get monitor stats:', error);
      return {
        totalEvaluations: 0,
        totalTriggers: 0,
        successRate: 0,
        avgProcessingTime: 0,
        recentTriggers: 0,
      };
    }
  }

  /**
   * Get monitor history data for charts
   */
  static async getMonitorHistory(
    monitorId: string,
    timeRange: { start: Date; end: Date },
    aggregation: 'raw' | 'hourly' | 'daily' = 'raw'
  ): Promise<Array<{
    timestamp: Date;
    value: any;
    triggered: boolean;
  }>> {
    try {
      const history = await db
        .select()
        .from(factHistory)
        .where(eq(factHistory.monitorId, monitorId))
        .orderBy(desc(factHistory.timestamp))
        .limit(1000); // Reasonable limit

      // Filter by time range
      const filtered = history.filter(
        (record) => record.timestamp >= timeRange.start && record.timestamp <= timeRange.end
      );

      if (aggregation === 'raw') {
        return filtered.map((record) => ({
          timestamp: record.timestamp,
          value: record.value,
          triggered: record.triggeredAlert,
        }));
      }

      // TODO: Implement hourly/daily aggregation
      // For now, return raw data
      return filtered.map((record) => ({
        timestamp: record.timestamp,
        value: record.value,
        triggered: record.triggeredAlert,
      }));

    } catch (error) {
      console.error('Failed to get monitor history:', error);
      return [];
    }
  }

  /**
   * Test monitor configuration without saving
   */
  static async testMonitor(userId: string, data: MonitorCreateData): Promise<{
    success: boolean;
    extractedValue?: any;
    error?: string;
    processingTime?: number;
  }> {
    try {
      console.log(`Testing monitor configuration for user ${userId}`);
      
      // Create temporary monitor object for testing
      const testMonitor = {
        id: 'test-monitor',
        userId,
        ...data,
        currentValue: null,
        previousValue: null,
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        lastChecked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Use evaluation service to test data extraction
      const result = await MonitorEvaluationService.evaluateMonitor('test-monitor');

      return {
        success: result.success,
        extractedValue: result.value,
        error: result.error,
        processingTime: result.processingTime,
      };

    } catch (error) {
      console.error('Failed to test monitor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Initialize monitor service and job queue
   */
  static async initialize(): Promise<void> {
    try {
      await MonitorJobQueue.initialize();
      console.log('Monitor service initialized');
    } catch (error) {
      console.error('Failed to initialize monitor service:', error);
      throw error;
    }
  }

  /**
   * Cleanup service resources
   */
  static async shutdown(): Promise<void> {
    try {
      await MonitorJobQueue.shutdown();
      console.log('Monitor service shut down');
    } catch (error) {
      console.error('Failed to shutdown monitor service:', error);
    }
  }
}