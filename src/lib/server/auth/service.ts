import { db } from '../db/connection.js';
import { users, sessions, passwordResetTokens, emailVerificationTokens, userPreferences } from '../db/schemas/users.js';
import { JWTService, type TokenPair } from './jwt.js';
import { PasswordService } from './password.js';
import { eq, and, or, gt } from 'drizzle-orm';
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(1, 'Password is required'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isBetaUser: boolean;
  createdAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  tokens?: TokenPair;
  session?: { id: string; expiresAt: Date };
  error?: string;
  errors?: string[];
}

export class AuthService {
  static async register(data: z.infer<typeof RegisterSchema>): Promise<AuthResult> {
    const validation = RegisterSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.error.errors.map(err => err.message)
      };
    }

    const { email, name, password } = validation.data;

    // Validate password strength
    const passwordValidation = PasswordService.validate(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: 'Password validation failed',
        errors: passwordValidation.errors
      };
    }

    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) {
        return {
          success: false,
          error: 'User already exists with this email'
        };
      }

      // Hash password
      const passwordHash = await PasswordService.hash(password);

      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        name,
        passwordHash,
        emailVerified: false, // Will be verified via email
        isBetaUser: false,
      }).returning();

      // Create user preferences
      await db.insert(userPreferences).values({
        userId: newUser.id,
        emailNotifications: true,
        timezone: 'UTC',
      });

      // Generate email verification token
      const verificationToken = PasswordService.generateSecureToken(32);
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.insert(emailVerificationTokens).values({
        userId: newUser.id,
        token: verificationToken,
        email: newUser.email,
        expiresAt: verificationExpiry,
      });

      // Generate JWT tokens
      const tokens = JWTService.generateTokenPair({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      });

      // Create session
      const [session] = await db.insert(sessions).values({
        userId: newUser.id,
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt,
      }).returning();

      const userResult: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        emailVerified: newUser.emailVerified,
        isBetaUser: newUser.isBetaUser,
        createdAt: newUser.createdAt
      };

      return {
        success: true,
        user: userResult,
        tokens,
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  static async login(data: z.infer<typeof LoginSchema>): Promise<AuthResult> {
    const validation = LoginSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    const { email, password } = validation.data;

    try {
      // Find user
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.passwordHash) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await PasswordService.verify(password, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Update last login
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      // Generate JWT tokens
      const tokens = JWTService.generateTokenPair({
        id: user.id,
        email: user.email,
        name: user.name
      });

      // Create session
      const [session] = await db.insert(sessions).values({
        userId: user.id,
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt,
      }).returning();

      const userResult: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        isBetaUser: user.isBetaUser,
        createdAt: user.createdAt
      };

      return {
        success: true,
        user: userResult,
        tokens,
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  static async logout(sessionToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  static async refreshTokens(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify refresh token
      const payload = JWTService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return { success: false, error: 'Invalid refresh token' };
      }

      // Find active session with this refresh token
      const [session] = await db.select().from(sessions)
        .where(and(
          eq(sessions.refreshToken, refreshToken),
          gt(sessions.refreshExpiresAt, new Date())
        ));

      if (!session) {
        return { success: false, error: 'Session expired or invalid' };
      }

      // Get user data
      const [user] = await db.select().from(users).where(eq(users.id, session.userId));
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Generate new token pair
      const tokens = JWTService.generateTokenPair({
        id: user.id,
        email: user.email,
        name: user.name
      });

      // Update session
      await db.update(sessions)
        .set({
          sessionToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          refreshExpiresAt: tokens.refreshExpiresAt,
          lastUsedAt: new Date()
        })
        .where(eq(sessions.id, session.id));

      const userResult: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        isBetaUser: user.isBetaUser,
        createdAt: user.createdAt
      };

      return {
        success: true,
        user: userResult,
        tokens,
        session: {
          id: session.id,
          expiresAt: tokens.expiresAt
        }
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }

  static async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        // Don't reveal whether user exists
        return { success: true };
      }

      // Invalidate existing reset tokens
      await db.update(passwordResetTokens)
        .set({ isUsed: true })
        .where(and(eq(passwordResetTokens.userId, user.id), eq(passwordResetTokens.isUsed, false)));

      // Generate reset token
      const resetToken = PasswordService.generateSecureToken(32);
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: resetToken,
        expiresAt: resetExpiry,
      });

      // TODO: Send reset email with resetToken
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: 'Password reset request failed' };
    }
  }

  static async resetPassword(data: z.infer<typeof ResetPasswordSchema>): Promise<AuthResult> {
    const validation = ResetPasswordSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Invalid request data'
      };
    }

    const { token, newPassword } = validation.data;

    // Validate new password
    const passwordValidation = PasswordService.validate(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: 'Password validation failed',
        errors: passwordValidation.errors
      };
    }

    try {
      // Find valid reset token
      const [resetToken] = await db.select().from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.isUsed, false),
          gt(passwordResetTokens.expiresAt, new Date())
        ));

      if (!resetToken) {
        return { success: false, error: 'Invalid or expired reset token' };
      }

      // Hash new password
      const passwordHash = await PasswordService.hash(newPassword);

      // Update user password
      await db.update(users)
        .set({ passwordHash })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db.update(passwordResetTokens)
        .set({ isUsed: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      // Invalidate all sessions for this user (force re-login)
      await db.delete(sessions).where(eq(sessions.userId, resetToken.userId));

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Password reset failed' };
    }
  }

  static async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [verificationToken] = await db.select().from(emailVerificationTokens)
        .where(and(
          eq(emailVerificationTokens.token, token),
          eq(emailVerificationTokens.isUsed, false),
          gt(emailVerificationTokens.expiresAt, new Date())
        ));

      if (!verificationToken) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Update user as verified
      await db.update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, verificationToken.userId));

      // Mark token as used
      await db.update(emailVerificationTokens)
        .set({ isUsed: true })
        .where(eq(emailVerificationTokens.id, verificationToken.id));

      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Email verification failed' };
    }
  }

  static async getCurrentUser(sessionToken: string): Promise<User | null> {
    try {
      const payload = JWTService.verifyAccessToken(sessionToken);
      if (!payload) return null;

      const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        isBetaUser: user.isBetaUser,
        createdAt: user.createdAt
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}