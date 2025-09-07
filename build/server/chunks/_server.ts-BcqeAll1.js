import { e as error, j as json } from './index-Djsj11qr.js';
import { z } from 'zod';
import { l as listMonitorsSchema, M as MonitorService, c as createMonitorSchema } from './service3-Ye43nkfx.js';
import { J as JWTService } from './jwt-alvM1AqS.js';
import 'drizzle-orm';
import './db-DnzjOtfS.js';
import 'pg';
import 'dotenv';
import './users-4TgmiNes.js';
import 'drizzle-orm/pg-core';
import 'jsonwebtoken';

const GET = async ({ request, cookies, url }) => {
  try {
    const sessionToken = cookies.get("session");
    if (!sessionToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload) {
      throw error(401, "Invalid session token");
    }
    const queryParams = Object.fromEntries(url.searchParams);
    const query = listMonitorsSchema.parse(queryParams);
    const result = await MonitorService.getMonitors(payload.userId, query);
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
    const sessionToken = cookies.get("session");
    if (!sessionToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload) {
      throw error(401, "Invalid session token");
    }
    const data = await request.json();
    const validatedData = createMonitorSchema.parse(data);
    const currentCount = await MonitorService.getUserMonitorCount(payload.userId);
    if (currentCount >= 50) {
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

export { GET, POST };
//# sourceMappingURL=_server.ts-BcqeAll1.js.map
