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
    const currentSessionId = token.substring(0, 10);
    const sessions = await UserAccountService.getUserSessions(user.id, currentSessionId);
    return json({
      success: true,
      data: {
        sessions,
        currentSessionId
      }
    });
  } catch (error) {
    console.error("Get user sessions error:", error);
    return json(
      { error: "Failed to retrieve user sessions" },
      { status: 500 }
    );
  }
}
async function DELETE({ request, url }) {
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
    const sessionId = url.searchParams.get("sessionId");
    const revokeAll = url.searchParams.get("revokeAll") === "true";
    if (revokeAll) {
      const currentSessionId = token.substring(0, 10);
      await UserAccountService.revokeAllUserSessions(user.id, currentSessionId);
      return json({
        success: true,
        message: "All other sessions revoked successfully"
      });
    } else if (sessionId) {
      await UserAccountService.revokeUserSession(user.id, sessionId);
      return json({
        success: true,
        message: "Session revoked successfully"
      });
    } else {
      return json({ error: "Session ID required or revokeAll=true" }, { status: 400 });
    }
  } catch (error) {
    console.error("Revoke user session error:", error);
    return json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}
export {
  DELETE,
  GET
};
