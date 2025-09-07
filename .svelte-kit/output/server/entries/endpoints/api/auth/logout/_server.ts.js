import { json } from "@sveltejs/kit";
import { A as AuthService } from "../../../../../chunks/service.js";
const POST = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (accessToken) {
      await AuthService.logout(accessToken);
    }
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      "access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    );
    headers.append(
      "Set-Cookie",
      "refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    );
    return json(
      {
        success: true,
        message: "Logout successful"
      },
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error("Logout endpoint error:", error);
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
