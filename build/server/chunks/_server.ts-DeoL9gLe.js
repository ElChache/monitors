import { j as json } from './index-Djsj11qr.js';
import { U as UserAccountService } from './service6-Ciwisgvu.js';
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
    const profile = await UserAccountService.getUserProfile(user.id);
    return json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return json(
      { error: "Failed to retrieve user profile" },
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
    const updates = await request.json();
    const allowedFields = ["name", "email"];
    const filteredUpdates = Object.keys(updates).filter((key) => allowedFields.includes(key)).reduce((obj, key) => {
      obj[key] = updates[key];
      return obj;
    }, {});
    if (Object.keys(filteredUpdates).length === 0) {
      return json({ error: "No valid fields to update" }, { status: 400 });
    }
    if (filteredUpdates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(filteredUpdates.email)) {
        return json({ error: "Invalid email format" }, { status: 400 });
      }
    }
    if (filteredUpdates.name) {
      if (typeof filteredUpdates.name !== "string" || filteredUpdates.name.trim().length < 1) {
        return json({ error: "Name must be a non-empty string" }, { status: 400 });
      }
      filteredUpdates.name = filteredUpdates.name.trim();
    }
    await UserAccountService.updateUserProfile(user.id, filteredUpdates);
    return json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

export { GET, PUT };
//# sourceMappingURL=_server.ts-DeoL9gLe.js.map
