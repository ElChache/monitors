import { pgTable, text, boolean, timestamp, uuid, varchar, integer, jsonb, index, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { emailNotifications } from './notifications';

// Monitors table - core monitor configuration
export const monitors = pgTable(
  'monitors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    prompt: text('prompt').notNull(), // Original user prompt
    type: varchar('type', { length: 10 }).notNull().$type<'state' | 'change'>(),
    isActive: boolean('is_active').notNull().default(true),
    
    // AI-extracted configuration
    extractedFact: text('extracted_fact').notNull(), // What to extract/monitor
    triggerCondition: text('trigger_condition').notNull(), // When to trigger alert
    factType: varchar('fact_type', { length: 20 }).notNull().$type<'number' | 'string' | 'boolean' | 'object'>(),
    
    // Current state tracking
    lastChecked: timestamp('last_checked', { withTimezone: true }),
    currentValue: jsonb('current_value'), // Current extracted fact value
    previousValue: jsonb('previous_value'), // Previous value for change detection
    triggerCount: integer('trigger_count').notNull().default(0),
    evaluationCount: integer('evaluation_count').notNull().default(0),
    
    // Rate limiting for manual refresh
    lastManualRefresh: timestamp('last_manual_refresh', { withTimezone: true }),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('monitors_user_idx').on(table.userId),
    activeIdx: index('monitors_active_idx').on(table.isActive),
    typeIdx: index('monitors_type_idx').on(table.type),
    lastCheckedIdx: index('monitors_last_checked_idx').on(table.lastChecked),
    nameSearchIdx: index('monitors_name_search_idx').on(table.name),
  })
);

// Monitor facts - historical data points
export const monitorFacts = pgTable(
  'monitor_facts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    value: jsonb('value').notNull(), // Extracted fact value
    extractedAt: timestamp('extracted_at', { withTimezone: true }).notNull().defaultNow(),
    source: varchar('source', { length: 500 }).notNull(), // URL or data source
    processingTime: integer('processing_time_ms').notNull(), // Processing time in milliseconds
    
    // Change detection
    triggeredAlert: boolean('triggered_alert').notNull().default(false),
    changeFromPrevious: jsonb('change_from_previous'), // Diff/change data
    
    // Data quality metrics
    confidence: numeric('confidence', { precision: 3, scale: 2 }).notNull().default('1.00'), // 0.00-1.00
    errors: jsonb('errors'), // Array of error messages if any
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    monitorIdx: index('monitor_facts_monitor_idx').on(table.monitorId),
    extractedAtIdx: index('monitor_facts_extracted_at_idx').on(table.extractedAt),
    triggeredAlertIdx: index('monitor_facts_triggered_alert_idx').on(table.triggeredAlert),
    sourceIdx: index('monitor_facts_source_idx').on(table.source),
  })
);

// Historical fact data for analytics and charts (partitioned by date)
export const factHistory = pgTable(
  'fact_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    value: jsonb('value').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    triggeredAlert: boolean('triggered_alert').notNull().default(false),
    source: varchar('source', { length: 500 }).notNull(),
    
    // Change metrics for analytics
    changeType: varchar('change_type', { length: 20 }).$type<'increase' | 'decrease' | 'stable' | 'new' | 'removed'>(),
    changeAmount: numeric('change_amount', { precision: 15, scale: 6 }), // For numerical changes
    changePercentage: numeric('change_percentage', { precision: 5, scale: 2 }), // Percentage change
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    monitorTimestampIdx: index('fact_history_monitor_timestamp_idx').on(table.monitorId, table.timestamp),
    timestampIdx: index('fact_history_timestamp_idx').on(table.timestamp),
    changeTypeIdx: index('fact_history_change_type_idx').on(table.changeType),
  })
);

// Monitor evaluation jobs tracking
export const monitorEvaluations = pgTable(
  'monitor_evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    jobId: varchar('job_id', { length: 255 }).unique(), // BullMQ job ID
    status: varchar('status', { length: 20 }).notNull().$type<'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'>().default('pending'),
    
    // Timing data
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    processingTimeMs: integer('processing_time_ms'),
    
    // Results
    extractedValue: jsonb('extracted_value'),
    triggeredAlert: boolean('triggered_alert').default(false),
    errorMessage: text('error_message'),
    
    // Metadata
    triggeredBy: varchar('triggered_by', { length: 50 }).notNull().$type<'schedule' | 'manual' | 'webhook'>(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    monitorIdx: index('monitor_evaluations_monitor_idx').on(table.monitorId),
    statusIdx: index('monitor_evaluations_status_idx').on(table.status),
    jobIdIdx: index('monitor_evaluations_job_id_idx').on(table.jobId),
    triggeredByIdx: index('monitor_evaluations_triggered_by_idx').on(table.triggeredBy),
    createdAtIdx: index('monitor_evaluations_created_at_idx').on(table.createdAt),
  })
);

// Rate limiting tracking
export const rateLimits = pgTable(
  'rate_limits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    limitType: varchar('limit_type', { length: 50 }).notNull(), // 'daily_refresh', 'api_calls', etc.
    identifier: varchar('identifier', { length: 255 }).notNull(), // user_id, ip_address, etc.
    count: integer('count').notNull().default(1),
    resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userLimitIdx: index('rate_limits_user_limit_idx').on(table.userId, table.limitType),
    identifierLimitIdx: index('rate_limits_identifier_limit_idx').on(table.identifier, table.limitType),
    resetAtIdx: index('rate_limits_reset_at_idx').on(table.resetAt),
  })
);

// Monitor drafts - auto-save user input during monitor creation
export const monitorDrafts = pgTable(
  'monitor_drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    name: varchar('name', { length: 100 }),
    monitorType: varchar('monitor_type', { length: 10 }).$type<'state' | 'change'>(),
    extractedFact: text('extracted_fact'),
    triggerCondition: text('trigger_condition'),
    factType: varchar('fact_type', { length: 20 }).$type<'number' | 'string' | 'boolean' | 'object'>(),
    aiSuggestions: jsonb('ai_suggestions'), // Store AI suggestions for the draft
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('monitor_drafts_user_idx').on(table.userId),
    updatedAtIdx: index('monitor_drafts_updated_at_idx').on(table.updatedAt),
  })
);

// Define relationships
export const monitorsRelations = relations(monitors, ({ one, many }) => ({
  user: one(users, {
    fields: [monitors.userId],
    references: [users.id],
  }),
  facts: many(monitorFacts),
  history: many(factHistory),
  evaluations: many(monitorEvaluations),
  notifications: many(emailNotifications),
}));

export const monitorFactsRelations = relations(monitorFacts, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorFacts.monitorId],
    references: [monitors.id],
  }),
}));

export const factHistoryRelations = relations(factHistory, ({ one }) => ({
  monitor: one(monitors, {
    fields: [factHistory.monitorId],
    references: [monitors.id],
  }),
}));

export const monitorEvaluationsRelations = relations(monitorEvaluations, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorEvaluations.monitorId],
    references: [monitors.id],
  }),
}));

export const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
  user: one(users, {
    fields: [rateLimits.userId],
    references: [users.id],
  }),
}));