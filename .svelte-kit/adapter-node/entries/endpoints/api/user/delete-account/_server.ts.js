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
    const body = await request.json();
    const { confirmationText, password } = body;
    if (confirmationText !== "DELETE MY ACCOUNT") {
      return json({
        error: 'Account deletion requires exact confirmation text: "DELETE MY ACCOUNT"'
      }, { status: 400 });
    }
    if (password) {
      try {
        const { db } = await import("../../../../../chunks/db.js");
        const { users } = await import("../../../../../chunks/users.js").then((n) => n.c);
        const { eq } = await import("drizzle-orm");
        const [userRecord] = await db.select().from(users).where(eq(users.id, user.id));
        if (userRecord?.passwordHash) {
          const { PasswordService } = await import("../../../../../chunks/service2.js").then((n) => n.p);
          const isPasswordValid = await PasswordService.verifyPassword(
            password,
            userRecord.passwordHash
          );
          if (!isPasswordValid) {
            return json({ error: "Invalid password" }, { status: 401 });
          }
        }
      } catch (error) {
        console.error("Password verification error:", error);
        return json({ error: "Password verification failed" }, { status: 500 });
      }
    }
    await UserAccountService.deleteUserAccount(user.id);
    console.log(`User account deleted: ${user.id} (${user.email}) at ${(/* @__PURE__ */ new Date()).toISOString()}`);
    return json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Delete user account error:", error);
    return json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
export {
  POST
};
