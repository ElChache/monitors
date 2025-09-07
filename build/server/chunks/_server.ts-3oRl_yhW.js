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

async function GET({ request, url }) {
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
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || void 0;
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const result = await AdminService.getUsers({
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder
    });
    return json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return json(
      { error: "Failed to retrieve users" },
      { status: 500 }
    );
  }
}
async function POST({ request }) {
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
    const { action, userId, ...data } = await request.json();
    switch (action) {
      case "updateRole":
        await AdminService.updateUserRole(userId, data.isAdmin);
        return json({
          success: true,
          message: `User role updated to ${data.isAdmin ? "admin" : "user"}`
        });
      case "updateStatus":
        await AdminService.updateUserStatus(userId, data.isActive);
        return json({
          success: true,
          message: `User ${data.isActive ? "activated" : "deactivated"}`
        });
      case "deleteUser":
        await AdminService.deleteUser(userId);
        return json({
          success: true,
          message: "User deleted successfully"
        });
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin user action error:", error);
    return json(
      { error: "Failed to perform user action" },
      { status: 500 }
    );
  }
}

export { GET, POST };
//# sourceMappingURL=_server.ts-3oRl_yhW.js.map
