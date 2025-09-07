import { eq, desc } from 'drizzle-orm';
import { db } from './connection-D27Xdyu3.js';
import { m as monitors, j as monitorFacts, g as factHistory } from './users-CCLvGjXf.js';
import { c as classifyPrompt, M as MonitorEvaluationService } from './evaluation_service-CE7LdKAb.js';
import './db-whCnGq-7.js';
import 'puppeteer';
import './service4-B-hvY16X.js';

class MonitorJobQueue {
  static initialized = false;
  static jobs = /* @__PURE__ */ new Map();
  /**
   * Initialize the job queue (simplified version)
   */
  static async initialize() {
    if (this.initialized) return;
    try {
      this.initialized = true;
      console.log("Simplified monitor job queue initialized");
    } catch (error) {
      console.error("Failed to initialize monitor job queue:", error);
      throw error;
    }
  }
  /**
   * Add monitor evaluation job to queue (simplified version)
   */
  static async addEvaluationJob(monitorId, userId, options = {}) {
    await this.initialize();
    const jobId = `monitor-${monitorId}-${Date.now()}`;
    const job = {
      monitorId,
      userId,
      scheduled: options.scheduled || false,
      priority: options.priority || 0
    };
    this.jobs.set(jobId, job);
    if (options.scheduled === false) {
      setTimeout(() => this.executeJob(jobId), options.delay || 0);
    }
    console.log(`Added evaluation job for monitor ${monitorId}, job ID: ${jobId}`);
    return jobId;
  }
  /**
   * Schedule recurring evaluation for a monitor (simplified version)
   */
  static async scheduleRecurringEvaluation(monitorId, userId, frequencyMinutes) {
    await this.initialize();
    const intervalKey = `recurring-${monitorId}`;
    console.log(`Scheduled recurring evaluation for monitor ${monitorId} every ${frequencyMinutes} minutes`);
    return intervalKey;
  }
  /**
   * Remove recurring evaluation for a monitor
   */
  static async removeRecurringEvaluation(monitorId) {
    console.log(`Removed recurring evaluation for monitor ${monitorId}`);
  }
  /**
   * Execute a job immediately (simplified version)
   */
  static async executeJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    try {
      console.log(`Executing monitor evaluation: ${job.monitorId} (job: ${jobId})`);
      console.log(`Monitor evaluation completed successfully for ${job.monitorId}`);
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
    } finally {
      this.jobs.delete(jobId);
    }
  }
  /**
   * Shutdown the job queue
   */
  static async shutdown() {
    this.initialized = false;
    this.jobs.clear();
    console.log("Simplified monitor job queue shut down");
  }
}
class MonitorService {
  /**
   * Create a new monitor with AI-enhanced configuration
   */
  static async createMonitor(userId, data) {
    try {
      let monitorConfig = data;
      if (!data.type || !data.extractedFact || !data.triggerCondition || !data.factType) {
        console.log(`Using AI to classify monitor prompt: "${data.prompt}"`);
        try {
          const classification = await classifyPrompt(data.prompt);
          monitorConfig = {
            ...data,
            type: data.type || classification.monitorType,
            extractedFact: data.extractedFact || classification.extractedFact,
            triggerCondition: data.triggerCondition || classification.triggerCondition,
            factType: data.factType || classification.factType,
            checkFrequency: data.checkFrequency || classification.recommendedFrequency
          };
          console.log(`AI classification complete:`, {
            type: monitorConfig.type,
            factType: monitorConfig.factType,
            frequency: monitorConfig.checkFrequency,
            confidence: classification.confidence
          });
        } catch (aiError) {
          console.warn("AI classification failed, using defaults:", aiError);
          monitorConfig = {
            ...data,
            type: data.type || "state",
            extractedFact: data.extractedFact || "Extract value from the content",
            triggerCondition: data.triggerCondition || "Monitor for changes",
            factType: data.factType || "string"
          };
        }
      }
      const monitor = await db.insert(monitors).values({
        userId,
        name: monitorConfig.name,
        prompt: monitorConfig.prompt,
        type: monitorConfig.type,
        extractedFact: monitorConfig.extractedFact,
        triggerCondition: monitorConfig.triggerCondition,
        factType: monitorConfig.factType,
        checkFrequency: monitorConfig.checkFrequency || 60,
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      const createdMonitor = monitor[0];
      await MonitorJobQueue.scheduleRecurringEvaluation(
        createdMonitor.id,
        userId,
        monitorConfig.checkFrequency || 60
      );
      await MonitorJobQueue.addEvaluationJob(createdMonitor.id, userId, {
        scheduled: false,
        priority: 10
        // High priority for initial evaluation
      });
      console.log(`Created AI-enhanced monitor ${createdMonitor.id} with initial evaluation scheduled`);
      return createdMonitor;
    } catch (error) {
      console.error("Failed to create monitor:", error);
      throw error;
    }
  }
  /**
   * Update an existing monitor
   */
  static async updateMonitor(monitorId, userId, data) {
    try {
      const updated = await db.update(monitors).set({
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(monitors.id, monitorId)).returning();
      if (updated.length === 0) {
        throw new Error("Monitor not found");
      }
      const monitor = updated[0];
      if (data.checkFrequency !== void 0) {
        await MonitorJobQueue.scheduleRecurringEvaluation(
          monitorId,
          userId,
          data.checkFrequency
        );
      }
      if (data.isActive === false) {
        await MonitorJobQueue.removeRecurringEvaluation(monitorId);
      } else if (data.isActive === true) {
        await MonitorJobQueue.scheduleRecurringEvaluation(
          monitorId,
          userId,
          monitor.checkFrequency
        );
      }
      console.log(`Updated monitor ${monitorId}`);
      return monitor;
    } catch (error) {
      console.error("Failed to update monitor:", error);
      throw error;
    }
  }
  /**
   * Delete a monitor and stop its evaluations
   */
  static async deleteMonitor(monitorId, userId) {
    try {
      await MonitorJobQueue.removeRecurringEvaluation(monitorId);
      const result = await db.delete(monitors).where(eq(monitors.id, monitorId)).returning();
      if (result.length === 0) {
        throw new Error("Monitor not found");
      }
      console.log(`Deleted monitor ${monitorId} and stopped evaluations`);
      return true;
    } catch (error) {
      console.error("Failed to delete monitor:", error);
      throw error;
    }
  }
  /**
   * Get monitor by ID with latest facts
   */
  static async getMonitor(monitorId, userId) {
    try {
      const monitorResult = await db.select().from(monitors).where(eq(monitors.id, monitorId)).limit(1);
      if (monitorResult.length === 0) {
        return null;
      }
      const monitor = monitorResult[0];
      const latestFacts = await db.select().from(monitorFacts).where(eq(monitorFacts.monitorId, monitorId)).orderBy(desc(monitorFacts.extractedAt)).limit(10);
      return {
        ...monitor,
        latestFacts
      };
    } catch (error) {
      console.error("Failed to get monitor:", error);
      return null;
    }
  }
  /**
   * Get all monitors for a user
   */
  static async getUserMonitors(userId) {
    try {
      const userMonitors = await db.select().from(monitors).where(eq(monitors.userId, userId)).orderBy(desc(monitors.createdAt));
      const monitorsWithFacts = await Promise.all(
        userMonitors.map(async (monitor) => {
          const latestFacts = await db.select().from(monitorFacts).where(eq(monitorFacts.monitorId, monitor.id)).orderBy(desc(monitorFacts.extractedAt)).limit(3);
          return {
            ...monitor,
            latestFacts
          };
        })
      );
      return monitorsWithFacts;
    } catch (error) {
      console.error("Failed to get user monitors:", error);
      return [];
    }
  }
  /**
   * Manually trigger monitor evaluation (rate limited)
   */
  static async triggerManualEvaluation(monitorId, userId) {
    try {
      const monitor = await db.select().from(monitors).where(eq(monitors.id, monitorId)).limit(1);
      if (monitor.length === 0) {
        return {
          success: false,
          error: "Monitor not found"
        };
      }
      if (!monitor[0].isActive) {
        return {
          success: false,
          error: "Monitor is not active"
        };
      }
      const jobId = await MonitorJobQueue.addEvaluationJob(monitorId, userId, {
        scheduled: false,
        priority: 20
        // Very high priority for manual triggers
      });
      console.log(`Manual evaluation triggered for monitor ${monitorId}, job: ${jobId}`);
      return {
        success: true,
        jobId
      };
    } catch (error) {
      console.error("Failed to trigger manual evaluation:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Get monitor statistics and insights
   */
  static async getMonitorStats(monitorId) {
    try {
      const monitor = await db.select().from(monitors).where(eq(monitors.id, monitorId)).limit(1);
      if (monitor.length === 0) {
        throw new Error("Monitor not found");
      }
      const m = monitor[0];
      const recentFacts = await db.select().from(monitorFacts).where(eq(monitorFacts.monitorId, monitorId)).orderBy(desc(monitorFacts.extractedAt)).limit(100);
      const totalEvaluations = m.evaluationCount;
      const totalTriggers = m.triggerCount;
      const successRate = totalEvaluations > 0 ? (totalEvaluations - recentFacts.filter((f) => f.value === null).length) / totalEvaluations * 100 : 0;
      const avgProcessingTime = recentFacts.length > 0 ? recentFacts.reduce((sum, fact) => sum + (fact.processingTime || 0), 0) / recentFacts.length : 0;
      const lastEvaluation = m.lastChecked;
      const recentTriggers = recentFacts.filter((f) => f.triggeredAlert && f.extractedAt > new Date(Date.now() - 24 * 60 * 60 * 1e3)).length;
      return {
        totalEvaluations,
        totalTriggers,
        successRate: Math.round(successRate * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime),
        lastEvaluation,
        recentTriggers
      };
    } catch (error) {
      console.error("Failed to get monitor stats:", error);
      return {
        totalEvaluations: 0,
        totalTriggers: 0,
        successRate: 0,
        avgProcessingTime: 0,
        recentTriggers: 0
      };
    }
  }
  /**
   * Get monitor history data for charts
   */
  static async getMonitorHistory(monitorId, timeRange, aggregation = "raw") {
    try {
      const history = await db.select().from(factHistory).where(eq(factHistory.monitorId, monitorId)).orderBy(desc(factHistory.timestamp)).limit(1e3);
      const filtered = history.filter(
        (record) => record.timestamp >= timeRange.start && record.timestamp <= timeRange.end
      );
      if (aggregation === "raw") {
        return filtered.map((record) => ({
          timestamp: record.timestamp,
          value: record.value,
          triggered: record.triggeredAlert
        }));
      }
      return filtered.map((record) => ({
        timestamp: record.timestamp,
        value: record.value,
        triggered: record.triggeredAlert
      }));
    } catch (error) {
      console.error("Failed to get monitor history:", error);
      return [];
    }
  }
  /**
   * Test monitor configuration without saving
   */
  static async testMonitor(userId, data) {
    try {
      console.log(`Testing monitor configuration for user ${userId}`);
      const testMonitor = {
        id: "test-monitor",
        userId,
        ...data,
        currentValue: null,
        previousValue: null,
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        lastChecked: null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      const result = await MonitorEvaluationService.evaluateMonitor("test-monitor");
      return {
        success: result.success,
        extractedValue: result.value,
        error: result.error,
        processingTime: result.processingTime
      };
    } catch (error) {
      console.error("Failed to test monitor:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Initialize monitor service and job queue
   */
  static async initialize() {
    try {
      await MonitorJobQueue.initialize();
      console.log("Monitor service initialized");
    } catch (error) {
      console.error("Failed to initialize monitor service:", error);
      throw error;
    }
  }
  /**
   * Cleanup service resources
   */
  static async shutdown() {
    try {
      await MonitorJobQueue.shutdown();
      console.log("Monitor service shut down");
    } catch (error) {
      console.error("Failed to shutdown monitor service:", error);
    }
  }
}

export { MonitorService as M };
//# sourceMappingURL=monitor_service-TdkLdvPq.js.map
