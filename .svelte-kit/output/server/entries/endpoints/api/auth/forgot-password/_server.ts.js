import { json } from "@sveltejs/kit";
import { A as AuthService } from "../../../../../chunks/service.js";
import { r as rateLimit } from "../../../../../chunks/rateLimit.js";
import { z } from "zod";
const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
});
const POST = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  try {
    const body = await request.json();
    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return json(
        {
          success: false,
          error: "Invalid email address"
        },
        { status: 400 }
      );
    }
    const { email } = validation.data;
    const rateLimitResult = await rateLimit({
      identifier: `forgot-password:${clientIP}`,
      limit: 3,
      window: 60 * 60,
      // 1 hour
      type: "password_reset"
    });
    if (!rateLimitResult.allowed) {
      return json(
        {
          success: false,
          error: "Too many password reset requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }
    const result = await AuthService.requestPasswordReset(email);
    return json(
      {
        success: true,
        message: "If an account with that email exists, we have sent a password reset link."
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password endpoint error:", error);
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
