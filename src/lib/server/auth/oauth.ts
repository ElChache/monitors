import { db } from '../../db/connection';
import { users, oauthAccounts } from '../../db/schemas/users';
import { eq, and } from 'drizzle-orm';
import { JWTService, type TokenPair } from './jwt.js';
import { PasswordService } from './password.js';
import { type User } from './service.js';
import { OAuth2Client } from 'google-auth-library';

// Google OAuth configuration
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!
};

const googleClient = new OAuth2Client(
  googleConfig.clientId,
  googleConfig.clientSecret,
  googleConfig.redirectUri
);

export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  verified_email: boolean;
  picture?: string;
}

export class OAuthService {
  /**
   * Generate Google OAuth authorization URL
   */
  static getGoogleAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
    
    return googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state || '',
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code: string) {
    const { tokens } = await googleClient.getToken(code);
    return tokens;
  }

  /**
   * Fetch Google user profile
   */
  static async fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
    googleClient.setCredentials({ access_token: accessToken });
    const oauth2 = googleClient.oauth2({ version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    return userInfo.data as OAuthProfile;
  }

  /**
   * OAuth user login/signup
   */
  static async handleGoogleOAuth(profile: OAuthProfile): Promise<{
    user: User;
    tokens: TokenPair;
    isNewUser: boolean;
  }> {
    // Check if user exists via Google ID
    const [existingOAuthUser] = await db.select({
      user: users,
      oauthAccount: oauthAccounts
    }).from(users)
    .leftJoin(oauthAccounts, eq(users.id, oauthAccounts.userId))
    .where(
      or(
        eq(users.googleId, profile.id),
        eq(users.email, profile.email)
      )
    );

    // User exists with this Google account
    if (existingOAuthUser?.oauthAccount) {
      const tokens = JWTService.generateTokenPair({
        id: existingOAuthUser.user.id,
        email: existingOAuthUser.user.email,
        name: existingOAuthUser.user.name
      });

      // Update last login
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, existingOAuthUser.user.id));

      return {
        user: {
          id: existingOAuthUser.user.id,
          email: existingOAuthUser.user.email,
          name: existingOAuthUser.user.name,
          emailVerified: true,
          isBetaUser: existingOAuthUser.user.isBetaUser,
          createdAt: existingOAuthUser.user.createdAt
        },
        tokens,
        isNewUser: false
      };
    }

    // Create new user
    const [newUser] = await db.insert(users).values({
      email: profile.email,
      name: profile.name,
      googleId: profile.id,
      emailVerified: profile.verified_email,
      passwordHash: null,  // No password for OAuth users
      isBetaUser: false
    }).returning();

    // Create OAuth account
    await db.insert(oauthAccounts).values({
      userId: newUser.id,
      provider: 'google',
      providerUserId: profile.id,
      // TODO: Store and securely manage tokens
    });

    const tokens = JWTService.generateTokenPair({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        emailVerified: newUser.emailVerified,
        isBetaUser: newUser.isBetaUser,
        createdAt: newUser.createdAt
      },
      tokens,
      isNewUser: true
    };
  }
}