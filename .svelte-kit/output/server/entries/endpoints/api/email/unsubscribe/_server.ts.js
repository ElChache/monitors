import { error, redirect, json } from "@sveltejs/kit";
import { z } from "zod";
import { a as EmailTrackingService } from "../../../../../chunks/templates.js";
const unsubscribeSchema = z.object({
  token: z.string().min(1, "Unsubscribe token is required")
});
const GET = async ({ url }) => {
  try {
    const token = url.searchParams.get("token");
    if (!token) {
      throw error(400, "Missing unsubscribe token");
    }
    const parsed = EmailTrackingService.parseUnsubscribeToken(token);
    if (!parsed) {
      throw error(400, "Invalid unsubscribe token");
    }
    const success = await EmailTrackingService.unsubscribe(
      parsed.userId,
      parsed.notificationType
    );
    if (!success) {
      throw error(500, "Failed to process unsubscribe request");
    }
    const baseUrl = process.env.APP_URL || "https://monitors.app";
    throw redirect(302, `${baseUrl}/unsubscribed?type=${parsed.notificationType}`);
  } catch (err) {
    console.error("Unsubscribe error:", err);
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to process unsubscribe request");
  }
};
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const { token } = unsubscribeSchema.parse(data);
    const parsed = EmailTrackingService.parseUnsubscribeToken(token);
    if (!parsed) {
      throw error(400, "Invalid unsubscribe token");
    }
    const success = await EmailTrackingService.unsubscribe(
      parsed.userId,
      parsed.notificationType
    );
    if (!success) {
      throw error(500, "Failed to process unsubscribe request");
    }
    return json({
      success: true,
      message: "Successfully unsubscribed from notifications",
      notificationType: parsed.notificationType
    });
  } catch (err) {
    console.error("Unsubscribe API error:", err);
    if (err instanceof z.ZodError) {
      throw error(400, {
        message: "Invalid request data",
        details: err.errors
      });
    }
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to process unsubscribe request");
  }
};
export {
  GET,
  POST
};
