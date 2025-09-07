import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitorService } from './monitor_service';

// Mock the database
vi.mock('../db', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
}));

// Mock job queue
vi.mock('./job_queue', () => ({
  MonitorJobQueue: {
    scheduleRecurringEvaluation: vi.fn(),
    addEvaluationJob: vi.fn(),
    removeRecurringEvaluation: vi.fn(),
  }
}));

// Mock evaluation service  
vi.mock('./evaluation_service', () => ({
  MonitorEvaluationService: {
    evaluateMonitor: vi.fn(),
  }
}));

describe('MonitorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMonitor', () => {
    it('should create a monitor and schedule evaluations', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        userId: 'user-123',
        name: 'Test Monitor',
        prompt: 'Monitor website availability',
        type: 'state',
        extractedFact: 'status code',
        triggerCondition: 'status !== 200',
        factType: 'number',
        checkFrequency: 60,
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      const { MonitorJobQueue } = await import('./job_queue');
      (MonitorJobQueue.scheduleRecurringEvaluation as any).mockResolvedValue('job-123');
      (MonitorJobQueue.addEvaluationJob as any).mockResolvedValue('initial-job-123');

      const result = await MonitorService.createMonitor('user-123', {
        name: 'Test Monitor',
        prompt: 'Monitor website availability',
        type: 'state',
        extractedFact: 'status code',
        triggerCondition: 'status !== 200',
        factType: 'number',
        checkFrequency: 60,
      });

      expect(result).toEqual(mockMonitor);
      expect(MonitorJobQueue.scheduleRecurringEvaluation).toHaveBeenCalledWith(
        mockMonitor.id,
        'user-123',
        60
      );
      expect(MonitorJobQueue.addEvaluationJob).toHaveBeenCalledWith(
        mockMonitor.id,
        'user-123',
        { scheduled: false, priority: 10 }
      );
    });

    it('should use default check frequency if not provided', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        checkFrequency: 60,
        isActive: true,
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      await MonitorService.createMonitor('user-123', {
        name: 'Test Monitor',
        prompt: 'Monitor website availability',
        type: 'state',
        extractedFact: 'status code',
        triggerCondition: 'status !== 200',
        factType: 'number',
        // No checkFrequency provided
      });

      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          checkFrequency: 60, // Default value
        })
      );
    });

    it('should handle database errors', async () => {
      const { db } = await import('../db');
      (db.returning as any).mockRejectedValueOnce(new Error('Database error'));

      await expect(
        MonitorService.createMonitor('user-123', {
          name: 'Test Monitor',
          prompt: 'Monitor website availability',
          type: 'state',
          extractedFact: 'status code',
          triggerCondition: 'status !== 200',
          factType: 'number',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateMonitor', () => {
    it('should update monitor and reschedule if frequency changed', async () => {
      const mockUpdatedMonitor = {
        id: 'monitor-123',
        checkFrequency: 30,
        isActive: true,
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockUpdatedMonitor]);

      const { MonitorJobQueue } = await import('./job_queue');
      (MonitorJobQueue.scheduleRecurringEvaluation as any).mockResolvedValue('job-123');

      const result = await MonitorService.updateMonitor('monitor-123', 'user-123', {
        name: 'Updated Monitor',
        checkFrequency: 30,
      });

      expect(result).toEqual(mockUpdatedMonitor);
      expect(MonitorJobQueue.scheduleRecurringEvaluation).toHaveBeenCalledWith(
        'monitor-123',
        'user-123',
        30
      );
    });

    it('should remove recurring evaluation when deactivated', async () => {
      const mockUpdatedMonitor = {
        id: 'monitor-123',
        isActive: false,
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockUpdatedMonitor]);

      const { MonitorJobQueue } = await import('./job_queue');
      (MonitorJobQueue.removeRecurringEvaluation as any).mockResolvedValue(true);

      await MonitorService.updateMonitor('monitor-123', 'user-123', {
        isActive: false,
      });

      expect(MonitorJobQueue.removeRecurringEvaluation).toHaveBeenCalledWith('monitor-123');
    });

    it('should schedule evaluation when reactivated', async () => {
      const mockUpdatedMonitor = {
        id: 'monitor-123',
        isActive: true,
        checkFrequency: 60,
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockUpdatedMonitor]);

      const { MonitorJobQueue } = await import('./job_queue');
      (MonitorJobQueue.scheduleRecurringEvaluation as any).mockResolvedValue('job-123');

      await MonitorService.updateMonitor('monitor-123', 'user-123', {
        isActive: true,
      });

      expect(MonitorJobQueue.scheduleRecurringEvaluation).toHaveBeenCalledWith(
        'monitor-123',
        'user-123',
        60
      );
    });

    it('should throw error if monitor not found', async () => {
      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([]);

      await expect(
        MonitorService.updateMonitor('nonexistent', 'user-123', { name: 'Updated' })
      ).rejects.toThrow('Monitor not found');
    });
  });

  describe('deleteMonitor', () => {
    it('should delete monitor and stop evaluations', async () => {
      const mockMonitor = { id: 'monitor-123' };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      const { MonitorJobQueue } = await import('./job_queue');
      (MonitorJobQueue.removeRecurringEvaluation as any).mockResolvedValue(true);

      const result = await MonitorService.deleteMonitor('monitor-123', 'user-123');

      expect(result).toBe(true);
      expect(MonitorJobQueue.removeRecurringEvaluation).toHaveBeenCalledWith('monitor-123');
      expect(db.delete).toHaveBeenCalled();
    });

    it('should throw error if monitor not found', async () => {
      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([]);

      await expect(
        MonitorService.deleteMonitor('nonexistent', 'user-123')
      ).rejects.toThrow('Monitor not found');
    });
  });

  describe('getMonitor', () => {
    it('should return monitor with latest facts', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        userId: 'user-123',
      };

      const mockFacts = [
        {
          id: 'fact-1',
          value: 'fact value 1',
          extractedAt: new Date(),
        },
        {
          id: 'fact-2', 
          value: 'fact value 2',
          extractedAt: new Date(),
        },
      ];

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockMonitor]).mockResolvedValueOnce(mockFacts);

      const result = await MonitorService.getMonitor('monitor-123', 'user-123');

      expect(result).toEqual({
        ...mockMonitor,
        latestFacts: mockFacts,
      });
    });

    it('should return null if monitor not found', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([]);

      const result = await MonitorService.getMonitor('nonexistent', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('triggerManualEvaluation', () => {
    it('should trigger manual evaluation for active monitor', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        isActive: true,
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockMonitor]);

      const { MonitorJobQueue } = await import('./job_queue');
      (MonitorJobQueue.addEvaluationJob as any).mockResolvedValue('job-123');

      const result = await MonitorService.triggerManualEvaluation('monitor-123', 'user-123');

      expect(result).toEqual({
        success: true,
        jobId: 'job-123',
      });
      expect(MonitorJobQueue.addEvaluationJob).toHaveBeenCalledWith(
        'monitor-123',
        'user-123',
        { scheduled: false, priority: 20 }
      );
    });

    it('should fail for inactive monitor', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        isActive: false,
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockMonitor]);

      const result = await MonitorService.triggerManualEvaluation('monitor-123', 'user-123');

      expect(result).toEqual({
        success: false,
        error: 'Monitor is not active',
      });
    });

    it('should fail for non-existent monitor', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([]);

      const result = await MonitorService.triggerManualEvaluation('nonexistent', 'user-123');

      expect(result).toEqual({
        success: false,
        error: 'Monitor not found',
      });
    });

    it('should handle errors gracefully', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        isActive: true,
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockMonitor]);

      const { MonitorJobQueue } = await import('./job_queue');
      (MonitorJobQueue.addEvaluationJob as any).mockRejectedValue(new Error('Queue error'));

      const result = await MonitorService.triggerManualEvaluation('monitor-123', 'user-123');

      expect(result).toEqual({
        success: false,
        error: 'Queue error',
      });
    });
  });

  describe('testMonitor', () => {
    it('should test monitor configuration', async () => {
      const { MonitorEvaluationService } = await import('./evaluation_service');
      (MonitorEvaluationService.evaluateMonitor as any).mockResolvedValue({
        success: true,
        value: 'test result',
        processingTime: 1500,
      });

      const result = await MonitorService.testMonitor('user-123', {
        name: 'Test Monitor',
        prompt: 'Test prompt',
        type: 'state',
        extractedFact: 'test fact',
        triggerCondition: 'value !== null',
        factType: 'string',
      });

      expect(result).toEqual({
        success: true,
        extractedValue: 'test result',
        processingTime: 1500,
      });
      expect(MonitorEvaluationService.evaluateMonitor).toHaveBeenCalledWith('test-monitor');
    });

    it('should handle evaluation errors', async () => {
      const { MonitorEvaluationService } = await import('./evaluation_service');
      (MonitorEvaluationService.evaluateMonitor as any).mockResolvedValue({
        success: false,
        error: 'Evaluation failed',
      });

      const result = await MonitorService.testMonitor('user-123', {
        name: 'Test Monitor',
        prompt: 'Test prompt',
        type: 'state',
        extractedFact: 'test fact',
        triggerCondition: 'value !== null',
        factType: 'string',
      });

      expect(result).toEqual({
        success: false,
        error: 'Evaluation failed',
      });
    });
  });
});