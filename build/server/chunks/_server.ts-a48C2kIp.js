import { j as json } from './index-Djsj11qr.js';
import { A as AuthService } from './service-B8TfIYI-.js';
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

const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required")
});
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const validation = VerifyEmailSchema.safeParse(body);
    if (!validation.success) {
      return json(
        {
          success: false,
          error: "Invalid verification token"
        },
        { status: 400 }
      );
    }
    const { token } = validation.data;
    const result = await AuthService.verifyEmail(token);
    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }
    return json(
      {
        success: true,
        message: "Email verified successfully!"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification endpoint error:", error);
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
//# sourceMappingURL=_server.ts-a48C2kIp.js.map
