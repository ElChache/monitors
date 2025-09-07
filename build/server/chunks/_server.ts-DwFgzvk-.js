import { j as json } from './index-Djsj11qr.js';
import { J as JWTService } from './jwt-alvM1AqS.js';
import './db-whCnGq-7.js';
import './users-CCLvGjXf.js';
import { W as WebScraperService } from './evaluation_service-CE7LdKAb.js';
import './service4-B-hvY16X.js';
import { M as MonitorJobQueue } from './job_queue_simple-sCFeM1fX.js';
import './connection-D27Xdyu3.js';
import 'jsonwebtoken';
import 'dotenv';
import 'pg';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'puppeteer';
import './templates-C2bOMWsP.js';
import 'zod';
import '@aws-sdk/client-ses';
import 'drizzle-orm/node-postgres';

const GET = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get("session");
    if (!sessionToken) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: "Invalid session" }, { status: 401 });
    }
    const [queueHealth, scraperHealth, queueStats] = await Promise.all([
      MonitorJobQueue.healthCheck(),
      WebScraperService.healthCheck(),
      MonitorJobQueue.getQueueStats()
    ]);
    const systemStatus = {
      overall: "healthy",
      components: {
        jobQueue: {
          status: queueHealth.connected ? "healthy" : "unhealthy",
          connected: queueHealth.connected,
          error: queueHealth.error
        },
        webScraper: {
          status: scraperHealth.canScrape ? "healthy" : "unhealthy",
          browserReady: scraperHealth.browserReady,
          canScrape: scraperHealth.canScrape,
          version: scraperHealth.version
        },
        queue: {
          waiting: queueStats.waiting,
          active: queueStats.active,
          completed: queueStats.completed,
          failed: queueStats.failed,
          delayed: queueStats.delayed
        }
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!queueHealth.connected || !scraperHealth.canScrape) {
      systemStatus.overall = "degraded";
    }
    return json({
      success: true,
      data: systemStatus
    });
  } catch (error) {
    console.error("Monitoring status endpoint error:", error);
    if (error.message?.includes("expired")) {
      return json({ error: "Session expired" }, { status: 401 });
    }
    return json(
      {
        error: "Internal server error",
        data: {
          overall: "unhealthy",
          components: {},
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      },
      { status: 500 }
    );
  }
};

export { GET };
//# sourceMappingURL=_server.ts-DwFgzvk-.js.map
