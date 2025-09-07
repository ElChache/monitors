import { pgTable, text, boolean, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';

// Cache events tracking table
export const cacheEvents = pgTable(
  'cache_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    operation: varchar('operation', { length: 20 }).notNull().$type<'get' | 'set' | 'delete' | 'incr' | 'invalidate'>(),
    cacheType: varchar('cache_type', { length: 20 }).notNull().$type<'session' | 'monitor' | 'ai_response' | 'user' | 'email' | 'rate_limit' | 'user_bulk'>(),
    key: varchar('key', { length: 255 }).notNull(), // Cache key (without prefix)
    hit: boolean('hit').notNull().default(false), // Whether operation was successful/hit
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    
    // Optional metadata for debugging
    metadata: text('metadata'), // JSON string for additional context
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    operationIdx: index('cache_events_operation_idx').on(table.operation),
    cacheTypeIdx: index('cache_events_cache_type_idx').on(table.cacheType),
    hitIdx: index('cache_events_hit_idx').on(table.hit),
    timestampIdx: index('cache_events_timestamp_idx').on(table.timestamp),
    typeTimestampIdx: index('cache_events_type_timestamp_idx').on(table.cacheType, table.timestamp),
    keyIdx: index('cache_events_key_idx').on(table.key),
  })
);