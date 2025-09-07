import { j as json } from './index-Djsj11qr.js';
import { A as AuthService } from './service2-D_Iyu9gC.js';
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

const POST = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (accessToken) {
      await AuthService.logout(accessToken);
    }
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      "access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    );
    headers.append(
      "Set-Cookie",
      "refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    );
    return json(
      {
        success: true,
        message: "Logout successful"
      },
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error("Logout endpoint error:", error);
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
//# sourceMappingURL=_server.ts-ngOtXDnV.js.map
