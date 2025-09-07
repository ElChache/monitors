import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { monitorIdSchema } from '$lib/server/monitors/validation';
import { MonitorService } from '$lib/server/monitors/service';
import { JWTService } from '$lib/server/auth/jwt';

// POST /api/monitors/:id/toggle - Toggle monitor active status
export const POST: RequestHandler = async ({ params, cookies }) => {
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

    // Validate monitor ID parameter
    const { id } = monitorIdSchema.parse(params);

    // Toggle monitor active status
    const updatedMonitor = await MonitorService.toggleMonitorActive(payload.userId, id);

    if (!updatedMonitor) {
      throw error(404, 'Monitor not found or access denied');
    }

    return json({
      success: true,
      message: `Monitor ${updatedMonitor.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedMonitor
    });

  } catch (err) {
    console.error('Toggle monitor error:', err);

    if (err instanceof z.ZodError) {
      throw error(400, {
        message: 'Invalid monitor ID',
        details: err.errors
      });
    }

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to toggle monitor status');
  }
};