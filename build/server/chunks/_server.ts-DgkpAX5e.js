import { j as json } from './index-Djsj11qr.js';
import { A as AuthService } from './service-B8TfIYI-.js';
import { r as rateLimit } from './rateLimit-BH-j5mR6.js';
import { z } from 'zod';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'dotenv';
import './users-4TgmiNes.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import './jwt-alvM1AqS.js';
import 'jsonwebtoken';
import '@node-rs/bcrypt';
import 'ioredis';

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
});
const POST = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  try {
    const body = await request.json();
    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return json(
        {
          success: false,
          error: "Invalid email address"
        },
        { status: 400 }
      );
    }
    const { email } = validation.data;
    const rateLimitResult = await rateLimit({
      identifier: `forgot-password:${clientIP}`,
      limit: 3,
      window: 60 * 60,
      // 1 hour
      type: "password_reset"
    });
    if (!rateLimitResult.allowed) {
      return json(
        {
          success: false,
          error: "Too many password reset requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }
    const result = await AuthService.requestPasswordReset(email);
    return json(
      {
        success: true,
        message: "If an account with that email exists, we have sent a password reset link."
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password endpoint error:", error);
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
//# sourceMappingURL=_server.ts-DgkpAX5e.js.map
