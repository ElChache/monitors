import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { createMonitorSchema, listMonitorsSchema } from '$lib/server/monitors/validation';
import { MonitorService } from '$lib/server/monitors/service';
import { JWTService } from '$lib/server/auth/jwt';

// GET /api/monitors - List user's monitors with filtering
export const GET: RequestHandler = async ({ request, cookies, url }) => {
  try {
    // Verify authentication
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      throw error(401, 'Authentication required');
    }

    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload) {
      throw error(401, 'Invalid session token');
    }

    // Parse query parameters
    const queryParams = Object.fromEntries(url.searchParams);
    const query = listMonitorsSchema.parse(queryParams);

    // Get monitors for user
    const result = await MonitorService.getMonitors(payload.userId, query);

    return json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error('Get monitors error:', err);

    if (err instanceof z.ZodError) {
      throw error(400, {
        message: 'Invalid query parameters',
        details: err.errors
      });
    }

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to retrieve monitors');
  }
};

// POST /api/monitors - Create new monitor
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      throw error(401, 'Authentication required');
    }

    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload) {
      throw error(401, 'Invalid session token');
    }

    // Parse and validate request body
    const data = await request.json();
    const validatedData = createMonitorSchema.parse(data);

    // Check monitor creation limits (basic limit of 50 for now)
    const currentCount = await MonitorService.getUserMonitorCount(payload.userId);
    if (currentCount >= 50) {
      throw error(429, {
        message: 'Monitor limit reached',
        details: 'Maximum of 50 monitors allowed per user'
      });
    }

    // Create monitor
    const monitor = await MonitorService.createMonitor(payload.userId, validatedData);

    return json({
      success: true,
      message: 'Monitor created successfully',
      data: monitor
    }, { status: 201 });

  } catch (err) {
    console.error('Create monitor error:', err);

    if (err instanceof z.ZodError) {
      throw error(400, {
        message: 'Invalid monitor data',
        details: err.errors
      });
    }

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to create monitor');
  }
};