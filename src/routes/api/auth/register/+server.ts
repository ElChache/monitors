import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/server/auth/service.js';
import { rateLimit } from '$lib/server/middleware/rateLimit.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  
  // Apply rate limiting - 5 registration attempts per IP per hour
  const rateLimitResult = await rateLimit({
    identifier: `register:${clientIP}`,
    limit: 5,
    window: 60 * 60, // 1 hour
    type: 'registration'
  });

  if (!rateLimitResult.allowed) {
    return json(
      {
        success: false,
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: rateLimitResult.retryAfter
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = await AuthService.register(body);

    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error,
          errors: result.errors
        },
        { status: 400 }
      );
    }

    // Set secure HTTP-only cookies
    const headers = new Headers();
    
    // Access token cookie (shorter expiry)
    headers.append('Set-Cookie', 
      `access_token=${result.tokens!.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`
    ); // 15 minutes

    // Refresh token cookie (longer expiry) 
    headers.append('Set-Cookie',
      `refresh_token=${result.tokens!.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
    ); // 7 days

    return json(
      {
        success: true,
        user: result.user,
        session: result.session,
        message: 'Registration successful. Please check your email to verify your account.'
      },
      {
        status: 201,
        headers
      }
    );

  } catch (error) {
    console.error('Registration endpoint error:', error);
    return json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
};