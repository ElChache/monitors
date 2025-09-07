import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './+server';

// Mock the services
vi.mock('$lib/server/monitoring', () => ({
  MonitorService: {
    getMonitor: vi.fn(),
  },
  MonitorEvaluationService: {
    evaluateMonitor: vi.fn(),
  }
}));

vi.mock('$lib/server/auth/service', () => ({
  AuthService: {
    getCurrentUser: vi.fn(),
  }
}));

vi.mock('$lib/server/security', () => ({
  userDailyLimiter: {
    checkLimit: vi.fn(),
  }
}));

// Mock SvelteKit's json helper
vi.mock('@sveltejs/kit', () => ({
  json: (data: any, init?: any) => ({
    json: data,
    status: init?.status || 200,
    headers: init?.headers || {}
  })
}));

describe('/api/monitors/[id]/refresh API endpoints', () => {
  let mockRequest: any;
  let mockParams: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = {
      headers: {
        get: vi.fn(),
      },
      json: vi.fn(),
    };
    
    mockParams = { id: 'monitor-123' };
  });

  describe('POST /api/monitors/[id]/refresh', () => {
    it('should refresh monitor when within rate limits', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        isActive: true,
      };
      const mockEvaluationResult = {
        success: true,
        triggered: false,
        previousValue: 'old-value',
        currentValue: 'new-value',
        processingTime: 1500,
      };

      // Setup mocks
      mockRequest.headers.get.mockReturnValue('Bearer valid-token');

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const { userDailyLimiter } = await import('$lib/server/security');
      (userDailyLimiter.checkLimit as any).mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetTime: new Date(Date.now() + 86400000),
        windowMs: 86400000,
      });

      const { MonitorService, MonitorEvaluationService } = await import('$lib/server/monitoring');
      (MonitorService.getMonitor as any).mockResolvedValue(mockMonitor);
      (MonitorEvaluationService.evaluateMonitor as any).mockResolvedValue(mockEvaluationResult);

      const response = await POST({ 
        request: mockRequest, 
        params: mockParams,
        getClientAddress: () => '192.168.1.1'
      });

      expect(AuthService.getCurrentUser).toHaveBeenCalledWith('valid-token');
      expect(userDailyLimiter.checkLimit).toHaveBeenCalledWith('user-123', '192.168.1.1', 'manual_refresh');
      expect(MonitorService.getMonitor).toHaveBeenCalledWith('monitor-123', 'user-123');
      expect(MonitorEvaluationService.evaluateMonitor).toHaveBeenCalledWith(
        'monitor-123',
        expect.stringMatching(/^manual-\d+$/)
      );

      expect(response.status).toBe(200);
      expect(response.json).toEqual({
        success: true,
        message: 'Monitor refreshed successfully',
        evaluation: {
          success: true,
          triggered: false,
          previousValue: 'old-value',
          currentValue: 'new-value',
          processingTime: 1500,
          evaluatedAt: expect.any(String),
        },
        rateLimit: {
          remaining: 44,
          limit: 50,
          resetTime: expect.any(String),
          window: '24 hours',
        },
        monitor: {
          id: 'monitor-123',
          name: 'Test Monitor',
          lastEvaluated: expect.any(String),
          status: 'active',
        }
      });
    });

    it('should return 429 when rate limit exceeded', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockRequest.headers.get.mockReturnValue('Bearer valid-token');

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const { userDailyLimiter } = await import('$lib/server/security');
      (userDailyLimiter.checkLimit as any).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 86400000),
        windowMs: 86400000,
      });

      const response = await POST({ 
        request: mockRequest, 
        params: mockParams,
        getClientAddress: () => '192.168.1.1'
      });

      expect(response.status).toBe(429);
      expect(response.json).toEqual({
        error: 'Daily manual refresh limit exceeded',
        message: 'You have reached your daily limit of 50 manual refreshes. Automatic monitoring continues as scheduled.',
        limit: 50,
        remaining: 0,
        resetTime: expect.any(String),
        nextReset: expect.any(Date),
      });
      
      expect(response.headers).toEqual({
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': expect.any(String),
        'Retry-After': expect.any(String),
      });
    });

    it('should return 401 for missing authentication', async () => {
      mockRequest.headers.get.mockReturnValue(null);

      const response = await POST({ 
        request: mockRequest, 
        params: mockParams,
        getClientAddress: () => '192.168.1.1'
      });

      expect(response.status).toBe(401);
      expect(response.json).toEqual({ error: 'Authentication required' });
    });

    it('should return 400 for missing monitor ID', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockRequest.headers.get.mockReturnValue('Bearer valid-token');
      const paramsWithoutId = { id: undefined };

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const response = await POST({ 
        request: mockRequest, 
        params: paramsWithoutId,
        getClientAddress: () => '192.168.1.1'
      });

      expect(response.status).toBe(400);
      expect(response.json).toEqual({ error: 'Monitor ID required' });
    });

    it('should return 404 for non-existent monitor', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockRequest.headers.get.mockReturnValue('Bearer valid-token');

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const { userDailyLimiter } = await import('$lib/server/security');
      (userDailyLimiter.checkLimit as any).mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetTime: new Date(Date.now() + 86400000),
        windowMs: 86400000,
      });

      const { MonitorService } = await import('$lib/server/monitoring');
      (MonitorService.getMonitor as any).mockResolvedValue(null);

      const response = await POST({ 
        request: mockRequest, 
        params: mockParams,
        getClientAddress: () => '192.168.1.1'
      });

      expect(response.status).toBe(404);
      expect(response.json).toEqual({ error: 'Monitor not found' });
    });

    it('should handle evaluation service errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        isActive: true,
      };

      mockRequest.headers.get.mockReturnValue('Bearer valid-token');

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const { userDailyLimiter } = await import('$lib/server/security');
      (userDailyLimiter.checkLimit as any).mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetTime: new Date(Date.now() + 86400000),
        windowMs: 86400000,
      });

      const { MonitorService, MonitorEvaluationService } = await import('$lib/server/monitoring');
      (MonitorService.getMonitor as any).mockResolvedValue(mockMonitor);
      (MonitorEvaluationService.evaluateMonitor as any).mockRejectedValue(new Error('Evaluation failed'));

      const response = await POST({ 
        request: mockRequest, 
        params: mockParams,
        getClientAddress: () => '192.168.1.1'
      });

      expect(response.status).toBe(500);
      expect(response.json).toEqual({ error: 'Internal server error' });
    });
  });
});