import { j as json } from './index-Djsj11qr.js';
import { A as AuthService } from './service-B8TfIYI-.js';
import { r as rateLimit } from './rateLimit-BH-j5mR6.js';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'dotenv';
import './users-4TgmiNes.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import './jwt-alvM1AqS.js';
import 'jsonwebtoken';
import '@node-rs/bcrypt';
import 'zod';
import 'ioredis';

const POST = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  const rateLimitResult = await rateLimit({
    identifier: `register:${clientIP}`,
    limit: 5,
    window: 60 * 60,
    // 1 hour
    type: "registration"
  });
  if (!rateLimitResult.allowed) {
    return json(
      {
        success: false,
        error: "Too many registration attempts. Please try again later.",
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
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `access_token=${result.tokens.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`
    );
    headers.append(
      "Set-Cookie",
      `refresh_token=${result.tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
    );
    return json(
      {
        success: true,
        user: result.user,
        session: result.session,
        message: "Registration successful. Please check your email to verify your account."
      },
      {
        status: 201,
        headers
      }
    );
  } catch (error) {
    console.error("Registration endpoint error:", error);
    return json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
};

export { POST };
//# sourceMappingURL=_server.ts-DSsFgB3h.js.map
