import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/server/auth/service.js';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    const refreshToken = cookies.get('refresh_token');
    
    if (!refreshToken) {
      return json(
        {
          success: false,
          error: 'No refresh token provided'
        },
        { status: 401 }
      );
    }

    const result = await AuthService.refreshTokens(refreshToken);

    if (!result.success) {
      // Clear invalid cookies
      const headers = new Headers();
      headers.append('Set-Cookie', 
        'access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      );
      headers.append('Set-Cookie',
        'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      );

      return json(
        {
          success: false,
          error: result.error
        },
        {
          status: 401,
          headers
        }
      );
    }

    // Set new secure HTTP-only cookies
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
        message: 'Tokens refreshed successfully'
      },
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error('Token refresh endpoint error:', error);
    return json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
};