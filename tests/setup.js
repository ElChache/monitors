// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/competitive-intelligence-test';

// Increase test timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  createTestUser: () => ({
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe'
  }),
  
  createInvalidUser: () => ({
    email: 'invalid-email',
    password: '123',
    firstName: '',
    lastName: ''
  })
};