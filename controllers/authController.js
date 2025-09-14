const User = require('../models/User');
const AuthUtils = require('../utils/auth');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

class AuthController {
  // User Registration
  static async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Validation failed',
            errors.array().map(err => err.msg)
          )
        );
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'User with this email already exists',
            ['EMAIL_ALREADY_EXISTS']
          )
        );
      }

      // Validate password strength
      const passwordValidation = AuthUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Password does not meet requirements',
            passwordValidation.errors
          )
        );
      }

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      // Generate email verification token
      const emailVerificationToken = user.generateEmailVerificationToken();
      
      await user.save();

      // Send verification email
      await AuthController.sendVerificationEmail(user.email, emailVerificationToken);

      // Generate JWT tokens
      const { accessToken, refreshToken } = AuthUtils.generateTokens(user._id);

      // Return response with sanitized user data
      const sanitizedUser = AuthUtils.sanitizeUser(user);

      res.status(201).json(
        AuthUtils.generateAPIResponse(
          true,
          {
            user: sanitizedUser,
            accessToken,
            refreshToken,
            message: 'Registration successful. Please check your email to verify your account.'
          },
          'User registered successfully'
        )
      );
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json(
        AuthUtils.generateAPIResponse(false, null, 'Server error during registration')
      );
    }
  }

  // User Login
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Validation failed',
            errors.array().map(err => err.msg)
          )
        );
      }

      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+password +loginAttempts +lockUntil');

      if (!user) {
        return res.status(401).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Invalid email or password',
            ['INVALID_CREDENTIALS']
          )
        );
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Account temporarily locked due to too many failed login attempts',
            ['ACCOUNT_LOCKED']
          )
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Account is deactivated. Please contact support.',
            ['ACCOUNT_DEACTIVATED']
          )
        );
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        // Increment login attempts
        user.incLoginAttempts(() => {});
        
        return res.status(401).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Invalid email or password',
            ['INVALID_CREDENTIALS']
          )
        );
      }

      // Reset login attempts on successful login
      if (user.loginAttempts && user.loginAttempts > 0) {
        user.resetLoginAttempts(() => {});
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT tokens
      const { accessToken, refreshToken } = AuthUtils.generateTokens(user._id);

      // Return response with sanitized user data
      const sanitizedUser = AuthUtils.sanitizeUser(user);

      res.status(200).json(
        AuthUtils.generateAPIResponse(
          true,
          {
            user: sanitizedUser,
            accessToken,
            refreshToken
          },
          'Login successful'
        )
      );
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(
        AuthUtils.generateAPIResponse(false, null, 'Server error during login')
      );
    }
  }

  // Email Verification
  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Verification token is required',
            ['TOKEN_REQUIRED']
          )
        );
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid verification token
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Invalid or expired verification token',
            ['INVALID_TOKEN']
          )
        );
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      
      await user.save();

      const sanitizedUser = AuthUtils.sanitizeUser(user);

      res.status(200).json(
        AuthUtils.generateAPIResponse(
          true,
          { user: sanitizedUser },
          'Email verified successfully'
        )
      );
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json(
        AuthUtils.generateAPIResponse(false, null, 'Server error during email verification')
      );
    }
  }

  // Resend Email Verification
  static async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Email is required',
            ['EMAIL_REQUIRED']
          )
        );
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal if user exists
        return res.status(200).json(
          AuthUtils.generateAPIResponse(
            true,
            null,
            'If an account with that email exists, verification email will be sent'
          )
        );
      }

      if (user.isEmailVerified) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Email is already verified',
            ['EMAIL_ALREADY_VERIFIED']
          )
        );
      }

      // Generate new verification token
      const emailVerificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      await AuthController.sendVerificationEmail(user.email, emailVerificationToken);

      res.status(200).json(
        AuthUtils.generateAPIResponse(
          true,
          null,
          'Verification email sent successfully'
        )
      );
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json(
        AuthUtils.generateAPIResponse(false, null, 'Server error sending verification email')
      );
    }
  }

  // Get Current User Profile
  static async getProfile(req, res) {
    try {
      const sanitizedUser = AuthUtils.sanitizeUser(req.user);
      
      res.status(200).json(
        AuthUtils.generateAPIResponse(
          true,
          { user: sanitizedUser },
          'Profile retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(
        AuthUtils.generateAPIResponse(false, null, 'Server error retrieving profile')
      );
    }
  }

  // Update User Profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'Validation failed',
            errors.array().map(err => err.msg)
          )
        );
      }

      const allowedUpdates = ['firstName', 'lastName', 'preferences'];
      const updates = {};

      // Filter allowed updates
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json(
          AuthUtils.generateAPIResponse(
            false,
            null,
            'No valid updates provided',
            ['NO_VALID_UPDATES']
          )
        );
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );

      const sanitizedUser = AuthUtils.sanitizeUser(user);

      res.status(200).json(
        AuthUtils.generateAPIResponse(
          true,
          { user: sanitizedUser },
          'Profile updated successfully'
        )
      );
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json(
        AuthUtils.generateAPIResponse(false, null, 'Server error updating profile')
      );
    }
  }

  // Logout (primarily for token blacklisting in future)
  static async logout(req, res) {
    try {
      // In a full implementation, you'd blacklist the token
      // For now, just return success
      res.status(200).json(
        AuthUtils.generateAPIResponse(
          true,
          null,
          'Logged out successfully'
        )
      );
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json(
        AuthUtils.generateAPIResponse(false, null, 'Server error during logout')
      );
    }
  }

  // Helper method to send verification email
  static async sendVerificationEmail(email, token) {
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email - The Datadog of Real Life',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to The Datadog of Real Life!</h2>
            <p>Thank you for registering with our competitive intelligence platform.</p>
            <p>Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>This verification link expires in 24 hours.</strong></p>
            <hr style="border: 0; height: 1px; background: #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              If you didn't create an account, please ignore this email.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send verification email');
    }
  }
}

module.exports = AuthController;