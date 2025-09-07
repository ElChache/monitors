import { j as json } from './index-Djsj11qr.js';
import { A as AuthService } from './service2-D_Iyu9gC.js';
import { r as rateLimit } from './rateLimit-RwK8U2L8.js';
import './connection-D27Xdyu3.js';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'dotenv';
import './users-CCLvGjXf.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import './jwt-alvM1AqS.js';
import 'jsonwebtoken';
import '@node-rs/bcrypt';
import 'zod';
import 'ioredis';

const POST = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  try {
    const body = await request.json();
    const rateLimitResult = await rateLimit({
      identifier: `reset-password:${clientIP}`,
      limit: 5,
      window: 15 * 60,
      // 15 minutes
      type: "password_reset_attempt"
    });
    if (!rateLimitResult.allowed) {
      return json(
        {
          success: false,
          error: "Too many reset attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }
    const result = await AuthService.resetPassword(body);
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
    return json(
      {
        success: true,
        message: "Password has been reset successfully. Please login with your new password."
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password endpoint error:", error);
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
//# sourceMappingURL=_server.ts-E13TJ472.js.map
