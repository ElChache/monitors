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

const POST = async ({ params, cookies }) => {
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
    const result = await MonitorService.triggerManualEvaluation(monitorId, payload.userId);
    if (!result.success) {
      if (result.rateLimited) {
        return json(
          {
            error: "Rate limit exceeded",
            message: "You have reached the daily limit of manual evaluations (50 per day)"
          },
          { status: 429 }
        );
      }
      return json({ error: result.error || "Evaluation failed" }, { status: 400 });
    }
    return json({
      success: true,
      message: "Monitor evaluation queued successfully",
      jobId: result.jobId
    });
  } catch (error) {
    console.error("Manual evaluation endpoint error:", error);
    if (error.message?.includes("expired")) {
      return json({ error: "Session expired" }, { status: 401 });
    }
    return json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export { POST };
//# sourceMappingURL=_server.ts-B-UO8WEA.js.map
