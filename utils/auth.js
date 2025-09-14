const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthUtils {
  static generateJWT(payload, expiresIn = process.env.JWT_EXPIRE || '7d') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  static verifyJWT(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  static generateTokens(userId) {
    const accessToken = this.generateJWT({ userId }, '15m');
    const refreshToken = this.generateJWT({ userId, type: 'refresh' }, '7d');
    
    return { accessToken, refreshToken };
  }

  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeUser(user) {
    if (!user) return null;
    
    const userObject = user.toObject ? user.toObject() : user;
    const { password, emailVerificationToken, passwordResetToken, ...sanitizedUser } = userObject;
    
    return sanitizedUser;
  }

  static generateAPIResponse(success, data = null, message = '', errors = []) {
    return {
      success,
      data,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AuthUtils;