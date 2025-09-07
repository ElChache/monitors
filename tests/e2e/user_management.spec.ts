import { test, expect } from '@playwright/test';

test.describe('User Management API Endpoints', () => {
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

  test('list users with pagination and filtering', async ({ request }) => {
    const usersResponse = await request.get('/api/admin/users', {
      headers: { 
        'Authorization': `Bearer ${adminAuthToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        page: 1,
        limit: 50,
        role: 'user',
        status: 'active'
      }
    });

    expect(usersResponse.status()).toBe(200);
    const users = await usersResponse.json();

    expect(users.data).toBeDefined();
    expect(users.total).toBeGreaterThan(0);
    expect(users.page).toBe(1);
    expect(users.limit).toBe(50);
  });

  test('update user role', async ({ request }) => {
    // Assume we have a test user ID
    const testUserId = 'test_user_123';

    const updateResponse = await request.post('/api/admin/users', {
      headers: { 
        'Authorization': `Bearer ${adminAuthToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        action: 'updateRole',
        userId: testUserId,
        isAdmin: true
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateResult = await updateResponse.json();

    expect(updateResult.success).toBe(true);
    expect(updateResult.user.role).toBe('admin');
  });

  test('update user status', async ({ request }) => {
    const testUserId = 'test_user_456';

    const updateResponse = await request.post('/api/admin/users', {
      headers: { 
        'Authorization': `Bearer ${adminAuthToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        action: 'updateStatus',
        userId: testUserId,
        isActive: false
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateResult = await updateResponse.json();

    expect(updateResult.success).toBe(true);
    expect(updateResult.user.isActive).toBe(false);
  });

  test('delete user', async ({ request }) => {
    const testUserId = 'test_user_789';

    const deleteResponse = await request.post('/api/admin/users', {
      headers: { 
        'Authorization': `Bearer ${adminAuthToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        action: 'deleteUser',
        userId: testUserId
      }
    });

    expect(deleteResponse.status()).toBe(200);
    const deleteResult = await deleteResponse.json();

    expect(deleteResult.success).toBe(true);
    expect(deleteResult.message).toContain('User deleted');
  });

  test('unauthorized user cannot manage users', async ({ request }) => {
    const regularUserToken = await getRegularUserToken(request);

    const updateResponse = await request.post('/api/admin/users', {
      headers: { 
        'Authorization': `Bearer ${regularUserToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        action: 'updateRole',
        userId: 'test_user_123',
        isAdmin: true
      }
    });

    expect(updateResponse.status()).toBe(403);
    const errorResponse = await updateResponse.json();

    expect(errorResponse.error).toContain('Forbidden');
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