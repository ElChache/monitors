import { error, json } from "@sveltejs/kit";
import { z } from "zod";
import "../../../../chunks/db.js";
import "../../../../chunks/users.js";
import "puppeteer";
import "../../../../chunks/service4.js";
import "../../../../chunks/evaluation_service.js";
import { M as MonitorService } from "../../../../chunks/monitor_service.js";
import { J as JWTService } from "../../../../chunks/jwt.js";
const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  prompt: z.string().min(10).max(1e3),
  type: z.enum(["state", "change"]),
  extractedFact: z.string().min(1).max(500),
  triggerCondition: z.string().min(1).max(500),
  factType: z.enum(["number", "string", "boolean", "object"]),
  checkFrequency: z.number().min(5).max(1440).optional().default(60)
  // 5 minutes to 24 hours
});
const listMonitorsSchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 20),
  active: z.string().optional().transform((val) => val === "true" ? true : val === "false" ? false : void 0)
});
const GET = async ({ request, cookies, url }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(accessToken);
    if (!payload) {
      throw error(401, "Invalid session token");
    }
    const queryParams = Object.fromEntries(url.searchParams);
    const query = listMonitorsSchema.parse(queryParams);
    const monitors = await MonitorService.getUserMonitors(payload.userId);
    let filteredMonitors = monitors;
    if (query.active !== void 0) {
      filteredMonitors = monitors.filter((monitor) => monitor.isActive === query.active);
    }
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const paginatedMonitors = filteredMonitors.slice(start, end);
    const result = {
      monitors: paginatedMonitors,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: filteredMonitors.length,
        hasMore: end < filteredMonitors.length
      }
    };
    return json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error("Get monitors error:", err);
    if (err instanceof z.ZodError) {
      throw error(400, {
        message: "Invalid query parameters",
        details: err.errors
      });
    }
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to retrieve monitors");
  }
};
const POST = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(accessToken);
    if (!payload) {
      throw error(401, "Invalid session token");
    }
    const data = await request.json();
    const validatedData = createMonitorSchema.parse(data);
    const currentMonitors = await MonitorService.getUserMonitors(payload.userId);
    if (currentMonitors.length >= 50) {
      throw error(429, {
        message: "Monitor limit reached",
        details: "Maximum of 50 monitors allowed per user"
      });
    }
    const monitor = await MonitorService.createMonitor(payload.userId, validatedData);
    return json({
      success: true,
      message: "Monitor created successfully",
      data: monitor
    }, { status: 201 });
  } catch (err) {
    console.error("Create monitor error:", err);
    if (err instanceof z.ZodError) {
      throw error(400, {
        message: "Invalid monitor data",
        details: err.errors
      });
    }
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to create monitor");
  }
};
export {
  GET,
  POST
};
