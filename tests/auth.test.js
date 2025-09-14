const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

// Mock email service for testing
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

describe('Authentication System Tests', () => {
  let server;

  beforeAll(async () => {
    // Connect to test database
    const MONGO_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/competitive-intelligence-test';
    await mongoose.connect(MONGO_URI);
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close connections
    await mongoose.connection.close();
    if (server) {
      server.close();
    }
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validRegistrationData.email);
      expect(response.body.data.user.firstName).toBe(validRegistrationData.firstName);
      expect(response.body.data.user.lastName).toBe(validRegistrationData.lastName);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify user was created in database
      const user = await User.findOne({ email: validRegistrationData.email });
      expect(user).toBeTruthy();
      expect(user.isEmailVerified).toBe(false);
    });

    it('should not register user with invalid email', async () => {
      const invalidData = { ...validRegistrationData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Please provide a valid email address');
    });

    it('should not register user with weak password', async () => {
      const weakPasswordData = { ...validRegistrationData, password: '123' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(err => err.includes('Password must be at least 8 characters'))).toBe(true);
    });

    it('should not register user with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      // Attempt duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('EMAIL_ALREADY_EXISTS');
    });

    it('should not register user with missing required fields', async () => {
      const incompleteData = { email: 'test@example.com' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      testUser = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true
      });
      await testUser.save();
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('INVALID_CREDENTIALS');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('INVALID_CREDENTIALS');
    });

    it('should not login deactivated user', async () => {
      testUser.isActive = false;
      await testUser.save();

      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('ACCOUNT_DEACTIVATED');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;
    let testUser;

    beforeEach(async () => {
      // Create and authenticate a test user
      testUser = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true
      });
      await testUser.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      authToken = loginResponse.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.firstName).toBe('John');
      expect(response.body.data.user.lastName).toBe('Doe');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token invalid or expired');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken;
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true
      });
      await testUser.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      authToken = loginResponse.body.data.accessToken;
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        preferences: {
          notifications: {
            email: false,
            push: true
          }
        }
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Jane');
      expect(response.body.data.user.lastName).toBe('Smith');
      expect(response.body.data.user.preferences.notifications.email).toBe(false);
    });

    it('should not update profile with invalid data', async () => {
      const invalidData = {
        firstName: '',
        lastName: 'Smith'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      // Create user with email verification token
      const user = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Email verified successfully');

      // Check that user is verified in database
      const verifiedUser = await User.findById(user._id);
      expect(verifiedUser.isEmailVerified).toBe(true);
    });

    it('should not verify email with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email/invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('INVALID_TOKEN');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      // Make many requests to trigger rate limit
      const requests = Array.from({ length: 25 }, () =>
        request(app).post('/api/auth/login').send(loginData)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Features', () => {
    it('should hash passwords before saving', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      await user.save();

      expect(user.password).not.toBe('TestPassword123!');
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });

    it('should not return sensitive data in API responses', async () => {
      const registrationData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.emailVerificationToken).toBeUndefined();
    });
  });
});