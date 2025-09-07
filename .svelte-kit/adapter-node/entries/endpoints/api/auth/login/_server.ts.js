import { json } from "@sveltejs/kit";
import { A as AuthService } from "../../../../../chunks/service2.js";
import { c as checkAuthLimit } from "../../../../../chunks/rateLimit.js";
const POST = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  try {
    const body = await request.json();
    const { email } = body;
    const rateLimitResult = await checkAuthLimit(`${clientIP}:${email || "unknown"}`);
    if (!rateLimitResult.allowed) {
      return json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }
    const result = await AuthService.login(body);
    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error
        },
        { status: 401 }
      );
    }
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `access_token=${result.tokens.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`
    );
    headers.append(
      "Set-Cookie",
      `refresh_token=${result.tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
    );
    return json(
      {
        success: true,
        user: result.user,
        session: result.session,
        message: "Login successful"
      },
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error("Login endpoint error:", error);
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
