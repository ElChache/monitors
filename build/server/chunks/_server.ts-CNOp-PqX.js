import { j as json } from './index-Djsj11qr.js';
import { J as JWTService } from './jwt-alvM1AqS.js';
import { M as MonitorEvaluationService } from './evaluation_service-CE7LdKAb.js';
import 'puppeteer';
import './connection-D27Xdyu3.js';
import './users-CCLvGjXf.js';
import './db-whCnGq-7.js';
import 'jsonwebtoken';
import 'dotenv';
import 'drizzle-orm';
import './service4-B-hvY16X.js';
import '@aws-sdk/client-ses';
import './templates-C2bOMWsP.js';
import 'zod';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'drizzle-orm/pg-core';

const POST = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get("session");
    if (!sessionToken) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: "Invalid session" }, { status: 401 });
    }
    console.log(`Triggering evaluation of all active monitors (requested by: ${payload.userId})`);
    const results = await MonitorEvaluationService.evaluateAllActiveMonitors();
    return json({
      success: true,
      message: "Bulk monitor evaluation completed",
      data: {
        total: results.total,
        successful: results.successful,
        triggered: results.triggered,
        failed: results.failed,
        summary: `Evaluated ${results.total} monitors: ${results.successful} successful, ${results.triggered} triggered alerts, ${results.failed} failed`
      }
    });
  } catch (error) {
    console.error("Evaluate all monitors endpoint error:", error);
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
//# sourceMappingURL=_server.ts-CNOp-PqX.js.map
