import { e as error, j as json } from './index-Djsj11qr.js';
import { z } from 'zod';
import { m as monitorIdSchema, M as MonitorService } from './service3-Ye43nkfx.js';
import { J as JWTService } from './jwt-alvM1AqS.js';
import 'drizzle-orm';
import './db-DnzjOtfS.js';
import 'pg';
import 'dotenv';
import './users-4TgmiNes.js';
import 'drizzle-orm/pg-core';
import 'jsonwebtoken';

const POST = async ({ params, cookies }) => {
  try {
    const sessionToken = cookies.get("session");
    if (!sessionToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload) {
      throw error(401, "Invalid session token");
    }
    const { id } = monitorIdSchema.parse(params);
    const updatedMonitor = await MonitorService.toggleMonitorActive(payload.userId, id);
    if (!updatedMonitor) {
      throw error(404, "Monitor not found or access denied");
    }
    return json({
      success: true,
      message: `Monitor ${updatedMonitor.isActive ? "activated" : "deactivated"} successfully`,
      data: updatedMonitor
    });
  } catch (err) {
    console.error("Toggle monitor error:", err);
    if (err instanceof z.ZodError) {
      throw error(400, {
        message: "Invalid monitor ID",
        details: err.errors
      });
    }
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to toggle monitor status");
  }
};

export { POST };
//# sourceMappingURL=_server.ts-D2gzuNY1.js.map
