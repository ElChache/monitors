import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as userSchema from './schemas/users';
import * as monitorSchema from './schemas/monitors';
import * as notificationSchema from './schemas/notifications';

config();

// Database connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:8081/monitors_be_primary_001_23f6',
  max: 10, // Maximum number of connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout after 2 seconds
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Create Drizzle database instance with all schemas
export const db = drizzle(pool, {
  schema: {
    ...userSchema,
    ...monitorSchema,
    ...notificationSchema,
  },
});

// Export pool for manual connection management if needed
export { pool };

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});