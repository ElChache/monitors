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
    const body = await request.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return json({
        error: "Current password, new password, and confirmation are required"
      }, { status: 400 });
    }
    if (newPassword !== confirmNewPassword) {
      return json({ error: "New password and confirmation do not match" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return json({ error: "New password must be at least 8 characters long" }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return json({ error: "New password must be different from current password" }, { status: 400 });
    }
    await UserAccountService.changePassword(user.id, currentPassword, newPassword);
    console.log(`Password changed for user: ${user.id} (${user.email}) at ${(/* @__PURE__ */ new Date()).toISOString()}`);
    return json({
      success: true,
      message: "Password changed successfully. Please log in again with your new password."
    });
  } catch (error) {
    console.error("Change password error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Current password is incorrect")) {
        return json({ error: "Current password is incorrect" }, { status: 401 });
      }
      if (error.message.includes("OAuth authentication")) {
        return json({ error: "Cannot change password for OAuth-authenticated accounts" }, { status: 400 });
      }
    }
    return json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}

export { POST };
//# sourceMappingURL=_server.ts-CzAUMeYW.js.map
