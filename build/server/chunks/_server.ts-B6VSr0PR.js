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
    const preferences = await UserAccountService.getUserPreferences(user.id);
    return json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error("Get user preferences error:", error);
    return json(
      { error: "Failed to retrieve user preferences" },
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
    const preferences = await request.json();
    const validatedPreferences = {};
    if (typeof preferences.emailNotifications === "boolean") {
      validatedPreferences.emailNotifications = preferences.emailNotifications;
    }
    if (typeof preferences.pushNotifications === "boolean") {
      validatedPreferences.pushNotifications = preferences.pushNotifications;
    }
    if (["immediate", "hourly", "daily", "weekly"].includes(preferences.notificationFrequency)) {
      validatedPreferences.notificationFrequency = preferences.notificationFrequency;
    }
    if (typeof preferences.timezone === "string" && preferences.timezone.length > 0) {
      validatedPreferences.timezone = preferences.timezone;
    }
    if (["light", "dark", "auto"].includes(preferences.theme)) {
      validatedPreferences.theme = preferences.theme;
    }
    if (typeof preferences.language === "string" && preferences.language.length > 0) {
      validatedPreferences.language = preferences.language;
    }
    await UserAccountService.updateUserPreferences(user.id, validatedPreferences);
    return json({
      success: true,
      message: "Preferences updated successfully"
    });
  } catch (error) {
    console.error("Update user preferences error:", error);
    return json(
      { error: "Failed to update user preferences" },
      { status: 500 }
    );
  }
}

export { GET, PUT };
//# sourceMappingURL=_server.ts-B6VSr0PR.js.map
