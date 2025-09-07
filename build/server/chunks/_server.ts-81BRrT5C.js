import { j as json } from './index-Djsj11qr.js';
import { A as AdminService } from './service-BeZtpnt3.js';
import { A as AuthService } from './service2-D_Iyu9gC.js';
import './db-whCnGq-7.js';
import 'pg';
import 'dotenv';
import './users-CCLvGjXf.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import './connection-D27Xdyu3.js';
import 'drizzle-orm/node-postgres';
import './jwt-alvM1AqS.js';
import 'jsonwebtoken';
import '@node-rs/bcrypt';
import 'zod';

async function GET({ request }) {
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
    const isAdmin = await AdminService.isAdmin(user.id);
    if (!isAdmin) {
      return json({ error: "Admin privileges required" }, { status: 403 });
    }
    const config = await AdminService.getSystemConfig();
    return json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("Admin config get error:", error);
    return json(
      { error: "Failed to retrieve system configuration" },
      { status: 500 }
    );
  }
}
async function PUT({ request }) {
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
    const isAdmin = await AdminService.isAdmin(user.id);
    if (!isAdmin) {
      return json({ error: "Admin privileges required" }, { status: 403 });
    }
    const configUpdates = await request.json();
    const validKeys = [
      "maxMonitorsPerUser",
      "maxAlertsPerHour",
      "maintenanceMode",
      "registrationEnabled",
      "betaMode"
    ];
    const filteredConfig = Object.keys(configUpdates).filter((key) => validKeys.includes(key)).reduce((obj, key) => {
      obj[key] = configUpdates[key];
      return obj;
    }, {});
    if (Object.keys(filteredConfig).length === 0) {
      return json({ error: "No valid configuration updates provided" }, { status: 400 });
    }
    await AdminService.updateSystemConfig(filteredConfig);
    return json({
      success: true,
      message: "System configuration updated",
      updatedFields: Object.keys(filteredConfig)
    });
  } catch (error) {
    console.error("Admin config update error:", error);
    return json(
      { error: "Failed to update system configuration" },
      { status: 500 }
    );
  }
}

export { GET, PUT };
//# sourceMappingURL=_server.ts-81BRrT5C.js.map
