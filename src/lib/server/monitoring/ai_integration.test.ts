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
    limit: vi.fn().mockReturnThis(),
  }
}));

// Mock job queue
vi.mock('./job_queue', () => ({
  MonitorJobQueue: {
    scheduleRecurringEvaluation: vi.fn(),
    addEvaluationJob: vi.fn(),
  }
}));

describe('MonitorService AI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI-Enhanced Monitor Creation', () => {
    it('should use AI classification when monitor fields are missing', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        userId: 'user-123',
        name: 'AI Enhanced Monitor',
        prompt: 'Monitor website status',
        type: 'state',
        extractedFact: 'test fact extraction',
        triggerCondition: 'value !== null',
        factType: 'string',
        checkFrequency: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      const { classifyPrompt } = await import('$lib/ai');

      const result = await MonitorService.createMonitor('user-123', {
        name: 'AI Enhanced Monitor',
        prompt: 'Monitor website status',
        // Missing: type, extractedFact, triggerCondition, factType
      });

      // Verify AI classification was called
      expect(classifyPrompt).toHaveBeenCalledWith('Monitor website status');

      // Verify database insert used AI-enhanced values
      expect(db.values).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'AI Enhanced Monitor',
        prompt: 'Monitor website status',
        type: 'state', // From AI classification
        extractedFact: 'test fact extraction', // From AI classification
        triggerCondition: 'value !== null', // From AI classification
        factType: 'string', // From AI classification
        checkFrequency: 60, // From AI classification
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(result).toEqual(mockMonitor);
    });

    it('should use provided values instead of AI when monitor fields are complete', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        userId: 'user-123',
        name: 'Manual Monitor',
        type: 'change',
        extractedFact: 'manual fact',
        triggerCondition: 'manual condition',
        factType: 'number',
        checkFrequency: 30,
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      const { classifyPrompt } = await import('$lib/ai');

      await MonitorService.createMonitor('user-123', {
        name: 'Manual Monitor',
        prompt: 'Monitor manually configured',
        type: 'change',
        extractedFact: 'manual fact',
        triggerCondition: 'manual condition',
        factType: 'number',
        checkFrequency: 30,
      });

      // AI should NOT be called when all fields are provided
      expect(classifyPrompt).not.toHaveBeenCalled();

      // Verify database insert used provided values
      expect(db.values).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Manual Monitor',
        prompt: 'Monitor manually configured',
        type: 'change', // User-provided
        extractedFact: 'manual fact', // User-provided
        triggerCondition: 'manual condition', // User-provided
        factType: 'number', // User-provided
        checkFrequency: 30, // User-provided
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle AI service failures gracefully with fallback', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        userId: 'user-123',
        name: 'Fallback Monitor',
        type: 'state',
        extractedFact: 'Extract value from the content',
        triggerCondition: 'Monitor for changes',
        factType: 'string',
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      const { classifyPrompt } = await import('$lib/ai');
      (classifyPrompt as any).mockRejectedValueOnce(new Error('AI service unavailable'));

      const result = await MonitorService.createMonitor('user-123', {
        name: 'Fallback Monitor',
        prompt: 'Monitor with AI failure',
        // Missing: type, extractedFact, triggerCondition, factType
      });

      // Verify AI was attempted
      expect(classifyPrompt).toHaveBeenCalledWith('Monitor with AI failure');

      // Verify fallback values were used
      expect(db.values).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Fallback Monitor',
        prompt: 'Monitor with AI failure',
        type: 'state', // Fallback default
        extractedFact: 'Extract value from the content', // Fallback default
        triggerCondition: 'Monitor for changes', // Fallback default
        factType: 'string', // Fallback default
        checkFrequency: 60, // Default
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(result).toEqual(mockMonitor);
    });

    it('should handle partial AI classification', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        type: 'state',
        extractedFact: 'test fact extraction',
        factType: 'string',
      };

      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      const { classifyPrompt } = await import('$lib/ai');

      await MonitorService.createMonitor('user-123', {
        name: 'Partial AI Monitor',
        prompt: 'Monitor with partial AI',
        type: 'state', // Provided by user
        // Missing: extractedFact, triggerCondition, factType
        checkFrequency: 45, // Provided by user
      });

      // AI should be called for missing fields
      expect(classifyPrompt).toHaveBeenCalledWith('Monitor with partial AI');

      // Verify mixed user/AI values
      expect(db.values).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Partial AI Monitor',
        prompt: 'Monitor with partial AI',
        type: 'state', // User-provided (not overridden by AI)
        extractedFact: 'test fact extraction', // From AI
        triggerCondition: 'value !== null', // From AI
        factType: 'string', // From AI
        checkFrequency: 45, // User-provided (not overridden by AI)
        isActive: true,
        evaluationCount: 0,
        triggerCount: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should log AI classification results', async () => {
      const mockMonitor = { id: 'monitor-123' };
      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await MonitorService.createMonitor('user-123', {
        name: 'Logged Monitor',
        prompt: 'Monitor with logging',
      });

      // Verify AI classification was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Using AI to classify monitor prompt: "Monitor with logging"'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'AI classification complete:',
        {
          type: 'state',
          factType: 'string',
          frequency: 60,
          confidence: 0.95
        }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Created AI-enhanced monitor monitor-123 with initial evaluation scheduled'
      );

      consoleSpy.mockRestore();
    });

    it('should log AI failures and fallback usage', async () => {
      const mockMonitor = { id: 'monitor-123' };
      const { db } = await import('../db');
      (db.returning as any).mockResolvedValueOnce([mockMonitor]);

      const { classifyPrompt } = await import('$lib/ai');
      (classifyPrompt as any).mockRejectedValueOnce(new Error('AI timeout'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await MonitorService.createMonitor('user-123', {
        name: 'Failed AI Monitor',
        prompt: 'Monitor with AI timeout',
      });

      // Verify AI failure was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'AI classification failed, using defaults:',
        new Error('AI timeout')
      );

      consoleSpy.mockRestore();
    });
  });
});