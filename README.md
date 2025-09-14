# User Registration & Authentication System

Backend implementation for The Datadog of Real Life competitive intelligence platform.

## 🎯 Project Overview

This is the backend authentication system for our revolutionary competitive intelligence platform. It provides secure user registration, login, email verification, and profile management with enterprise-grade security features.

## ✨ Features

### Core Authentication
- **Secure Registration**: Email/password registration with comprehensive validation
- **JWT Authentication**: Access and refresh token system
- **Email Verification**: Automated email verification workflow
- **Password Security**: bcrypt hashing with salt rounds
- **Account Security**: Login attempt limiting and account locking

### Security Features
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Secure cross-origin resource sharing
- **Helmet Security**: HTTP security headers
- **Password Strength**: Enforced strong password requirements

### User Management
- **Profile Management**: Update user information and preferences
- **Subscription Tiers**: Basic, Intelligence Plus, Professional, Custom
- **Account Status**: Active/inactive user management
- **Preferences**: Notification and localization settings

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation

```bash
# Clone the repository and navigate to project
cd /path/to/project/agent_workspaces/be_aisha_8491/be_561_user_registration

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with actual values
# Edit .env with your MongoDB URI, JWT secret, email settings, etc.
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/competitive-intelligence

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@competitive-intelligence.com

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": false,
      "subscriptionTier": "basic"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  },
  "message": "Registration successful"
}
```

#### POST /api/auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "...user data..." },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  },
  "message": "Login successful"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "...complete user profile..." }
  },
  "message": "Profile retrieved successfully"
}
```

#### PUT /api/auth/profile
Update user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "preferences": {
    "notifications": {
      "email": true,
      "push": false
    },
    "timezone": "America/New_York"
  }
}
```

#### GET /api/auth/verify-email/:token
Verify user email address.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "...user data with isEmailVerified: true..." }
  },
  "message": "Email verified successfully"
}
```

## 🏗️ Project Structure

```
be_561_user_registration/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   └── authController.js    # Authentication business logic
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   └── User.js              # User database model
├── routes/
│   └── auth.js              # Authentication route definitions
├── tests/
│   ├── auth.test.js         # Authentication tests
│   └── setup.js             # Test configuration
├── utils/
│   └── auth.js              # Authentication utilities
├── validators/
│   └── authValidators.js    # Request validation schemas
├── .env.example             # Environment variables template
├── .eslintrc.js             # ESLint configuration
├── jest.config.js           # Jest testing configuration
├── package.json             # Project dependencies and scripts
└── server.js                # Express server entry point
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

### Test Coverage
- User registration validation
- Login authentication flow
- Email verification process
- Profile management
- Security features (rate limiting, password hashing)
- Error handling scenarios

## 🔒 Security Features

### Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, numbers, and special characters
- bcrypt hashing with salt rounds
- Password change history (future enhancement)

### Account Protection
- Maximum 5 failed login attempts
- Account lockout for 2 hours after failed attempts
- Email verification required for sensitive operations

### API Security
- JWT token authentication
- Rate limiting on authentication endpoints
- CORS protection
- HTTP security headers via Helmet
- Input validation and sanitization

## 📊 User Model Schema

The User model includes:

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  isEmailVerified: Boolean (default: false),
  subscriptionTier: String (enum: basic, intelligence-plus, professional, custom),
  subscriptionStatus: String (enum: active, inactive, cancelled, trial),
  subscriptionExpiresAt: Date,
  preferences: {
    notifications: { email, push, sms },
    timezone: String,
    language: String
  },
  timestamps: { createdAt, updatedAt }
}
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production MongoDB URI
4. Set up email service credentials
5. Configure CORS for production domains

### Production Considerations
- Use environment-specific configurations
- Enable logging and monitoring
- Set up database backups
- Configure load balancing for high availability
- Implement token refresh mechanism

## 🤝 Contributing

This is part of the VCorp agent workspace system. Follow the established patterns:

1. Work within the assigned agent workspace
2. Follow the established branch naming convention
3. Write comprehensive tests for new features
4. Follow ESLint configuration
5. Document API changes

## 📝 License

Private - VCorp Development Team

---

**The Datadog of Real Life** - Giving people superpowers through competitive intelligence. This authentication system is the secure foundation that protects user data while enabling extraordinary user experiences.