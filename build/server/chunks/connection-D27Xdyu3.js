import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { n as notificationSchema, b as monitorSchema, c as userSchema } from './users-CCLvGjXf.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';

config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
  max: 10,
  // Maximum number of connections in pool
  idleTimeoutMillis: 3e4,
  // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2e3
  // Timeout after 2 seconds
});
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});
const db = drizzle(pool, {
  schema: {
    ...userSchema,
    ...monitorSchema,
    ...notificationSchema
  }
});
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

export { db, pool };
//# sourceMappingURL=connection-D27Xdyu3.js.map
