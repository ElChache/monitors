import { json } from "@sveltejs/kit";
import { J as JWTService } from "../../../../../chunks/jwt.js";
import "../../../../../chunks/db.js";
import "../../../../../chunks/users.js";
import { W as WebScraperService } from "../../../../../chunks/evaluation_service.js";
import "../../../../../chunks/service4.js";
import { M as MonitorJobQueue } from "../../../../../chunks/job_queue_simple.js";
import "../../../../../chunks/connection.js";
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
export {
  GET
};
