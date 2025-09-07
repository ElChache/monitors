import { json } from "@sveltejs/kit";
import { d as db } from "../../../../chunks/db.js";
const GET = async () => {
  let databaseConnected = false;
  try {
    await db.query("SELECT 1");
    databaseConnected = true;
  } catch (error) {
    console.error("Database connection error:", error);
  }
  return json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    database: databaseConnected,
    version: "0.1.0"
  });
};
export {
  GET
};
