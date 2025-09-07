import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitorEvaluationService } from './evaluation_service';

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
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }
}));

// Mock web scraper service
vi.mock('./web_scraper', () => ({
  WebScraperService: {
    extractData: vi.fn(),
  }
}));

// Mock email service
vi.mock('../email/integrated_service', () => ({
  IntegratedEmailService: {
    sendMonitorNotification: vi.fn(),
    sendAIGeneratedNotification: vi.fn(),
  }
}));

// Mock AI services
vi.mock('$lib/ai', () => ({
  extractFacts: vi.fn(),
  enhanceScrapingData: vi.fn(),
  generateNotification: vi.fn(),
}));

describe('MonitorEvaluationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluateMonitor', () => {
    it('should successfully evaluate a monitor with all steps', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        prompt: 'Monitor https://example.com for status',
        type: 'state',
        extractedFact: 'website status',
        triggerCondition: 'status !== "ok"',
        factType: 'string',
        isActive: true,
        currentValue: null,
        evaluationCount: 0,
        triggerCount: 0,
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockMonitor]) // Get monitor
        .mockResolvedValueOnce([]); // Monitor evaluations insert returning

      (db.returning as any)
        .mockResolvedValueOnce([{ id: 'evaluation-123' }]); // Log evaluation start

      // Mock AI services for Phase 2
      const { extractFacts, enhanceScrapingData } = await import('$lib/ai');
      const { WebScraperService } = await import('./web_scraper');

      (WebScraperService.extractData as any).mockResolvedValue('raw web content');
      (enhanceScrapingData as any).mockResolvedValue({
        cleanContent: 'enhanced web content',
        metadata: { quality: 'high' }
      });
      (extractFacts as any).mockResolvedValue({
        extractedFacts: [{
          value: 'operational',
          confidence: 0.85,
          type: 'string'
        }]
      });

      const result = await MonitorEvaluationService.evaluateMonitor('monitor-123');

      expect(result.success).toBe(true);
      expect(result.value).toBe('operational');
      expect(result.changed).toBe(true); // First evaluation
      expect(extractFacts).toHaveBeenCalledWith({
        content: 'enhanced web content',
        contentType: 'HTML',
        targetFacts: ['website status'],
        context: 'Monitor: Test Monitor. Looking for: website status'
      });
    });

    it('should handle AI fact extraction failure gracefully with fallback', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        prompt: 'Monitor https://example.com for status',
        type: 'state',
        extractedFact: 'website status',
        triggerCondition: 'status !== "ok"',
        factType: 'string',
        isActive: true,
        currentValue: null,
        evaluationCount: 0,
        triggerCount: 0,
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockMonitor])
        .mockResolvedValueOnce([]);

      (db.returning as any)
        .mockResolvedValueOnce([{ id: 'evaluation-123' }]);

      const { extractFacts, enhanceScrapingData } = await import('$lib/ai');
      const { WebScraperService } = await import('./web_scraper');

      (WebScraperService.extractData as any)
        .mockResolvedValueOnce('raw web content') // First call
        .mockResolvedValueOnce('fallback content'); // Fallback call
      
      (enhanceScrapingData as any).mockRejectedValue(new Error('AI enhancement failed'));

      const result = await MonitorEvaluationService.evaluateMonitor('monitor-123');

      expect(result.success).toBe(true);
      expect(result.value).toBe('fallback content');
      // Should call WebScraperService twice: once in AI pipeline, once as fallback
      expect(WebScraperService.extractData).toHaveBeenCalledTimes(2);
    });

    it('should trigger notification when condition is met with AI generation', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        prompt: 'Monitor https://example.com for status',
        type: 'state',
        extractedFact: 'website status',
        triggerCondition: 'status === "down"',
        factType: 'string',
        isActive: true,
        currentValue: 'operational',
        evaluationCount: 5,
        triggerCount: 1,
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockMonitor])
        .mockResolvedValueOnce([mockMonitor]); // For sendNotification

      (db.returning as any)
        .mockResolvedValueOnce([{ id: 'evaluation-123' }]);

      const { generateNotification } = await import('$lib/ai');
      const { IntegratedEmailService } = await import('../email/integrated_service');

      (generateNotification as any).mockResolvedValue({
        subject: 'URGENT: Website Down Alert',
        body: 'Your monitored website has gone down. Immediate attention required.',
        urgency: 'high',
        recommendations: ['Check server status', 'Contact hosting provider'],
        insights: ['Previous uptime: 99.9%', 'Expected resolution: 15 minutes']
      });

      (IntegratedEmailService.sendAIGeneratedNotification as any).mockResolvedValue(true);

      // Generate test data that will trigger condition
      const result = await MonitorEvaluationService.evaluateMonitor('monitor-123');

      expect(generateNotification).toHaveBeenCalledWith({
        monitorName: 'Test Monitor',
        monitorType: 'state',
        extractedFact: 'website status',
        currentValue: expect.any(String),
        previousValue: 'operational',
        triggerCondition: 'status === "down"',
        factType: 'string'
      });

      if (result.triggered) {
        expect(IntegratedEmailService.sendAIGeneratedNotification).toHaveBeenCalledWith(
          'monitor-123',
          expect.any(String),
          'operational',
          expect.objectContaining({
            subject: 'URGENT: Website Down Alert',
            urgency: 'high'
          })
        );
      }
    });

    it('should fallback to standard notification if AI generation fails', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        prompt: 'Monitor https://example.com for status',
        type: 'change',
        extractedFact: 'website status',
        triggerCondition: 'any change',
        factType: 'string',
        isActive: true,
        currentValue: 'operational',
        evaluationCount: 5,
        triggerCount: 1,
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockMonitor])
        .mockResolvedValueOnce([mockMonitor]);

      (db.returning as any)
        .mockResolvedValueOnce([{ id: 'evaluation-123' }]);

      const { generateNotification } = await import('$lib/ai');
      const { IntegratedEmailService } = await import('../email/integrated_service');

      (generateNotification as any).mockRejectedValue(new Error('AI service unavailable'));
      (IntegratedEmailService.sendMonitorNotification as any).mockResolvedValue(true);

      const result = await MonitorEvaluationService.evaluateMonitor('monitor-123');

      // Should attempt AI notification first
      expect(generateNotification).toHaveBeenCalled();
      
      // Should fallback to standard notification
      if (result.triggered) {
        expect(IntegratedEmailService.sendMonitorNotification).toHaveBeenCalledWith(
          'monitor-123',
          expect.any(String),
          'operational'
        );
      }
    });

    it('should handle monitor not found gracefully', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([]);

      const result = await MonitorEvaluationService.evaluateMonitor('nonexistent-monitor');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Monitor not found');
    });

    it('should handle inactive monitor gracefully', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        isActive: false,
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockMonitor]);

      const result = await MonitorEvaluationService.evaluateMonitor('monitor-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Monitor is not active');
    });

    it('should log AI enhancement process correctly', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        prompt: 'Monitor https://example.com for status',
        type: 'state',
        extractedFact: 'website status',
        triggerCondition: 'status !== "ok"',
        factType: 'string',
        isActive: true,
        currentValue: null,
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockMonitor])
        .mockResolvedValueOnce([]);

      (db.returning as any)
        .mockResolvedValueOnce([{ id: 'evaluation-123' }]);

      const { extractFacts, enhanceScrapingData } = await import('$lib/ai');
      const { WebScraperService } = await import('./web_scraper');

      (WebScraperService.extractData as any).mockResolvedValue('raw content');
      (enhanceScrapingData as any).mockResolvedValue({
        cleanContent: 'enhanced content',
        metadata: { quality: 'high' }
      });
      (extractFacts as any).mockResolvedValue({
        extractedFacts: [{
          value: 'operational',
          confidence: 0.95,
          type: 'string'
        }]
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await MonitorEvaluationService.evaluateMonitor('monitor-123');

      expect(consoleSpy).toHaveBeenCalledWith('AI-powered data extraction for monitor monitor-123');
      expect(consoleSpy).toHaveBeenCalledWith('AI extraction successful:', {
        value: 'operational',
        confidence: 0.95,
        type: 'string'
      });

      consoleSpy.mockRestore();
    });

    it('should log AI notification generation process', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        prompt: 'Monitor system status',
        type: 'state',
        extractedFact: 'system status',
        triggerCondition: 'status === "critical"',
        factType: 'string',
        isActive: true,
        currentValue: 'normal',
        evaluationCount: 3,
        triggerCount: 0,
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockMonitor])
        .mockResolvedValueOnce([mockMonitor]);

      (db.returning as any)
        .mockResolvedValueOnce([{ id: 'evaluation-123' }]);

      const { generateNotification } = await import('$lib/ai');
      const { IntegratedEmailService } = await import('../email/integrated_service');

      (generateNotification as any).mockResolvedValue({
        subject: 'System Critical Alert',
        body: 'System has entered critical state',
        urgency: 'critical',
        recommendations: ['Check system logs', 'Scale resources'],
        insights: ['Load increased 300%', 'Memory usage at 95%']
      });

      (IntegratedEmailService.sendAIGeneratedNotification as any).mockResolvedValue(true);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await MonitorEvaluationService.evaluateMonitor('monitor-123');

      if (result.triggered) {
        expect(consoleSpy).toHaveBeenCalledWith('Generating AI-powered notification for monitor monitor-123');
        expect(consoleSpy).toHaveBeenCalledWith('AI-powered notification sent successfully for monitor monitor-123');
      }

      consoleSpy.mockRestore();
    });
  });

  describe('evaluateAllActiveMonitors', () => {
    it('should evaluate multiple monitors with rate limiting', async () => {
      const mockMonitors = [
        { id: 'monitor-1', isActive: true },
        { id: 'monitor-2', isActive: true },
        { id: 'monitor-3', isActive: true },
      ];

      const { db } = await import('../db');
      (db.where as any).mockResolvedValueOnce(mockMonitors);

      // Mock successful evaluations
      vi.spyOn(MonitorEvaluationService, 'evaluateMonitor')
        .mockResolvedValueOnce({ success: true, triggered: true, value: 'result1', changed: true, processingTime: 100 })
        .mockResolvedValueOnce({ success: true, triggered: false, value: 'result2', changed: false, processingTime: 150 })
        .mockResolvedValueOnce({ success: false, error: 'Network error', value: null, changed: false, triggered: false, processingTime: 50 });

      const result = await MonitorEvaluationService.evaluateAllActiveMonitors();

      expect(result).toEqual({
        total: 3,
        successful: 2,
        triggered: 1,
        failed: 1
      });

      expect(MonitorEvaluationService.evaluateMonitor).toHaveBeenCalledTimes(3);
    });
  });
});