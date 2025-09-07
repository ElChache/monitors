import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/server/auth/service.js';
import { checkAuthLimit } from '$lib/server/middleware/rateLimit.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  
  try {
    const body = await request.json();
    const { email } = body;

    // Apply rate limiting - 5 login attempts per IP/email per 15 minutes
    const rateLimitResult = await checkAuthLimit(`${clientIP}:${email || 'unknown'}`);

    if (!rateLimitResult.allowed) {
      return json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }

    const result = await AuthService.login(body);

    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error
        },
        { status: 401 }
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
        message: 'Login successful'
      },
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error('Login endpoint error:', error);
    return json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
};