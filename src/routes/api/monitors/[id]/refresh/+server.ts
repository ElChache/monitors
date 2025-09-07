import { json } from '@sveltejs/kit';
import { MonitorService } from '$lib/server/monitoring';
import { userDailyLimiter } from '$lib/server/security';
import { AuthService } from '$lib/server/auth/service';

export async function POST({ params, request, getClientAddress }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await AuthService.getCurrentUser(token);
    if (!user) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const monitorId = params.id;
    if (!monitorId) {
      return json({ error: 'Monitor ID required' }, { status: 400 });
    }

    const ip = getClientAddress();

    // Check daily rate limit for manual refreshes (50/day per user)
    const rateLimitResult = await userDailyLimiter.checkLimit(user.id, ip, 'manual_refresh');
    
    if (!rateLimitResult.allowed) {
      return json(
        {
          error: 'Daily manual refresh limit exceeded',
          message: 'You have reached your daily limit of 50 manual refreshes. Automatic monitoring continues as scheduled.',
          limit: 50,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime.toISOString(),
          nextReset: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime.getTime() / 1000).toString(),
            'Retry-After': Math.ceil(rateLimitResult.windowMs / 1000).toString()
          }
        }
      );
    }

    // Verify user owns this monitor
    const monitor = await MonitorService.getMonitor(monitorId, user.id);
    if (!monitor) {
      return json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Trigger manual evaluation
    const { MonitorEvaluationService } = await import('$lib/server/monitoring');
    const evaluationResult = await MonitorEvaluationService.evaluateMonitor(
      monitorId, 
      `manual-${Date.now()}`
    );

    return json({
      success: true,
      message: 'Monitor refreshed successfully',
      evaluation: {
        success: evaluationResult.success,
        triggered: evaluationResult.triggered,
        previousValue: evaluationResult.previousValue,
        currentValue: evaluationResult.currentValue,
        processingTime: evaluationResult.processingTime,
        evaluatedAt: new Date().toISOString()
      },
      rateLimit: {
        remaining: rateLimitResult.remaining - 1, // Account for this request
        limit: 50,
        resetTime: rateLimitResult.resetTime.toISOString(),
        window: '24 hours'
      },
      monitor: {
        id: monitor.id,
        name: monitor.name,
        lastEvaluated: new Date().toISOString(),
        status: monitor.isActive ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    console.error('Manual refresh error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}