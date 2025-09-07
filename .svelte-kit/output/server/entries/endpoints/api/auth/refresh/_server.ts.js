import { json } from "@sveltejs/kit";
import { A as AuthService } from "../../../../../chunks/service.js";
const POST = async ({ cookies }) => {
  try {
    const refreshToken = cookies.get("refresh_token");
    if (!refreshToken) {
      return json(
        {
          success: false,
          error: "No refresh token provided"
        },
        { status: 401 }
      );
    }
    const result = await AuthService.refreshTokens(refreshToken);
    if (!result.success) {
      const headers2 = new Headers();
      headers2.append(
        "Set-Cookie",
        "access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
      );
      headers2.append(
        "Set-Cookie",
        "refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
      );
      return json(
        {
          success: false,
          error: result.error
        },
        {
          status: 401,
          headers: headers2
        }
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
        message: "Tokens refreshed successfully"
      },
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error("Token refresh endpoint error:", error);
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
