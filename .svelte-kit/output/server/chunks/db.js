import pg from "pg";
import { config } from "dotenv";
config();
const { Pool } = pg;
const pool = new Pool({
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME || "monitors",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
  max: 20,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 2e3
});
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});
const db = {
  query: (text, params) => {
    return pool.query(text, params);
  },
  getClient: async () => {
    return await pool.connect();
  },
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
  end: async () => {
    await pool.end();
  }
};
export {
  db as d
};
