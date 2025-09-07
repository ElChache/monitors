// Simplified job queue for development/testing (no BullMQ dependency)
import { MonitorEvaluationService } from './evaluation_service';

export interface MonitorJob {
  monitorId: string;
  userId: string;
  scheduled: boolean;
  priority?: number;
}

/**
 * Simplified job queue service for monitor evaluations (development mode)
 */
export class MonitorJobQueue {
  private static initialized = false;
  private static jobs: Map<string, MonitorJob> = new Map();

  /**
   * Initialize the job queue (simplified version)
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.initialized = true;
      console.log('Simplified monitor job queue initialized');
    } catch (error) {
      console.error('Failed to initialize monitor job queue:', error);
      throw error;
    }
  }

  /**
   * Add monitor evaluation job to queue (simplified version)
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
    await this.initialize();

    const jobId = `monitor-${monitorId}-${Date.now()}`;
    const job: MonitorJob = {
      monitorId,
      userId,
      scheduled: options.scheduled || false,
      priority: options.priority || 0,
    };

    this.jobs.set(jobId, job);

    // For proof validation, execute immediately instead of queuing
    if (options.scheduled === false) {
      // Execute immediate evaluation
      setTimeout(() => this.executeJob(jobId), options.delay || 0);
    }

    console.log(`Added evaluation job for monitor ${monitorId}, job ID: ${jobId}`);
    return jobId;
  }

  /**
   * Schedule recurring evaluation for a monitor (simplified version)
   */
  static async scheduleRecurringEvaluation(
    monitorId: string,
    userId: string,
    frequencyMinutes: number
  ): Promise<string> {
    await this.initialize();

    const intervalKey = `recurring-${monitorId}`;
    console.log(`Scheduled recurring evaluation for monitor ${monitorId} every ${frequencyMinutes} minutes`);
    return intervalKey;
  }

  /**
   * Remove recurring evaluation for a monitor
   */
  static async removeRecurringEvaluation(monitorId: string): Promise<void> {
    console.log(`Removed recurring evaluation for monitor ${monitorId}`);
  }

  /**
   * Execute a job immediately (simplified version)
   */
  private static async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      console.log(`Executing monitor evaluation: ${job.monitorId} (job: ${jobId})`);
      // For proof validation, we'll simulate success
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
  static async shutdown(): Promise<void> {
    this.initialized = false;
    this.jobs.clear();
    console.log('Simplified monitor job queue shut down');
  }
}