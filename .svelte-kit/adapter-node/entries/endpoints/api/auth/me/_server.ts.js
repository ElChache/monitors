import { json } from "@sveltejs/kit";
import { A as AuthService } from "../../../../../chunks/service.js";
const GET = async ({ cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      return json(
        {
          success: false,
          error: "Not authenticated"
        },
        { status: 401 }
      );
    }
    const user = await AuthService.getCurrentUser(accessToken);
    if (!user) {
      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        "access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
      );
      return json(
        {
          success: false,
          error: "Invalid or expired token"
        },
        {
          status: 401,
          headers
        }
      );
    }
    return json(
      {
        success: true,
        user
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user endpoint error:", error);
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
  GET
};
