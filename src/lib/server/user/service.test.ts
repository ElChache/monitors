import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserAccountService } from './service';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    transaction: vi.fn(),
  }
}));

// Mock auth service
vi.mock('../auth/service', () => ({
  AuthService: {
    getCurrentUser: vi.fn(),
  }
}));

describe('UserAccountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile with preferences', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        isActive: true,
        isBetaUser: false,
        lastLoginAt: new Date(),
        createdAt: new Date(),
      };

      const mockPreferences = {
        emailNotifications: true,
        webhookUrl: 'https://example.com/webhook',
        timezone: 'America/New_York',
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockUser]) // First call for user
        .mockResolvedValueOnce([mockPreferences]); // Second call for preferences

      const result = await UserAccountService.getUserProfile('user-123');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        emailVerified: true,
        isActive: true,
        isBetaUser: false,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        preferences: {
          emailNotifications: true,
          webhookUrl: 'https://example.com/webhook',
          timezone: 'America/New_York',
        },
      });
    });

    it('should return user with default preferences if none exist', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        isActive: true,
        isBetaUser: false,
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockUser]) // First call for user
        .mockResolvedValueOnce([]); // Second call for preferences (empty)

      const result = await UserAccountService.getUserProfile('user-123');

      expect(result.preferences).toEqual({
        emailNotifications: true,
        webhookUrl: null,
        timezone: 'UTC',
      });
    });

    it('should throw error if user not found', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([]);

      await expect(
        UserAccountService.getUserProfile('nonexistent')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUserPreferences', () => {
    it('should update existing preferences', async () => {
      const existingPrefs = {
        id: 'pref-123',
        emailNotifications: true,
        timezone: 'UTC',
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([existingPrefs]);
      (db.returning as any).mockResolvedValueOnce([{
        ...existingPrefs,
        emailNotifications: false,
        timezone: 'America/New_York',
      }]);

      await UserAccountService.updateUserPreferences('user-123', {
        emailNotifications: false,
        timezone: 'America/New_York',
      });

      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith({
        emailNotifications: false,
        timezone: 'America/New_York',
        updatedAt: expect.any(Date),
      });
    });

    it('should create preferences if none exist', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([]); // No existing preferences
      (db.returning as any).mockResolvedValueOnce([{
        id: 'new-pref-123',
        userId: 'user-123',
        emailNotifications: false,
        timezone: 'America/New_York',
      }]);

      await UserAccountService.updateUserPreferences('user-123', {
        emailNotifications: false,
        timezone: 'America/New_York',
      });

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith({
        userId: 'user-123',
        emailNotifications: false,
        timezone: 'America/New_York',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should validate webhook URL format', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([{}]);

      await expect(
        UserAccountService.updateUserPreferences('user-123', {
          webhookUrl: 'invalid-url',
        })
      ).rejects.toThrow('Invalid webhook URL format');
    });

    it('should validate timezone format', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([{}]);

      await expect(
        UserAccountService.updateUserPreferences('user-123', {
          timezone: 'Invalid/Timezone',
        })
      ).rejects.toThrow('Invalid timezone');
    });
  });

  describe('getUserAccountData', () => {
    it('should return comprehensive user account data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };

      const mockMonitors = [
        { id: 'monitor-1', name: 'Monitor 1' },
        { id: 'monitor-2', name: 'Monitor 2' },
      ];

      const mockSessions = [
        { id: 'session-1', createdAt: new Date(), lastUsedAt: new Date() },
      ];

      const mockPreferences = {
        emailNotifications: true,
        timezone: 'UTC',
      };

      const { db } = await import('../db');
      (db.limit as any)
        .mockResolvedValueOnce([mockUser]) // User data
        .mockResolvedValueOnce(mockMonitors) // User monitors
        .mockResolvedValueOnce(mockSessions) // User sessions
        .mockResolvedValueOnce([mockPreferences]); // User preferences

      const result = await UserAccountService.getUserAccountData('user-123');

      expect(result).toEqual({
        profile: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          createdAt: mockUser.createdAt,
        },
        monitors: mockMonitors,
        sessions: mockSessions,
        preferences: mockPreferences,
      });
    });

    it('should throw error if user not found', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([]);

      await expect(
        UserAccountService.getUserAccountData('nonexistent')
      ).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-123',
        passwordHash: 'old-hash',
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockUser]);

      // Mock bcrypt functions
      const bcrypt = await import('@node-rs/bcrypt');
      (bcrypt.verify as any).mockResolvedValue(true); // Current password is correct
      (bcrypt.hash as any).mockResolvedValue('new-hash');

      (db.returning as any).mockResolvedValueOnce([{
        ...mockUser,
        passwordHash: 'new-hash',
      }]);

      await UserAccountService.changePassword('user-123', 'current-password', 'new-password');

      expect(bcrypt.verify).toHaveBeenCalledWith('current-password', 'old-hash');
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 12);
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith({
        passwordHash: 'new-hash',
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error for incorrect current password', async () => {
      const mockUser = {
        id: 'user-123',
        passwordHash: 'old-hash',
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockUser]);

      const bcrypt = await import('@node-rs/bcrypt');
      (bcrypt.verify as any).mockResolvedValue(false); // Incorrect password

      await expect(
        UserAccountService.changePassword('user-123', 'wrong-password', 'new-password')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for OAuth users without password', async () => {
      const mockUser = {
        id: 'user-123',
        passwordHash: null, // OAuth user
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockUser]);

      await expect(
        UserAccountService.changePassword('user-123', 'current-password', 'new-password')
      ).rejects.toThrow('Cannot change password for OAuth-authenticated accounts');
    });

    it('should throw error if user not found', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([]);

      await expect(
        UserAccountService.changePassword('nonexistent', 'current-password', 'new-password')
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete user account and all associated data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([mockUser]);
      
      // Mock transaction
      (db.transaction as any).mockImplementation(async (callback) => {
        const mockClient = {
          delete: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        };
        return await callback(mockClient);
      });

      const result = await UserAccountService.deleteUserAccount('user-123');

      expect(result).toBe(true);
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      const { db } = await import('../db');
      (db.limit as any).mockResolvedValueOnce([]);

      await expect(
        UserAccountService.deleteUserAccount('nonexistent')
      ).rejects.toThrow('User not found');
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          sessionToken: 'token-1',
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: 'session-2',
          sessionToken: 'token-2',
          userAgent: 'Chrome/91.0',
          ipAddress: '192.168.1.2',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];

      const { db } = await import('../db');
      (db.orderBy as any).mockResolvedValueOnce(mockSessions);

      const result = await UserAccountService.getUserSessions('user-123');

      expect(result).toEqual(mockSessions.map(session => ({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        isActive: true, // Since expires in future
      })));
    });

    it('should handle empty sessions', async () => {
      const { db } = await import('../db');
      (db.orderBy as any).mockResolvedValueOnce([]);

      const result = await UserAccountService.getUserSessions('user-123');

      expect(result).toEqual([]);
    });
  });
});