import { json } from "@sveltejs/kit";
import { U as UserAccountService } from "../../../../../chunks/service6.js";
import { A as AuthService } from "../../../../../chunks/service2.js";
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
export {
  GET,
  PUT
};
