import { json } from "@sveltejs/kit";
import { J as JWTService } from "../../../../../../chunks/jwt.js";
import "../../../../../../chunks/db.js";
import "../../../../../../chunks/users.js";
import "puppeteer";
import "../../../../../../chunks/service4.js";
import "../../../../../../chunks/evaluation_service.js";
import { M as MonitorService } from "../../../../../../chunks/monitor_service.js";
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
export {
  GET
};
