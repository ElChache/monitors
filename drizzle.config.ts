import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default {
  schema: './src/lib/db/schemas/*',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:8081/monitors_be_primary_001_23f6'
  },
  verbose: true,
  strict: true,
} satisfies Config;