import { json, type RequestHandler } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt';
import { MonitorService } from '$lib/server/monitoring';
import { z } from 'zod';

const HistoryQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  aggregation: z.enum(['raw', 'hourly', 'daily']).optional().default('raw'),
});

/**
 * GET /api/monitors/[id]/history - Get monitor historical data
 */
export const GET: RequestHandler = async ({ params, cookies, url }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    const monitorId = params.id;
    if (!monitorId) {
      return json({ error: 'Monitor ID required' }, { status: 400 });
    }

    // Parse query parameters
    const queryParams = Object.fromEntries(url.searchParams);
    const validatedQuery = HistoryQuerySchema.parse(queryParams);

    // Set default time range (last 24 hours)
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const timeRange = {
      start: validatedQuery.start ? new Date(validatedQuery.start) : defaultStart,
      end: validatedQuery.end ? new Date(validatedQuery.end) : now,
    };

    // Get monitor history
    const history = await MonitorService.getMonitorHistory(
      monitorId,
      timeRange,
      validatedQuery.aggregation
    );

    return json({
      success: true,
      data: {
        history,
        timeRange,
        aggregation: validatedQuery.aggregation,
        totalPoints: history.length,
      },
    });

  } catch (error: any) {
    console.error('Monitor history endpoint error:', error);
    
    if (error.message?.includes('expired')) {
      return json({ error: 'Session expired' }, { status: 401 });
    }

    if (error.name === 'ZodError') {
      return json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};