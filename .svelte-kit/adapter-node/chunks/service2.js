import { db } from "./connection.js";
import { u as users, h as userPreferences, i as emailVerificationTokens, s as sessions, p as passwordResetTokens } from "./users.js";
import { J as JWTService } from "./jwt.js";
import bcrypt from "@node-rs/bcrypt";
import { z } from "zod";
import { eq, and, gt } from "drizzle-orm";
const PasswordSchema = z.string().min(8, "Password must be at least 8 characters long").max(100, "Password must be less than 100 characters").refine(
  (password2) => /[A-Z]/.test(password2),
  "Password must contain at least one uppercase letter"
).refine(
  (password2) => /[a-z]/.test(password2),
  "Password must contain at least one lowercase letter"
).refine(
  (password2) => /\d/.test(password2),
  "Password must contain at least one number"
).refine(
  (password2) => /[!@#$%^&*(),.?":{}|<>]/.test(password2),
  "Password must contain at least one special character"
);
class PasswordService {
  static SALT_ROUNDS = 12;
  static async hash(password2) {
    try {
      return await bcrypt.hash(password2, this.SALT_ROUNDS);
    } catch (error) {
      console.error("Password hashing failed:", error);
      throw new Error("Failed to hash password");
    }
  }
  static async verify(password2, hashedPassword) {
    try {
      return await bcrypt.verify(password2, hashedPassword);
    } catch (error) {
      console.error("Password verification failed:", error);
      return false;
    }
  }
  static checkStrength(password2) {
    let score = 0;
    const feedback = [];
    if (password2.length >= 8) {
      score += 1;
    } else {
      feedback.push("Use at least 8 characters");
    }
    if (/[a-z]/.test(password2)) score += 1;
    else feedback.push("Add lowercase letters");
    if (/[A-Z]/.test(password2)) score += 1;
    else feedback.push("Add uppercase letters");
    if (/\d/.test(password2)) score += 1;
    else feedback.push("Add numbers");
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password2)) score += 1;
    else feedback.push("Add special characters");
    if (password2.length >= 12) score += 1;
    if (password2.length >= 16) score += 1;
    if (/(.)\1{2,}/.test(password2)) {
      score = Math.max(0, score - 1);
      feedback.push("Avoid repeated characters");
    }
    if (/123456|password|qwerty|admin/i.test(password2)) {
      score = Math.max(0, score - 2);
      feedback.push("Avoid common patterns");
    }
    score = Math.min(4, score);
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Excellent"];
    const strengthLabel = strengthLabels[score] || "Very Weak";
    return {
      score,
      feedback: feedback.length > 0 ? feedback : [`Password strength: ${strengthLabel}`],
      isValid: score >= 3
      // Require at least "Good" strength
    };
  }
  static validate(password2) {
    const result = PasswordSchema.safeParse(password2);
    if (result.success) {
      const strength = this.checkStrength(password2);
      if (strength.isValid) {
        return { isValid: true, errors: [] };
      } else {
        return {
          isValid: false,
          errors: ["Password is not strong enough", ...strength.feedback]
        };
      }
    } else {
      return {
        isValid: false,
        errors: result.error.errors.map((err) => err.message)
      };
    }
  }
  static generateSecureToken(length = 32) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      token += charset[randomIndex];
    }
    return token;
  }
}
const password = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PasswordSchema,
  PasswordService
}, Symbol.toStringTag, { value: "Module" }));
const RegisterSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  name: z.string().min(1, "Name is required").max(100),
  password: z.string().min(1, "Password is required")
});
const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(1, "New password is required")
});
class AuthService {
  static async register(data) {
    const validation = RegisterSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: "Validation failed",
        errors: validation.error.errors.map((err) => err.message)
      };
    }
    const { email, name, password: password2 } = validation.data;
    const passwordValidation = PasswordService.validate(password2);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: "Password validation failed",
        errors: passwordValidation.errors
      };
    }
    try {
      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) {
        return {
          success: false,
          error: "User already exists with this email"
        };
      }
      const passwordHash = await PasswordService.hash(password2);
      const [newUser] = await db.insert(users).values({
        email,
        name,
        passwordHash,
        emailVerified: false,
        // Will be verified via email
        isBetaUser: false
      }).returning();
      await db.insert(userPreferences).values({
        userId: newUser.id,
        emailNotifications: true,
        timezone: "UTC"
      });
      const verificationToken = PasswordService.generateSecureToken(32);
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await db.insert(emailVerificationTokens).values({
        userId: newUser.id,
        token: verificationToken,
        email: newUser.email,
        expiresAt: verificationExpiry
      });
      const tokens = JWTService.generateTokenPair({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      });
      const [session] = await db.insert(sessions).values({
        userId: newUser.id,
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt
      }).returning();
      const userResult = {
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
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Registration failed. Please try again."
      };
    }
  }
  static async login(data) {
    const validation = LoginSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid email or password"
      };
    }
    const { email, password: password2 } = validation.data;
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.passwordHash) {
        return {
          success: false,
          error: "Invalid email or password"
        };
      }
      const isValidPassword = await PasswordService.verify(password2, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          error: "Invalid email or password"
        };
      }
      await db.update(users).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(users.id, user.id));
      const tokens = JWTService.generateTokenPair({
        id: user.id,
        email: user.email,
        name: user.name
      });
      const [session] = await db.insert(sessions).values({
        userId: user.id,
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt
      }).returning();
      const userResult = {
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
      console.error("Login error:", error);
      return {
        success: false,
        error: "Login failed. Please try again."
      };
    }
  }
  static async logout(sessionToken) {
    try {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Logout failed" };
    }
  }
  static async refreshTokens(refreshToken) {
    try {
      const payload = JWTService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return { success: false, error: "Invalid refresh token" };
      }
      const [session] = await db.select().from(sessions).where(and(
        eq(sessions.refreshToken, refreshToken),
        gt(sessions.refreshExpiresAt, /* @__PURE__ */ new Date())
      ));
      if (!session) {
        return { success: false, error: "Session expired or invalid" };
      }
      const [user] = await db.select().from(users).where(eq(users.id, session.userId));
      if (!user) {
        return { success: false, error: "User not found" };
      }
      const tokens = JWTService.generateTokenPair({
        id: user.id,
        email: user.email,
        name: user.name
      });
      await db.update(sessions).set({
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt,
        lastUsedAt: /* @__PURE__ */ new Date()
      }).where(eq(sessions.id, session.id));
      const userResult = {
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
      console.error("Token refresh error:", error);
      return { success: false, error: "Token refresh failed" };
    }
  }
  static async requestPasswordReset(email) {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return { success: true };
      }
      await db.update(passwordResetTokens).set({ isUsed: true }).where(and(eq(passwordResetTokens.userId, user.id), eq(passwordResetTokens.isUsed, false)));
      const resetToken = PasswordService.generateSecureToken(32);
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1e3);
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: resetToken,
        expiresAt: resetExpiry
      });
      console.log(`Password reset token for ${email}: ${resetToken}`);
      return { success: true };
    } catch (error) {
      console.error("Password reset request error:", error);
      return { success: false, error: "Password reset request failed" };
    }
  }
  static async resetPassword(data) {
    const validation = ResetPasswordSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid request data"
      };
    }
    const { token, newPassword } = validation.data;
    const passwordValidation = PasswordService.validate(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: "Password validation failed",
        errors: passwordValidation.errors
      };
    }
    try {
      const [resetToken] = await db.select().from(passwordResetTokens).where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.isUsed, false),
        gt(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date())
      ));
      if (!resetToken) {
        return { success: false, error: "Invalid or expired reset token" };
      }
      const passwordHash = await PasswordService.hash(newPassword);
      await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));
      await db.update(passwordResetTokens).set({ isUsed: true }).where(eq(passwordResetTokens.id, resetToken.id));
      await db.delete(sessions).where(eq(sessions.userId, resetToken.userId));
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, error: "Password reset failed" };
    }
  }
  static async verifyEmail(token) {
    try {
      const [verificationToken] = await db.select().from(emailVerificationTokens).where(and(
        eq(emailVerificationTokens.token, token),
        eq(emailVerificationTokens.isUsed, false),
        gt(emailVerificationTokens.expiresAt, /* @__PURE__ */ new Date())
      ));
      if (!verificationToken) {
        return { success: false, error: "Invalid or expired verification token" };
      }
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, verificationToken.userId));
      await db.update(emailVerificationTokens).set({ isUsed: true }).where(eq(emailVerificationTokens.id, verificationToken.id));
      return { success: true };
    } catch (error) {
      console.error("Email verification error:", error);
      return { success: false, error: "Email verification failed" };
    }
  }
  static async getCurrentUser(sessionToken) {
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
      console.error("Get current user error:", error);
      return null;
    }
  }
}
export {
  AuthService as A,
  password as p
};
