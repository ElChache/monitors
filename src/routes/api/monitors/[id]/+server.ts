import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { updateMonitorSchema, monitorIdSchema } from '$lib/server/monitors/validation';
import { MonitorService } from '$lib/server/monitors/service';
import { JWTService } from '$lib/server/auth/jwt';

// GET /api/monitors/:id - Get specific monitor details
export const GET: RequestHandler = async ({ params, cookies }) => {
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

    // Get monitor by ID
    const monitor = await MonitorService.getMonitorById(payload.userId, id);

    if (!monitor) {
      throw error(404, 'Monitor not found or access denied');
    }

    return json({
      success: true,
      data: monitor
    });

  } catch (err) {
    console.error('Get monitor error:', err);

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

    throw error(500, 'Failed to retrieve monitor');
  }
};

// PUT /api/monitors/:id - Update monitor configuration
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
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

    // Parse and validate request body
    const data = await request.json();
    const validatedData = updateMonitorSchema.parse(data);

    // Update monitor
    const updatedMonitor = await MonitorService.updateMonitor(payload.userId, id, validatedData);

    if (!updatedMonitor) {
      throw error(404, 'Monitor not found or access denied');
    }

    return json({
      success: true,
      message: 'Monitor updated successfully',
      data: updatedMonitor
    });

  } catch (err) {
    console.error('Update monitor error:', err);

    if (err instanceof z.ZodError) {
      throw error(400, {
        message: 'Invalid update data',
        details: err.errors
      });
    }

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to update monitor');
  }
};

// DELETE /api/monitors/:id - Delete monitor
export const DELETE: RequestHandler = async ({ params, cookies }) => {
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

    // Delete monitor
    const deleted = await MonitorService.deleteMonitor(payload.userId, id);

    if (!deleted) {
      throw error(404, 'Monitor not found or access denied');
    }

    return json({
      success: true,
      message: 'Monitor deleted successfully'
    });

  } catch (err) {
    console.error('Delete monitor error:', err);

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

    throw error(500, 'Failed to delete monitor');
  }
};