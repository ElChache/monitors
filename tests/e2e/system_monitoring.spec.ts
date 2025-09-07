import { test, expect } from '@playwright/test';

test.describe('System Monitoring and Health Check APIs', () => {
  let adminAuthToken: string;

  test.beforeAll(async ({ request }) => {
    // Authenticate admin user and store token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'admin@monitorhub.com',
        password: 'AdminPassword123!'
      }
    });

    const loginData = await loginResponse.json();
    adminAuthToken = loginData.token;
  });

  test('system health endpoint returns complete status', async ({ request }) => {
    const healthResponse = await request.get('/api/admin/health', {
      headers: { 
        'Authorization': `Bearer ${adminAuthToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(healthResponse.status()).toBe(200);
    const healthData = await healthResponse.json();

    // Verify key service statuses
    expect(healthData).toHaveProperty('database');
    expect(healthData).toHaveProperty('redis');
    expect(healthData).toHaveProperty('emailService');
    expect(healthData).toHaveProperty('monitoringJobs');

    // Check status values
    expect(['healthy', 'degraded', 'unhealthy']).toContain(healthData.database);
    expect(['healthy', 'degraded', 'unhealthy']).toContain(healthData.redis);
    expect(['healthy', 'degraded', 'unhealthy']).toContain(healthData.emailService);
    expect(['healthy', 'degraded', 'unhealthy']).toContain(healthData.monitoringJobs);

    // Verify timestamp is recent
    const timestamp = new Date(healthData.timestamp);
    const now = new Date();
    expect(now.getTime() - timestamp.getTime()).toBeLessThan(5 * 60 * 1000); // Within 5 minutes
  });

  test('system statistics endpoint returns comprehensive metrics', async ({ request }) => {
    const statsResponse = await request.get('/api/admin/stats', {
      headers: { 
        'Authorization': `Bearer ${adminAuthToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(statsResponse.status()).toBe(200);
    const statsData = await statsResponse.json();

    // Verify user-related statistics
    expect(statsData).toHaveProperty('totalUsers');
    expect(statsData).toHaveProperty('activeUsers');
    expect(statsData).toHaveProperty('todayRegistrations');
    expect(statsData).toHaveProperty('weeklyActiveUsers');

    // Verify monitor-related statistics
    expect(statsData).toHaveProperty('totalMonitors');
    expect(statsData).toHaveProperty('averageMonitorsPerUser');
    expect(statsData).toHaveProperty('activeMonitors');

    // Validate numeric types and reasonable ranges
    expect(typeof statsData.totalUsers).toBe('number');
    expect(statsData.totalUsers).toBeGreaterThanOrEqual(0);

    expect(typeof statsData.activeUsers).toBe('number');
    expect(statsData.activeUsers).toBeGreaterThanOrEqual(0);
    expect(statsData.activeUsers).toBeLessThanOrEqual(statsData.totalUsers);
  });

  test('system configuration can be retrieved', async ({ request }) => {
    const configResponse = await request.get('/api/admin/config', {
      headers: { 
        'Authorization': `Bearer ${adminAuthToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(configResponse.status()).toBe(200);
    const configData = await configResponse.json();

    // Verify key configuration settings
    expect(configData).toHaveProperty('maxMonitorsPerUser');
    expect(configData).toHaveProperty('maxAlertsPerHour');
    expect(configData).toHaveProperty('maintenanceMode');
    expect(configData).toHaveProperty('registrationEnabled');

    // Validate configuration values
    expect(typeof configData.maxMonitorsPerUser).toBe('number');
    expect(configData.maxMonitorsPerUser).toBeGreaterThan(0);
    expect(typeof configData.maintenanceMode).toBe('boolean');
  });

  test('unauthorized user cannot access system monitoring endpoints', async ({ request }) => {
    const regularUserToken = await getRegularUserToken(request);

    const healthResponse = await request.get('/api/admin/health', {
      headers: { 
        'Authorization': `Bearer ${regularUserToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(healthResponse.status()).toBe(403);
    const errorData = await healthResponse.json();
    expect(errorData.error).toContain('Forbidden');
  });
});

// Utility function to get a regular user token
async function getRegularUserToken(request) {
  const loginResponse = await request.post('/api/auth/login', {
    data: {
      email: 'user@monitorhub.com',
      password: 'UserPassword123!'
    }
  });

  const loginData = await loginResponse.json();
  return loginData.token;
}