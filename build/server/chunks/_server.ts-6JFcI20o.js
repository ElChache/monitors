import { j as json } from './index-Djsj11qr.js';
import { A as AuthService } from './service-B8TfIYI-.js';
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

const GET = async ({ cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      return json(
        {
          success: false,
          error: "Not authenticated"
        },
        { status: 401 }
      );
    }
    const user = await AuthService.getCurrentUser(accessToken);
    if (!user) {
      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        "access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
      );
      return json(
        {
          success: false,
          error: "Invalid or expired token"
        },
        {
          status: 401,
          headers
        }
      );
    }
    return json(
      {
        success: true,
        user
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user endpoint error:", error);
    return json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
};

export { GET };
//# sourceMappingURL=_server.ts-6JFcI20o.js.map
