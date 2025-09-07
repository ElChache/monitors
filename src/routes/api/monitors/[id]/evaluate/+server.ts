import { json, type RequestHandler } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt';
import { MonitorService } from '$lib/server/monitoring';

/**
 * POST /api/monitors/[id]/evaluate - Manual monitor evaluation
 */
export const POST: RequestHandler = async ({ params, cookies }) => {
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

    // Trigger manual evaluation
    const result = await MonitorService.triggerManualEvaluation(monitorId, payload.userId);

    if (!result.success) {
      if (result.rateLimited) {
        return json(
          { 
            error: 'Rate limit exceeded', 
            message: 'You have reached the daily limit of manual evaluations (50 per day)' 
          },
          { status: 429 }
        );
      }

      return json({ error: result.error || 'Evaluation failed' }, { status: 400 });
    }

    return json({
      success: true,
      message: 'Monitor evaluation queued successfully',
      jobId: result.jobId,
    });

  } catch (error: any) {
    console.error('Manual evaluation endpoint error:', error);
    
    if (error.message?.includes('expired')) {
      return json({ error: 'Session expired' }, { status: 401 });
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};