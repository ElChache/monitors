import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
}

export class JWTService {
  static generateTokenPair(user: { id: string; email: string; name: string }): TokenPair {
    const now = new Date();
    const accessExpiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const accessPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      type: 'access'
    };

    const refreshPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
      expiresIn: '15m',
      issuer: 'monitors-app',
      audience: 'monitors-users'
    });

    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
      expiresIn: '7d',
      issuer: 'monitors-app',
      audience: 'monitors-users'
    });

    return {
      accessToken,
      refreshToken,
      expiresAt: accessExpiry,
      refreshExpiresAt: refreshExpiry
    };
  }

  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'monitors-app',
        audience: 'monitors-users'
      }) as JWTPayload;

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      console.error('Access token verification failed:', error);
      return null;
    }
  }

  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'monitors-app',
        audience: 'monitors-users'
      }) as JWTPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  }

  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }
}