import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from './service';
import { JWTService } from './jwt';
import { PasswordService } from './password';

// Mock the database
vi.mock('../../db/connection', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
}));

// Mock JWT service
vi.mock('./jwt', () => ({
  JWTService: {
    generateTokenPair: vi.fn(),
    verifyToken: vi.fn(),
    refreshTokenPair: vi.fn(),
  }
}));

// Mock Password service
vi.mock('./password', () => ({
  PasswordService: {
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        refreshExpiresAt: new Date(Date.now() + 604800000)
      };

      // Setup mocks
      const { db } = await import('../../db/connection');
      (db.returning as any).mockResolvedValueOnce([mockUser]);
      (PasswordService.hashPassword as any).mockResolvedValue('hashed-password');
      (JWTService.generateTokenPair as any).mockResolvedValue(mockTokens);

      const result = await AuthService.registerUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      });

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          emailVerified: false,
          isActive: true
        },
        tokens: mockTokens
      });

      expect(PasswordService.hashPassword).toHaveBeenCalledWith('password123');
      expect(JWTService.generateTokenPair).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error for duplicate email', async () => {
      const { db } = await import('../../db/connection');
      (db.returning as any).mockRejectedValueOnce(new Error('duplicate key value'));

      await expect(
        AuthService.registerUser({
          email: 'existing@example.com',
          name: 'Test User',
          password: 'password123'
        })
      ).rejects.toThrow();
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        isActive: true,
        emailVerified: true
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        refreshExpiresAt: new Date(Date.now() + 604800000)
      };

      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([mockUser]);
      (PasswordService.verifyPassword as any).mockResolvedValue(true);
      (JWTService.generateTokenPair as any).mockResolvedValue(mockTokens);

      const result = await AuthService.loginUser('test@example.com', 'password123');

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          emailVerified: true,
          isActive: true
        },
        tokens: mockTokens
      });

      expect(PasswordService.verifyPassword).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(JWTService.generateTokenPair).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error for invalid credentials', async () => {
      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([]);

      await expect(
        AuthService.loginUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true
      };

      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([mockUser]);
      (PasswordService.verifyPassword as any).mockResolvedValue(false);

      await expect(
        AuthService.loginUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: false
      };

      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([mockUser]);
      (PasswordService.verifyPassword as any).mockResolvedValue(true);

      await expect(
        AuthService.loginUser('test@example.com', 'password123')
      ).rejects.toThrow('Account is deactivated');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user from valid token', async () => {
      const mockTokenPayload = {
        userId: 'user-123',
        type: 'access'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        isActive: true
      };

      (JWTService.verifyToken as any).mockResolvedValue(mockTokenPayload);
      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([mockUser]);

      const result = await AuthService.getCurrentUser('valid-token');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        emailVerified: true,
        isActive: true
      });

      expect(JWTService.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('should return null for invalid token', async () => {
      (JWTService.verifyToken as any).mockRejectedValue(new Error('Invalid token'));

      const result = await AuthService.getCurrentUser('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const mockTokenPayload = {
        userId: 'user-123',
        type: 'access'
      };

      (JWTService.verifyToken as any).mockResolvedValue(mockTokenPayload);
      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([]);

      const result = await AuthService.getCurrentUser('valid-token');

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'valid-refresh-token',
        refreshExpiresAt: new Date(Date.now() + 86400000), // Future date
      };

      const mockNewTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        refreshExpiresAt: new Date(Date.now() + 604800000)
      };

      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([mockSession]);
      (JWTService.refreshTokenPair as any).mockResolvedValue(mockNewTokens);

      const result = await AuthService.refreshToken('valid-refresh-token');

      expect(result).toEqual(mockNewTokens);
      expect(JWTService.refreshTokenPair).toHaveBeenCalledWith('user-123');
    });

    it('should throw error for expired refresh token', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'expired-refresh-token',
        refreshExpiresAt: new Date(Date.now() - 86400000), // Past date
      };

      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([mockSession]);

      await expect(
        AuthService.refreshToken('expired-refresh-token')
      ).rejects.toThrow('Refresh token expired');
    });

    it('should throw error for invalid refresh token', async () => {
      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([]);

      await expect(
        AuthService.refreshToken('invalid-refresh-token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logoutUser', () => {
    it('should logout user and invalidate session', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'refresh-token'
      };

      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([mockSession]);
      (db.returning as any).mockResolvedValueOnce([mockSession]);

      const result = await AuthService.logoutUser('refresh-token');

      expect(result).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it('should return false for invalid refresh token', async () => {
      const { db } = await import('../../db/connection');
      (db.limit as any).mockResolvedValueOnce([]);

      const result = await AuthService.logoutUser('invalid-refresh-token');

      expect(result).toBe(false);
    });
  });
});