import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, PUT, DELETE } from './+server';

// Mock the services
vi.mock('$lib/server/monitoring/monitor_service', () => ({
  MonitorService: {
    createMonitor: vi.fn(),
    getUserMonitors: vi.fn(),
    updateMonitor: vi.fn(),
    deleteMonitor: vi.fn(),
  }
}));

vi.mock('$lib/server/auth/service', () => ({
  AuthService: {
    getCurrentUser: vi.fn(),
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

describe('/api/monitors API endpoints', () => {
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
    
    mockParams = {};
  });

  describe('POST /api/monitors', () => {
    it('should create a monitor with valid authentication', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockMonitor = {
        id: 'monitor-123',
        name: 'Test Monitor',
        prompt: 'Monitor website availability',
        type: 'state',
        isActive: true,
      };

      // Setup mocks
      mockRequest.headers.get.mockReturnValue('Bearer valid-token');
      mockRequest.json.mockResolvedValue({
        name: 'Test Monitor',
        prompt: 'Monitor website availability',
        type: 'state',
        extractedFact: 'status',
        triggerCondition: 'status !== 200',
        factType: 'number'
      });

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const { MonitorService } = await import('$lib/server/monitoring/monitor_service');
      (MonitorService.createMonitor as any).mockResolvedValue(mockMonitor);

      const response = await POST({ request: mockRequest, params: mockParams });

      expect(AuthService.getCurrentUser).toHaveBeenCalledWith('valid-token');
      expect(MonitorService.createMonitor).toHaveBeenCalledWith('user-123', {
        name: 'Test Monitor',
        prompt: 'Monitor website availability',
        type: 'state',
        extractedFact: 'status',
        triggerCondition: 'status !== 200',
        factType: 'number'
      });
      expect(response.status).toBe(201);
      expect(response.json).toEqual(mockMonitor);
    });

    it('should return 401 for missing authentication', async () => {
      mockRequest.headers.get.mockReturnValue(null);

      const response = await POST({ request: mockRequest, params: mockParams });

      expect(response.status).toBe(401);
      expect(response.json).toEqual({ error: 'Authentication required' });
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers.get.mockReturnValue('Bearer invalid-token');

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(null);

      const response = await POST({ request: mockRequest, params: mockParams });

      expect(response.status).toBe(401);
      expect(response.json).toEqual({ error: 'Invalid token' });
    });

    it('should return 400 for invalid request data', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockRequest.headers.get.mockReturnValue('Bearer valid-token');
      mockRequest.json.mockResolvedValue({
        // Missing required fields
        name: 'Test Monitor',
      });

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const response = await POST({ request: mockRequest, params: mockParams });

      expect(response.status).toBe(400);
      expect(response.json.error).toContain('Required');
    });

    it('should handle service errors gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockRequest.headers.get.mockReturnValue('Bearer valid-token');
      mockRequest.json.mockResolvedValue({
        name: 'Test Monitor',
        prompt: 'Monitor website availability',
        type: 'state',
        extractedFact: 'status',
        triggerCondition: 'status !== 200',
        factType: 'number'
      });

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const { MonitorService } = await import('$lib/server/monitoring/monitor_service');
      (MonitorService.createMonitor as any).mockRejectedValue(new Error('Database error'));

      const response = await POST({ request: mockRequest, params: mockParams });

      expect(response.status).toBe(500);
      expect(response.json).toEqual({ error: 'Failed to create monitor' });
    });
  });

  describe('GET /api/monitors', () => {
    it('should return user monitors with valid authentication', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockMonitors = [
        {
          id: 'monitor-1',
          name: 'Monitor 1',
          type: 'state',
          isActive: true,
          latestFacts: []
        },
        {
          id: 'monitor-2',
          name: 'Monitor 2',
          type: 'change',
          isActive: false,
          latestFacts: []
        }
      ];

      mockRequest.headers.get.mockReturnValue('Bearer valid-token');

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const { MonitorService } = await import('$lib/server/monitoring/monitor_service');
      (MonitorService.getUserMonitors as any).mockResolvedValue(mockMonitors);

      const response = await GET({ request: mockRequest, params: mockParams });

      expect(AuthService.getCurrentUser).toHaveBeenCalledWith('valid-token');
      expect(MonitorService.getUserMonitors).toHaveBeenCalledWith('user-123');
      expect(response.status).toBe(200);
      expect(response.json).toEqual({
        monitors: mockMonitors,
        total: 2
      });
    });

    it('should return 401 for missing authentication', async () => {
      mockRequest.headers.get.mockReturnValue(null);

      const response = await GET({ request: mockRequest, params: mockParams });

      expect(response.status).toBe(401);
      expect(response.json).toEqual({ error: 'Authentication required' });
    });

    it('should handle service errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockRequest.headers.get.mockReturnValue('Bearer valid-token');

      const { AuthService } = await import('$lib/server/auth/service');
      (AuthService.getCurrentUser as any).mockResolvedValue(mockUser);

      const { MonitorService } = await import('$lib/server/monitoring/monitor_service');
      (MonitorService.getUserMonitors as any).mockRejectedValue(new Error('Database error'));

      const response = await GET({ request: mockRequest, params: mockParams });

      expect(response.status).toBe(500);
      expect(response.json).toEqual({ error: 'Failed to fetch monitors' });
    });
  });
});