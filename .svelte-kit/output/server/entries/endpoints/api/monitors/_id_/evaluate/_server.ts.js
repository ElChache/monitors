import { json } from "@sveltejs/kit";
import { J as JWTService } from "../../../../../../chunks/jwt.js";
import "../../../../../../chunks/db.js";
import "../../../../../../chunks/users.js";
import "puppeteer";
import "../../../../../../chunks/service4.js";
import "../../../../../../chunks/evaluation_service.js";
import { M as MonitorService } from "../../../../../../chunks/monitor_service.js";
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
export {
  POST
};
