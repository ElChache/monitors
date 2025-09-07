import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OAuthService } from '$lib/server/auth/oauth';
import { JWTService } from '$lib/server/auth/jwt';
import { sessions } from '$lib/db/schemas/users';
import { db } from '$lib/db/connection';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, cookies }) => {
  // Authenticate Google OAuth login or signup
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';

  if (!code) {
    // Redirect to Google OAuth authorization URL
    const authUrl = OAuthService.getGoogleAuthUrl(state);
    return new Response(null, {
      status: 302,
      headers: { Location: authUrl }
    });
  }

  try {
    // Exchange code for tokens
    const tokens = await OAuthService.exchangeCodeForTokens(code);

    // Fetch user profile
    const profile = await OAuthService.fetchGoogleProfile(tokens.access_token!);

    // Handle OAuth login/signup
    const { user, tokens: authTokens, isNewUser } = await OAuthService.handleGoogleOAuth(profile);

    // Create session
    const [session] = await db.insert(sessions).values({
      userId: user.id,
      sessionToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
      expiresAt: authTokens.expiresAt,
      refreshExpiresAt: authTokens.refreshExpiresAt,
    }).returning();

    // Set secure HTTP-only cookies
    cookies.set('sessionToken', authTokens.accessToken, { 
      path: '/', 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days 
    });

    cookies.set('refreshToken', authTokens.refreshToken, { 
      path: '/', 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return json({
      success: true,
      user,
      isNewUser,
      redirectTo: isNewUser ? '/onboarding' : '/dashboard'
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return json({ 
      success: false, 
      error: 'Authentication failed' 
    }, { status: 400 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  // Handle account linking or additional OAuth setup
  const data = await request.json();
  
  // TODO: Implement more advanced OAuth account management
  
  return json({ 
    success: false, 
    error: 'Not implemented' 
  }, { status: 501 });
};