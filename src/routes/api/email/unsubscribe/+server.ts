import type { RequestHandler } from './$types';
import { error, json, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { EmailTrackingService } from '$lib/server/email/templates';

// Schema for unsubscribe request
const unsubscribeSchema = z.object({
  token: z.string().min(1, 'Unsubscribe token is required')
});

// GET /api/email/unsubscribe?token=xxx - Handle unsubscribe via link
export const GET: RequestHandler = async ({ url }) => {
  try {
    const token = url.searchParams.get('token');
    
    if (!token) {
      throw error(400, 'Missing unsubscribe token');
    }

    // Parse token to get user and notification type
    const parsed = EmailTrackingService.parseUnsubscribeToken(token);
    if (!parsed) {
      throw error(400, 'Invalid unsubscribe token');
    }

    // Unsubscribe user
    const success = await EmailTrackingService.unsubscribe(
      parsed.userId, 
      parsed.notificationType
    );

    if (!success) {
      throw error(500, 'Failed to process unsubscribe request');
    }

    // Redirect to success page with confirmation
    const baseUrl = process.env.APP_URL || 'https://monitors.app';
    throw redirect(302, `${baseUrl}/unsubscribed?type=${parsed.notificationType}`);

  } catch (err) {
    console.error('Unsubscribe error:', err);

    // Re-throw SvelteKit errors (redirects)
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to process unsubscribe request');
  }
};

// POST /api/email/unsubscribe - Handle unsubscribe via API
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { token } = unsubscribeSchema.parse(data);

    // Parse token to get user and notification type
    const parsed = EmailTrackingService.parseUnsubscribeToken(token);
    if (!parsed) {
      throw error(400, 'Invalid unsubscribe token');
    }

    // Unsubscribe user
    const success = await EmailTrackingService.unsubscribe(
      parsed.userId, 
      parsed.notificationType
    );

    if (!success) {
      throw error(500, 'Failed to process unsubscribe request');
    }

    return json({
      success: true,
      message: 'Successfully unsubscribed from notifications',
      notificationType: parsed.notificationType
    });

  } catch (err) {
    console.error('Unsubscribe API error:', err);

    if (err instanceof z.ZodError) {
      throw error(400, {
        message: 'Invalid request data',
        details: err.errors
      });
    }

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to process unsubscribe request');
  }
};