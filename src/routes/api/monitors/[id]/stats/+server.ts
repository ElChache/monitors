import { json, type RequestHandler } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt';
import { MonitorService } from '$lib/server/monitoring';

/**
 * GET /api/monitors/[id]/stats - Get monitor statistics and insights
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
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

    // Get monitor statistics
    const stats = await MonitorService.getMonitorStats(monitorId);

    return json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('Monitor stats endpoint error:', error);
    
    if (error.message?.includes('expired')) {
      return json({ error: 'Session expired' }, { status: 401 });
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};