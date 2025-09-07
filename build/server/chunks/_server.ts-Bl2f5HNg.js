import { j as json } from './index-Djsj11qr.js';
import { A as AdminService } from './service-BeZtpnt3.js';
import { A as AuthService } from './service2-D_Iyu9gC.js';
import './db-whCnGq-7.js';
import 'pg';
import 'dotenv';
import './users-CCLvGjXf.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import './connection-D27Xdyu3.js';
import 'drizzle-orm/node-postgres';
import './jwt-alvM1AqS.js';
import 'jsonwebtoken';
import '@node-rs/bcrypt';
import 'zod';

async function GET({ request }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const user = await AuthService.getCurrentUser(token);
    if (!user) {
      return json({ error: "Invalid token" }, { status: 401 });
    }
    const isAdmin = await AdminService.isAdmin(user.id);
    if (!isAdmin) {
      return json({ error: "Admin privileges required" }, { status: 403 });
    }
    const health = await AdminService.getServiceHealth();
    return json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error("Admin health check error:", error);
    return json(
      { error: "Failed to check service health" },
      { status: 500 }
    );
  }
}

export { GET };
//# sourceMappingURL=_server.ts-Bl2f5HNg.js.map
