import { M as MonitorEvaluationService } from "./evaluation_service.js";
class MonitorJobQueue {
  static isInitialized = false;
  /**
   * Initialize the job queue (simplified)
   */
  static async initialize() {
    if (this.isInitialized) return;
    console.log("Simple job queue initialized (BullMQ disabled)");
    this.isInitialized = true;
  }
  /**
   * Add monitor evaluation job to queue (simplified - executes immediately)
   */
  static async addEvaluationJob(monitorId, userId, options = {}) {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Adding evaluation job for monitor ${monitorId}, job ID: ${jobId}`);
    setTimeout(async () => {
      try {
        await MonitorEvaluationService.evaluateMonitor(monitorId, jobId);
      } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
      }
    }, options.delay || 0);
    return jobId;
  }
  /**
   * Schedule recurring evaluations for a monitor (simplified - no-op for now)
   */
  static async scheduleRecurringEvaluation(monitorId, userId, intervalMinutes = 60) {
    console.log(`Would schedule recurring evaluation for monitor ${monitorId} every ${intervalMinutes} minutes (simplified)`);
  }
  /**
   * Remove recurring evaluation for a monitor (simplified - no-op)
   */
  static async removeRecurringEvaluation(monitorId) {
    console.log(`Would remove recurring evaluation for monitor ${monitorId} (simplified)`);
  }
  /**
   * Get job queue statistics (simplified)
   */
  static async getQueueStats() {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }
  /**
   * Get jobs for a specific monitor (simplified)
   */
  static async getMonitorJobs(monitorId, status = "completed", limit = 10) {
    return [];
  }
  /**
   * Clean up completed and failed jobs (simplified - no-op)
   */
  static async cleanupJobs() {
    console.log("Job cleanup (simplified - no-op)");
  }
  /**
   * Graceful shutdown (simplified)
   */
  static async shutdown() {
    console.log("Simple job queue shutdown");
    this.isInitialized = false;
  }
  /**
   * Health check for job queue (simplified)
   */
  static async healthCheck() {
    return {
      connected: this.isInitialized,
      stats: await this.getQueueStats()
    };
  }
}
export {
  MonitorJobQueue as M
};
