import { json } from "@sveltejs/kit";
import { A as AuthService } from "../../../../../chunks/service.js";
import { r as rateLimit } from "../../../../../chunks/rateLimit.js";
const POST = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  try {
    const body = await request.json();
    const rateLimitResult = await rateLimit({
      identifier: `reset-password:${clientIP}`,
      limit: 5,
      window: 15 * 60,
      // 15 minutes
      type: "password_reset_attempt"
    });
    if (!rateLimitResult.allowed) {
      return json(
        {
          success: false,
          error: "Too many reset attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }
    const result = await AuthService.resetPassword(body);
    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error,
          errors: result.errors
        },
        { status: 400 }
      );
    }
    return json(
      {
        success: true,
        message: "Password has been reset successfully. Please login with your new password."
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password endpoint error:", error);
    return json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
};
export {
  POST
};
