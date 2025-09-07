// Temporarily disabled BullMQ imports to fix compatibility issues
// import { Queue, Worker } from 'bullmq';
import { MonitorEvaluationService } from './evaluation_service';

export interface MonitorJob {
  monitorId: string;
  userId: string;
  scheduled: boolean;
  priority?: number;
}

/**
 * Job queue service for monitor evaluations using BullMQ
 */
export class MonitorJobQueue {
  private static queue: Queue<MonitorJob> | null = null;
  private static worker: Worker | null = null;
  private static isProcessing = false;

  /**
   * Initialize the job queue
   */
  static async initialize(): Promise<void> {
    if (this.queue) return;

    try {
      // Use Redis connection for job queue  
      const connection = {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      };
      
      this.queue = new Queue('monitor-evaluation', {
        connection,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Set up job processing
      if (!this.isProcessing) {
        this.worker = new Worker('monitor-evaluation', this.processMonitorEvaluation.bind(this), {
          connection,
          concurrency: 5,
        });
        this.isProcessing = true;
      }

      console.log('Monitor job queue initialized');
    } catch (error) {
      console.error('Failed to initialize monitor job queue:', error);
      throw error;
    }
  }

  /**
   * Add monitor evaluation job to queue
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

    if (!this.queue) {
      throw new Error('Job queue not initialized');
    }

    const job = await this.queue.add(
      'evaluate-monitor',
      {
        monitorId,
        userId,
        scheduled: options.scheduled || false,
        priority: options.priority || 0,
      },
      {
        priority: options.priority || 0,
        delay: options.delay || 0,
        jobId: `monitor-${monitorId}-${Date.now()}`,
      }
    );

    console.log(`Added evaluation job for monitor ${monitorId}, job ID: ${job.id}`);
    return job.id?.toString() || '';
  }

  /**
   * Process monitor evaluation job
   */
  private static async processMonitorEvaluation(job: any): Promise<void> {
    const { monitorId, userId, scheduled } = job.data;
    const jobId = job.id?.toString();

    try {
      console.log(`Processing monitor evaluation: ${monitorId} (job: ${jobId})`);
      
      const result = await MonitorEvaluationService.evaluateMonitor(monitorId, jobId);

      if (!result.success) {
        throw new Error(result.error || 'Monitor evaluation failed');
      }

      console.log(`Monitor evaluation completed: ${monitorId}, triggered: ${result.triggered}, processing time: ${result.processingTime}ms`);

    } catch (error) {
      console.error(`Monitor evaluation failed for ${monitorId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule recurring evaluations for a monitor
   */
  static async scheduleRecurringEvaluation(
    monitorId: string,
    userId: string,
    intervalMinutes: number = 60
  ): Promise<void> {
    await this.initialize();

    if (!this.queue) {
      throw new Error('Job queue not initialized');
    }

    // Remove existing recurring job for this monitor
    await this.removeRecurringEvaluation(monitorId);

    // Add new recurring job
    const cronPattern = this.minutesToCron(intervalMinutes);
    
    await this.queue.add(
      'evaluate-monitor',
      {
        monitorId,
        userId,
        scheduled: true,
      },
      {
        repeat: { cron: cronPattern },
        jobId: `recurring-${monitorId}`,
      }
    );

    console.log(`Scheduled recurring evaluation for monitor ${monitorId} every ${intervalMinutes} minutes`);
  }

  /**
   * Remove recurring evaluation for a monitor
   */
  static async removeRecurringEvaluation(monitorId: string): Promise<void> {
    await this.initialize();

    if (!this.queue) return;

    try {
      await this.queue.removeRepeatable('evaluate-monitor', {
        jobId: `recurring-${monitorId}`,
      });
      
      console.log(`Removed recurring evaluation for monitor ${monitorId}`);
    } catch (error) {
      // Job might not exist, which is fine
      console.log(`No recurring evaluation to remove for monitor ${monitorId}`);
    }
  }

  /**
   * Get job queue statistics
   */
  static async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    await this.initialize();

    if (!this.queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Get jobs for a specific monitor
   */
  static async getMonitorJobs(
    monitorId: string,
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' = 'completed',
    limit: number = 10
  ): Promise<any[]> {
    await this.initialize();

    if (!this.queue) return [];

    try {
      let jobs: Bull.Job[] = [];

      switch (status) {
        case 'waiting':
          jobs = await this.queue.getWaiting(0, limit - 1);
          break;
        case 'active':
          jobs = await this.queue.getActive(0, limit - 1);
          break;
        case 'completed':
          jobs = await this.queue.getCompleted(0, limit - 1);
          break;
        case 'failed':
          jobs = await this.queue.getFailed(0, limit - 1);
          break;
        case 'delayed':
          jobs = await this.queue.getDelayed(0, limit - 1);
          break;
      }

      return jobs
        .filter(job => job.data.monitorId === monitorId)
        .map(job => ({
          id: job.id,
          data: job.data,
          opts: job.opts,
          progress: job.progress,
          returnvalue: job.returnvalue,
          failedReason: job.failedReason,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
        }));

    } catch (error) {
      console.error('Failed to get monitor jobs:', error);
      return [];
    }
  }

  /**
   * Convert minutes to cron pattern
   */
  private static minutesToCron(minutes: number): string {
    if (minutes < 60) {
      return `*/${minutes} * * * *`;
    } else if (minutes === 60) {
      return '0 * * * *';  // Every hour
    } else if (minutes === 1440) {
      return '0 0 * * *';  // Daily
    } else if (minutes === 10080) {
      return '0 0 * * 0';  // Weekly
    } else {
      // For custom intervals, use minutes
      return `*/${minutes} * * * *`;
    }
  }

  /**
   * Clean up completed and failed jobs
   */
  static async cleanupJobs(): Promise<void> {
    await this.initialize();

    if (!this.queue) return;

    try {
      // Clean jobs older than 24 hours
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      await this.queue.clean(24 * 60 * 60 * 1000, 'completed');
      await this.queue.clean(24 * 60 * 60 * 1000, 'failed');

      console.log('Job queue cleanup completed');
    } catch (error) {
      console.error('Job queue cleanup failed:', error);
    }
  }

  /**
   * Graceful shutdown
   */
  static async shutdown(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
      this.isProcessing = false;
      console.log('Monitor job queue shut down');
    }
  }

  /**
   * Health check for job queue
   */
  static async healthCheck(): Promise<{
    connected: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      await this.initialize();
      
      if (!this.queue) {
        return { connected: false, error: 'Queue not initialized' };
      }

      const stats = await this.getQueueStats();
      
      return {
        connected: true,
        stats,
      };

    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}