import { j as json } from './index-Djsj11qr.js';
import { d as db } from './db-DnzjOtfS.js';
import 'pg';
import 'dotenv';

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

export { GET };
//# sourceMappingURL=_server.ts-CdZG6exx.js.map
