import { test, expect } from '@playwright/test';

test.describe('API Integration Validation', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Register a test user and get authentication token
    const registerResponse = await request.post('/api/auth/register', {
      data: {
        email: `test_user_${Date.now()}@monitorhub.com`,
        password: 'TestPassword123!',
        termsAccepted: true
      }
    });

    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();
    expect(registerData).toHaveProperty('token');
    authToken = registerData.token;
  });

  test('REST API endpoint CRUD operations', async ({ request }) => {
    // Create monitor
    const createResponse = await request.post('/api/monitors', {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Test Stock Monitor',
        prompt: 'Alert me when Tesla stock drops below $200'
      }
    });

    expect(createResponse.status()).toBe(201);
    const createdMonitor = await createResponse.json();
    expect(createdMonitor).toHaveProperty('id');
    const monitorId = createdMonitor.id;

    // Read monitor
    const readResponse = await request.get(`/api/monitors/${monitorId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(readResponse.status()).toBe(200);
    const retrievedMonitor = await readResponse.json();
    expect(retrievedMonitor.id).toBe(monitorId);

    // Update monitor
    const updateResponse = await request.put(`/api/monitors/${monitorId}`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Updated Stock Monitor',
        prompt: 'Alert me when Tesla stock drops below $190'
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updatedMonitor = await updateResponse.json();
    expect(updatedMonitor.name).toBe('Updated Stock Monitor');

    // Delete monitor
    const deleteResponse = await request.delete(`/api/monitors/${monitorId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(deleteResponse.status()).toBe(204);
  });

  test('Authentication API validation', async ({ request }) => {
    // Login with valid credentials
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@monitorhub.com',
        password: 'ValidPassword123!'
      }
    });

    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty('token');

    // Attempt login with invalid credentials
    const invalidLoginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'invalid@example.com',
        password: 'WrongPassword'
      }
    });

    expect(invalidLoginResponse.status()).toBe(401);
  });

  test('Rate limiting API testing', async ({ request }) => {
    const testEndpoint = '/api/monitors/refresh';
    
    // Simulate multiple rapid requests to trigger rate limiting
    const requests = Array(60).fill(0).map(async () => {
      return request.post(testEndpoint, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: { monitorId: 'test_monitor_001' }
      });
    });

    const responses = await Promise.all(requests);

    // Check for rate limit headers and status codes
    const rateLimitedResponses = responses.filter(
      response => response.status() === 429
    );

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    const lastResponse = responses[responses.length - 1];
    const headers = lastResponse.headers();
    
    expect(headers).toHaveProperty('x-ratelimit-limit');
    expect(headers).toHaveProperty('x-ratelimit-remaining');
    expect(headers).toHaveProperty('x-ratelimit-reset');
  });

  test('SendGrid email integration testing', async ({ request }) => {
    // Trigger a monitor that should send an email
    const emailTriggerResponse = await request.post('/api/monitors/test-email', {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        monitorId: 'test_monitor_email',
        testType: 'integration'
      }
    });

    expect(emailTriggerResponse.status()).toBe(200);
    const emailTestResult = await emailTriggerResponse.json();

    expect(emailTestResult).toHaveProperty('status', 'sent');
    expect(emailTestResult).toHaveProperty('providerResponse');
    expect(emailTestResult.providerResponse).toHaveProperty('messageId');
  });

  test('AI provider integration testing', async ({ request }) => {
    // Test AI classification for monitor creation
    const aiClassificationResponse = await request.post('/api/monitors/ai-test', {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        prompt: 'Alert me when Tesla drops below $200',
        testMode: 'classification'
      }
    });

    expect(aiClassificationResponse.status()).toBe(200);
    const aiClassificationResult = await aiClassificationResponse.json();

    expect(aiClassificationResult).toHaveProperty('monitorType');
    expect(aiClassificationResult).toHaveProperty('confidence');
    expect(aiClassificationResult.confidence).toBeGreaterThan(0.7);
  });

  test('Database transaction testing', async ({ request }) => {
    // Test a transaction that involves multiple database operations
    const transactionTestResponse = await request.post('/api/monitors/transaction-test', {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(transactionTestResponse.status()).toBe(200);
    const transactionResult = await transactionTestResponse.json();

    expect(transactionResult).toHaveProperty('status', 'completed');
    expect(transactionResult).toHaveProperty('operations');
    expect(transactionResult.operations.length).toBeGreaterThan(1);
  });

  test('API performance load testing', async ({ request }) => {
    const concurrentRequests = 50;
    const testEndpoint = '/api/monitors';

    const startTime = Date.now();
    const requests = Array(concurrentRequests).fill(0).map(async () => {
      return request.post(testEndpoint, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          name: 'Performance Test Monitor',
          prompt: 'Test monitor for load testing'
        }
      });
    });

    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Validate responses
    responses.forEach(response => {
      expect(response.status()).toBe(201);
    });

    // Performance assertions
    expect(totalTime).toBeLessThan(10000); // Total test should complete under 10 seconds
    const averageResponseTime = totalTime / concurrentRequests;
    expect(averageResponseTime).toBeLessThan(200); // Average response under 200ms
  });
});