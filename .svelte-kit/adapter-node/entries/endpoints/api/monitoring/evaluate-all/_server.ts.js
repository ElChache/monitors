import { json } from "@sveltejs/kit";
import { J as JWTService } from "../../../../../chunks/jwt.js";
import { M as MonitorEvaluationService } from "../../../../../chunks/evaluation_service.js";
import "puppeteer";
import "../../../../../chunks/connection.js";
import "../../../../../chunks/users.js";
import "../../../../../chunks/db.js";
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
export {
  POST
};
