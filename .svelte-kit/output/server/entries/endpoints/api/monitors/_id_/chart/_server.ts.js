import { json } from "@sveltejs/kit";
import { H as HistoricalDataService } from "../../../../../../chunks/historical_service.js";
import { A as AuthService } from "../../../../../../chunks/service2.js";
import "../../../../../../chunks/db.js";
import "../../../../../../chunks/users.js";
import "puppeteer";
import "../../../../../../chunks/service4.js";
import "../../../../../../chunks/evaluation_service.js";
import { M as MonitorService } from "../../../../../../chunks/monitor_service.js";
async function GET({ params, request, url }) {
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
    const monitorId = params.id;
    if (!monitorId) {
      return json({ error: "Monitor ID required" }, { status: 400 });
    }
    const monitor = await MonitorService.getMonitor(monitorId, user.id);
    if (!monitor) {
      return json({ error: "Monitor not found" }, { status: 404 });
    }
    const timeRange = url.searchParams.get("timeRange") || "24h";
    const aggregation = url.searchParams.get("aggregation") || "hourly";
    const chartData = await HistoricalDataService.getChartData(monitorId, timeRange, aggregation);
    return json({
      success: true,
      monitorId,
      timeRange,
      aggregation,
      chartData
    });
  } catch (error) {
    console.error("Chart data error:", error);
    return json(
      { error: "Failed to retrieve chart data" },
      { status: 500 }
    );
  }
}
export {
  GET
};
