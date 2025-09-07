import { json, type RequestHandler } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt';
import { MonitorJobQueue, WebScraperService } from '$lib/server/monitoring';

/**
 * GET /api/monitoring/status - Get monitoring system status
 */
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get system status
    const [queueHealth, scraperHealth, queueStats] = await Promise.all([
      MonitorJobQueue.healthCheck(),
      WebScraperService.healthCheck(),
      MonitorJobQueue.getQueueStats(),
    ]);

    const systemStatus = {
      overall: 'healthy',
      components: {
        jobQueue: {
          status: queueHealth.connected ? 'healthy' : 'unhealthy',
          connected: queueHealth.connected,
          error: queueHealth.error,
        },
        webScraper: {
          status: scraperHealth.canScrape ? 'healthy' : 'unhealthy',
          browserReady: scraperHealth.browserReady,
          canScrape: scraperHealth.canScrape,
          version: scraperHealth.version,
        },
        queue: {
          waiting: queueStats.waiting,
          active: queueStats.active,
          completed: queueStats.completed,
          failed: queueStats.failed,
          delayed: queueStats.delayed,
        },
      },
      timestamp: new Date().toISOString(),
    };

    // Determine overall system health
    if (!queueHealth.connected || !scraperHealth.canScrape) {
      systemStatus.overall = 'degraded';
    }

    return json({
      success: true,
      data: systemStatus,
    });

  } catch (error: any) {
    console.error('Monitoring status endpoint error:', error);
    
    if (error.message?.includes('expired')) {
      return json({ error: 'Session expired' }, { status: 401 });
    }

    return json(
      { 
        error: 'Internal server error',
        data: {
          overall: 'unhealthy',
          components: {},
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
};