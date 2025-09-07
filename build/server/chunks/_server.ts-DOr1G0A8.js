import { j as json } from './index-Djsj11qr.js';
import { J as JWTService } from './jwt-alvM1AqS.js';
import './db-whCnGq-7.js';
import './users-CCLvGjXf.js';
import 'puppeteer';
import './service4-B-hvY16X.js';
import './evaluation_service-CE7LdKAb.js';
import { M as MonitorService } from './monitor_service-TdkLdvPq.js';
import 'jsonwebtoken';
import 'dotenv';
import 'pg';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import '@aws-sdk/client-ses';
import './templates-C2bOMWsP.js';
import 'zod';
import './connection-D27Xdyu3.js';
import 'drizzle-orm/node-postgres';

const GET = async ({ params, cookies }) => {
  try {
    const sessionToken = cookies.get("session");
    if (!sessionToken) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: "Invalid session" }, { status: 401 });
    }
    const monitorId = params.id;
    if (!monitorId) {
      return json({ error: "Monitor ID required" }, { status: 400 });
    }
    const stats = await MonitorService.getMonitorStats(monitorId);
    return json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Monitor stats endpoint error:", error);
    if (error.message?.includes("expired")) {
      return json({ error: "Session expired" }, { status: 401 });
    }
    return json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export { GET };
//# sourceMappingURL=_server.ts-DOr1G0A8.js.map
