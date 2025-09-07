import bcrypt from '@node-rs/bcrypt';
import { z } from 'zod';

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must be less than 100 characters')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /\d/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    'Password must contain at least one special character'
  );

export interface PasswordStrength {
  score: number; // 0-4 (Weak, Fair, Good, Strong, Excellent)
  feedback: string[];
  isValid: boolean;
}

export class PasswordService {
  private static readonly SALT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  static async verify(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.verify(password, hashedPassword);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  static checkStrength(password: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Use at least 8 characters');
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    // Length bonus
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid repeated characters');
    }

    if (/123456|password|qwerty|admin/i.test(password)) {
      score = Math.max(0, score - 2);
      feedback.push('Avoid common patterns');
    }

    // Cap score at 4
    score = Math.min(4, score);

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Excellent'];
    const strengthLabel = strengthLabels[score] || 'Very Weak';

    return {
      score,
      feedback: feedback.length > 0 ? feedback : [`Password strength: ${strengthLabel}`],
      isValid: score >= 3 // Require at least "Good" strength
    };
  }

  static validate(password: string): { isValid: boolean; errors: string[] } {
    const result = PasswordSchema.safeParse(password);
    
    if (result.success) {
      const strength = this.checkStrength(password);
      if (strength.isValid) {
        return { isValid: true, errors: [] };
      } else {
        return { 
          isValid: false, 
          errors: ['Password is not strong enough', ...strength.feedback] 
        };
      }
    } else {
      return {
        isValid: false,
        errors: result.error.errors.map(err => err.message)
      };
    }
  }

  static generateSecureToken(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      token += charset[randomIndex];
    }
    
    return token;
  }
}