import { MonitorEvaluationService } from './evaluation_service';

export interface MonitorJob {
  monitorId: string;
  userId: string;
  scheduled: boolean;
  priority?: number;
}

/**
 * Simplified job queue service for monitor evaluations (without BullMQ)
 * This is a temporary implementation to get the system working
 */
export class MonitorJobQueue {
  private static isInitialized = false;

  /**
   * Initialize the job queue (simplified)
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Simple job queue initialized (BullMQ disabled)');
    this.isInitialized = true;
  }

  /**
   * Add monitor evaluation job to queue (simplified - executes immediately)
   */
  static async addEvaluationJob(
    monitorId: string,
    userId: string,
    options: {
      scheduled?: boolean;
      priority?: number;
      delay?: number;
    } = {}
  ): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Adding evaluation job for monitor ${monitorId}, job ID: ${jobId}`);
    
    // Execute immediately (simplified)
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
  static async scheduleRecurringEvaluation(
    monitorId: string,
    userId: string,
    intervalMinutes: number = 60
  ): Promise<void> {
    console.log(`Would schedule recurring evaluation for monitor ${monitorId} every ${intervalMinutes} minutes (simplified)`);
  }

  /**
   * Remove recurring evaluation for a monitor (simplified - no-op)
   */
  static async removeRecurringEvaluation(monitorId: string): Promise<void> {
    console.log(`Would remove recurring evaluation for monitor ${monitorId} (simplified)`);
  }

  /**
   * Get job queue statistics (simplified)
   */
  static async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }

  /**
   * Get jobs for a specific monitor (simplified)
   */
  static async getMonitorJobs(
    monitorId: string,
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' = 'completed',
    limit: number = 10
  ): Promise<any[]> {
    return [];
  }

  /**
   * Clean up completed and failed jobs (simplified - no-op)
   */
  static async cleanupJobs(): Promise<void> {
    console.log('Job cleanup (simplified - no-op)');
  }

  /**
   * Graceful shutdown (simplified)
   */
  static async shutdown(): Promise<void> {
    console.log('Simple job queue shutdown');
    this.isInitialized = false;
  }

  /**
   * Health check for job queue (simplified)
   */
  static async healthCheck(): Promise<{
    connected: boolean;
    stats?: any;
    error?: string;
  }> {
    return {
      connected: this.isInitialized,
      stats: await this.getQueueStats(),
    };
  }
}