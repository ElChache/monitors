import { json, type RequestHandler } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt';
import { MonitorEvaluationService } from '$lib/server/monitoring';

/**
 * POST /api/monitoring/evaluate-all - Trigger evaluation of all active monitors
 * This is typically used for scheduled evaluations or admin testing
 */
export const POST: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    console.log(`Triggering evaluation of all active monitors (requested by: ${payload.userId})`);

    // Evaluate all active monitors
    const results = await MonitorEvaluationService.evaluateAllActiveMonitors();

    return json({
      success: true,
      message: 'Bulk monitor evaluation completed',
      data: {
        total: results.total,
        successful: results.successful,
        triggered: results.triggered,
        failed: results.failed,
        summary: `Evaluated ${results.total} monitors: ${results.successful} successful, ${results.triggered} triggered alerts, ${results.failed} failed`,
      },
    });

  } catch (error: any) {
    console.error('Evaluate all monitors endpoint error:', error);
    
    if (error.message?.includes('expired')) {
      return json({ error: 'Session expired' }, { status: 401 });
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};