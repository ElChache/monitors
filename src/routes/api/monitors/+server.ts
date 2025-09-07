import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { MonitorService } from '$lib/server/monitoring';
import { JWTService } from '$lib/server/auth/jwt';

// Validation schemas for monitor operations
const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  prompt: z.string().min(10).max(1000),
  type: z.enum(['state', 'change']),
  extractedFact: z.string().min(1).max(500),
  triggerCondition: z.string().min(1).max(500),
  factType: z.enum(['number', 'string', 'boolean', 'object']),
  checkFrequency: z.number().min(5).max(1440).optional().default(60), // 5 minutes to 24 hours
});

const listMonitorsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  active: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
});

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

    // Get monitors for user using new MonitorService
    const monitors = await MonitorService.getUserMonitors(payload.userId);

    // Apply filtering if needed
    let filteredMonitors = monitors;
    if (query.active !== undefined) {
      filteredMonitors = monitors.filter(monitor => monitor.isActive === query.active);
    }

    // Apply pagination
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const paginatedMonitors = filteredMonitors.slice(start, end);

    const result = {
      monitors: paginatedMonitors,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: filteredMonitors.length,
        hasMore: end < filteredMonitors.length,
      },
    };

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
    const currentMonitors = await MonitorService.getUserMonitors(payload.userId);
    if (currentMonitors.length >= 50) {
      throw error(429, {
        message: 'Monitor limit reached',
        details: 'Maximum of 50 monitors allowed per user'
      });
    }

    // Create monitor using new MonitorService (includes scheduling and initial evaluation)
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