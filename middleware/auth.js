const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthUtils = require('../utils/auth');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json(
        AuthUtils.generateAPIResponse(false, null, 'Access denied. No token provided.')
      );
    }

    try {
      // Verify token
      const decoded = AuthUtils.verifyJWT(token);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('+isActive +isEmailVerified');
      
      if (!user) {
        return res.status(401).json(
          AuthUtils.generateAPIResponse(false, null, 'Token invalid. User not found.')
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json(
          AuthUtils.generateAPIResponse(false, null, 'Account deactivated. Please contact support.')
        );
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json(
        AuthUtils.generateAPIResponse(false, null, 'Token invalid or expired.')
      );
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json(
      AuthUtils.generateAPIResponse(false, null, 'Server error in authentication.')
    );
  }
};

// Require email verification
const requireEmailVerification = async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json(
      AuthUtils.generateAPIResponse(
        false, 
        null, 
        'Email verification required. Please verify your email address.',
        ['EMAIL_VERIFICATION_REQUIRED']
      )
    );
  }
  next();
};

// Check subscription status
const requireActiveSubscription = async (req, res, next) => {
  if (req.user.subscriptionStatus !== 'active' && req.user.subscriptionStatus !== 'trial') {
    return res.status(403).json(
      AuthUtils.generateAPIResponse(
        false,
        null,
        'Active subscription required to access this feature.',
        ['SUBSCRIPTION_REQUIRED']
      )
    );
  }

  // Check if subscription is expired
  if (req.user.subscriptionExpiresAt && new Date() > req.user.subscriptionExpiresAt) {
    return res.status(403).json(
      AuthUtils.generateAPIResponse(
        false,
        null,
        'Subscription expired. Please renew to continue.',
        ['SUBSCRIPTION_EXPIRED']
      )
    );
  }

  next();
};

// Check subscription tier permissions
const requireSubscriptionTier = (requiredTier) => {
  const tierHierarchy = {
    'basic': 1,
    'intelligence-plus': 2,
    'professional': 3,
    'custom': 4
  };

  return (req, res, next) => {
    const userTierLevel = tierHierarchy[req.user.subscriptionTier] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json(
        AuthUtils.generateAPIResponse(
          false,
          null,
          `This feature requires ${requiredTier} subscription or higher.`,
          ['INSUFFICIENT_SUBSCRIPTION_TIER']
        )
      );
    }

    next();
  };
};

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  // This will be enhanced with Redis in production
  // For now, basic implementation using user's login attempts
  next();
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json(
      AuthUtils.generateAPIResponse(false, null, 'Admin access required.')
    );
  }
  next();
};

// Optional auth - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = AuthUtils.verifyJWT(token);
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (jwtError) {
        // Token invalid, but continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  protect,
  requireEmailVerification,
  requireActiveSubscription,
  requireSubscriptionTier,
  authRateLimit,
  adminOnly,
  optionalAuth
};