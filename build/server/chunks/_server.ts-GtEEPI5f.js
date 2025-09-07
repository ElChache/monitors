import { e as error, j as json } from './index-Djsj11qr.js';
import { z } from 'zod';
import { m as monitorIdSchema, M as MonitorService, u as updateMonitorSchema } from './service3-Ye43nkfx.js';
import { J as JWTService } from './jwt-alvM1AqS.js';
import 'drizzle-orm';
import './db-DnzjOtfS.js';
import 'pg';
import 'dotenv';
import './users-4TgmiNes.js';
import 'drizzle-orm/pg-core';
import 'jsonwebtoken';

const GET = async ({ params, cookies }) => {
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
    const monitor = await MonitorService.getMonitorById(payload.userId, id);
    if (!monitor) {
      throw error(404, "Monitor not found or access denied");
    }
    return json({
      success: true,
      data: monitor
    });
  } catch (err) {
    console.error("Get monitor error:", err);
    if (err instanceof z.ZodError) {
      throw error(400, {
        message: "Invalid monitor ID",
        details: err.errors
      });
    }
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to retrieve monitor");
  }
};
const PUT = async ({ params, request, cookies }) => {
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
    const data = await request.json();
    const validatedData = updateMonitorSchema.parse(data);
    const updatedMonitor = await MonitorService.updateMonitor(payload.userId, id, validatedData);
    if (!updatedMonitor) {
      throw error(404, "Monitor not found or access denied");
    }
    return json({
      success: true,
      message: "Monitor updated successfully",
      data: updatedMonitor
    });
  } catch (err) {
    console.error("Update monitor error:", err);
    if (err instanceof z.ZodError) {
      throw error(400, {
        message: "Invalid update data",
        details: err.errors
      });
    }
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to update monitor");
  }
};
const DELETE = async ({ params, cookies }) => {
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
    const deleted = await MonitorService.deleteMonitor(payload.userId, id);
    if (!deleted) {
      throw error(404, "Monitor not found or access denied");
    }
    return json({
      success: true,
      message: "Monitor deleted successfully"
    });
  } catch (err) {
    console.error("Delete monitor error:", err);
    if (err instanceof z.ZodError) {
      throw error(400, {
        message: "Invalid monitor ID",
        details: err.errors
      });
    }
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to delete monitor");
  }
};

export { DELETE, GET, PUT };
//# sourceMappingURL=_server.ts-GtEEPI5f.js.map
