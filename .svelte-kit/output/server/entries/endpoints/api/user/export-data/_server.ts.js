import { json } from "@sveltejs/kit";
import { U as UserAccountService } from "../../../../../chunks/service6.js";
import { A as AuthService } from "../../../../../chunks/service2.js";
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
    const accountData = await UserAccountService.getUserAccountData(user.id);
    const exportData = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      exportType: "GDPR_DATA_EXPORT",
      userId: user.id,
      ...accountData,
      metadata: {
        version: "1.0",
        format: "JSON",
        dataRetentionPolicy: "User-requested export under GDPR Article 15",
        contactEmail: "privacy@yourdomain.com"
      }
    };
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-data-export-${user.id}-${Date.now()}.json"`
      }
    });
  } catch (error) {
    console.error("Export user data error:", error);
    return json(
      { error: "Failed to export user data" },
      { status: 500 }
    );
  }
}
export {
  POST
};
