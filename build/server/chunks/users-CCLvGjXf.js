import { pgTable, timestamp, jsonb, varchar, text, uuid, index, integer, boolean, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const emailNotifications = pgTable(
  "email_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    monitorId: uuid("monitor_id").references(() => monitors.id, { onDelete: "cascade" }),
    // null for system notifications
    // Email details
    subject: varchar("subject", { length: 255 }).notNull(),
    htmlContent: text("html_content").notNull(),
    plainTextContent: text("plain_text_content").notNull(),
    // Delivery tracking
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    // SendGrid tracking
    sendGridMessageId: varchar("sendgrid_message_id", { length: 255 }).unique(),
    deliveryStatus: varchar("delivery_status", { length: 20 }).notNull().$type().default("sent"),
    // Trigger context
    triggerValue: jsonb("trigger_value"),
    // Value that triggered the notification
    previousValue: jsonb("previous_value"),
    // Previous value for comparison
    changeDetected: boolean("change_detected").notNull().default(false),
    // Notification type
    notificationType: varchar("notification_type", { length: 50 }).notNull().$type().default("monitor_trigger"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("email_notifications_user_idx").on(table.userId),
    monitorIdx: index("email_notifications_monitor_idx").on(table.monitorId),
    sentAtIdx: index("email_notifications_sent_at_idx").on(table.sentAt),
    deliveryStatusIdx: index("email_notifications_delivery_status_idx").on(table.deliveryStatus),
    sendGridIdIdx: index("email_notifications_sendgrid_id_idx").on(table.sendGridMessageId),
    notificationTypeIdx: index("email_notifications_type_idx").on(table.notificationType)
  })
);
const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    // 'monitor_trigger', 'welcome', etc.
    version: varchar("version", { length: 20 }).notNull().default("1.0.0"),
    subject: varchar("subject", { length: 255 }).notNull(),
    htmlTemplate: text("html_template").notNull(),
    // HTML template with placeholders
    plainTextTemplate: text("plain_text_template").notNull(),
    // Plain text template
    // Template metadata
    description: text("description"),
    variables: jsonb("variables").notNull(),
    // Array of required template variables
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    nameIdx: index("email_templates_name_idx").on(table.name),
    activeIdx: index("email_templates_active_idx").on(table.isActive)
  })
);
const emailWebhooks = pgTable(
  "email_webhooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sendGridMessageId: varchar("sendgrid_message_id", { length: 255 }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    // 'delivered', 'bounce', 'open', etc.
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    // Webhook payload
    payload: jsonb("payload").notNull(),
    // Full SendGrid webhook payload
    // Processing status
    processed: boolean("processed").notNull().default(false),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    messageIdIdx: index("email_webhooks_message_id_idx").on(table.sendGridMessageId),
    eventTypeIdx: index("email_webhooks_event_type_idx").on(table.eventType),
    processedIdx: index("email_webhooks_processed_idx").on(table.processed),
    timestampIdx: index("email_webhooks_timestamp_idx").on(table.timestamp)
  })
);
const emailUnsubscribes = pgTable(
  "email_unsubscribes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    unsubscribeToken: varchar("unsubscribe_token", { length: 255 }).notNull().unique(),
    notificationType: varchar("notification_type", { length: 50 }).$type().default("all"),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("email_unsubscribes_user_idx").on(table.userId),
    tokenIdx: index("email_unsubscribes_token_idx").on(table.unsubscribeToken),
    emailTypeIdx: index("email_unsubscribes_email_type_idx").on(table.email, table.notificationType)
  })
);
const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, {
    fields: [emailNotifications.userId],
    references: [users.id]
  }),
  monitor: one(monitors, {
    fields: [emailNotifications.monitorId],
    references: [monitors.id]
  })
}));
const emailUnsubscribesRelations = relations(emailUnsubscribes, ({ one }) => ({
  user: one(users, {
    fields: [emailUnsubscribes.userId],
    references: [users.id]
  })
}));
const notificationSchema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  emailNotifications,
  emailNotificationsRelations,
  emailTemplates,
  emailUnsubscribes,
  emailUnsubscribesRelations,
  emailWebhooks
}, Symbol.toStringTag, { value: "Module" }));
const monitors = pgTable(
  "monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    prompt: text("prompt").notNull(),
    // Original user prompt
    type: varchar("type", { length: 10 }).notNull().$type(),
    isActive: boolean("is_active").notNull().default(true),
    // AI-extracted configuration
    extractedFact: text("extracted_fact").notNull(),
    // What to extract/monitor
    triggerCondition: text("trigger_condition").notNull(),
    // When to trigger alert
    factType: varchar("fact_type", { length: 20 }).notNull().$type(),
    // Current state tracking
    lastChecked: timestamp("last_checked", { withTimezone: true }),
    currentValue: jsonb("current_value"),
    // Current extracted fact value
    previousValue: jsonb("previous_value"),
    // Previous value for change detection
    triggerCount: integer("trigger_count").notNull().default(0),
    evaluationCount: integer("evaluation_count").notNull().default(0),
    // Rate limiting for manual refresh
    lastManualRefresh: timestamp("last_manual_refresh", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("monitors_user_idx").on(table.userId),
    activeIdx: index("monitors_active_idx").on(table.isActive),
    typeIdx: index("monitors_type_idx").on(table.type),
    lastCheckedIdx: index("monitors_last_checked_idx").on(table.lastChecked),
    nameSearchIdx: index("monitors_name_search_idx").on(table.name)
  })
);
const monitorFacts = pgTable(
  "monitor_facts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
    value: jsonb("value").notNull(),
    // Extracted fact value
    extractedAt: timestamp("extracted_at", { withTimezone: true }).notNull().defaultNow(),
    source: varchar("source", { length: 500 }).notNull(),
    // URL or data source
    processingTime: integer("processing_time_ms").notNull(),
    // Processing time in milliseconds
    // Change detection
    triggeredAlert: boolean("triggered_alert").notNull().default(false),
    changeFromPrevious: jsonb("change_from_previous"),
    // Diff/change data
    // Data quality metrics
    confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull().default("1.00"),
    // 0.00-1.00
    errors: jsonb("errors"),
    // Array of error messages if any
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    monitorIdx: index("monitor_facts_monitor_idx").on(table.monitorId),
    extractedAtIdx: index("monitor_facts_extracted_at_idx").on(table.extractedAt),
    triggeredAlertIdx: index("monitor_facts_triggered_alert_idx").on(table.triggeredAlert),
    sourceIdx: index("monitor_facts_source_idx").on(table.source)
  })
);
const factHistory = pgTable(
  "fact_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
    value: jsonb("value").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    triggeredAlert: boolean("triggered_alert").notNull().default(false),
    source: varchar("source", { length: 500 }).notNull(),
    // Change metrics for analytics
    changeType: varchar("change_type", { length: 20 }).$type(),
    changeAmount: numeric("change_amount", { precision: 15, scale: 6 }),
    // For numerical changes
    changePercentage: numeric("change_percentage", { precision: 5, scale: 2 }),
    // Percentage change
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    monitorTimestampIdx: index("fact_history_monitor_timestamp_idx").on(table.monitorId, table.timestamp),
    timestampIdx: index("fact_history_timestamp_idx").on(table.timestamp),
    changeTypeIdx: index("fact_history_change_type_idx").on(table.changeType)
  })
);
const monitorEvaluations = pgTable(
  "monitor_evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
    jobId: varchar("job_id", { length: 255 }).unique(),
    // BullMQ job ID
    status: varchar("status", { length: 20 }).notNull().$type().default("pending"),
    // Timing data
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    processingTimeMs: integer("processing_time_ms"),
    // Results
    extractedValue: jsonb("extracted_value"),
    triggeredAlert: boolean("triggered_alert").default(false),
    errorMessage: text("error_message"),
    // Metadata
    triggeredBy: varchar("triggered_by", { length: 50 }).notNull().$type(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    monitorIdx: index("monitor_evaluations_monitor_idx").on(table.monitorId),
    statusIdx: index("monitor_evaluations_status_idx").on(table.status),
    jobIdIdx: index("monitor_evaluations_job_id_idx").on(table.jobId),
    triggeredByIdx: index("monitor_evaluations_triggered_by_idx").on(table.triggeredBy),
    createdAtIdx: index("monitor_evaluations_created_at_idx").on(table.createdAt)
  })
);
const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    limitType: varchar("limit_type", { length: 50 }).notNull(),
    // 'daily_refresh', 'api_calls', etc.
    identifier: varchar("identifier", { length: 255 }).notNull(),
    // user_id, ip_address, etc.
    count: integer("count").notNull().default(1),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userLimitIdx: index("rate_limits_user_limit_idx").on(table.userId, table.limitType),
    identifierLimitIdx: index("rate_limits_identifier_limit_idx").on(table.identifier, table.limitType),
    resetAtIdx: index("rate_limits_reset_at_idx").on(table.resetAt)
  })
);
const monitorDrafts = pgTable(
  "monitor_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    name: varchar("name", { length: 100 }),
    monitorType: varchar("monitor_type", { length: 10 }).$type(),
    extractedFact: text("extracted_fact"),
    triggerCondition: text("trigger_condition"),
    factType: varchar("fact_type", { length: 20 }).$type(),
    aiSuggestions: jsonb("ai_suggestions"),
    // Store AI suggestions for the draft
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("monitor_drafts_user_idx").on(table.userId),
    updatedAtIdx: index("monitor_drafts_updated_at_idx").on(table.updatedAt)
  })
);
const monitorsRelations = relations(monitors, ({ one, many }) => ({
  user: one(users, {
    fields: [monitors.userId],
    references: [users.id]
  }),
  facts: many(monitorFacts),
  history: many(factHistory),
  evaluations: many(monitorEvaluations),
  notifications: many(emailNotifications)
}));
const monitorFactsRelations = relations(monitorFacts, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorFacts.monitorId],
    references: [monitors.id]
  })
}));
const factHistoryRelations = relations(factHistory, ({ one }) => ({
  monitor: one(monitors, {
    fields: [factHistory.monitorId],
    references: [monitors.id]
  })
}));
const monitorEvaluationsRelations = relations(monitorEvaluations, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorEvaluations.monitorId],
    references: [monitors.id]
  })
}));
const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
  user: one(users, {
    fields: [rateLimits.userId],
    references: [users.id]
  })
}));
const monitorSchema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  factHistory,
  factHistoryRelations,
  monitorDrafts,
  monitorEvaluations,
  monitorEvaluationsRelations,
  monitorFacts,
  monitorFactsRelations,
  monitors,
  monitorsRelations,
  rateLimits,
  rateLimitsRelations
}, Symbol.toStringTag, { value: "Module" }));
const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    passwordHash: text("password_hash"),
    // null for OAuth users
    googleId: varchar("google_id", { length: 100 }).unique(),
    isBetaUser: boolean("is_beta_user").notNull().default(false),
    isAdmin: boolean("is_admin").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true })
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    googleIdIdx: index("users_google_id_idx").on(table.googleId),
    betaUserIdx: index("users_beta_user_idx").on(table.isBetaUser)
  })
);
const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    // 'google', 'github', etc.
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiry: timestamp("token_expiry", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    providerUserIdx: index("oauth_provider_user_idx").on(table.provider, table.providerUserId),
    userIdx: index("oauth_user_idx").on(table.userId)
  })
);
const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
    refreshToken: varchar("refresh_token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    refreshExpiresAt: timestamp("refresh_expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    sessionTokenIdx: index("sessions_token_idx").on(table.sessionToken),
    refreshTokenIdx: index("sessions_refresh_token_idx").on(table.refreshToken),
    userIdx: index("sessions_user_idx").on(table.userId),
    expiryIdx: index("sessions_expiry_idx").on(table.expiresAt)
  })
);
const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    isUsed: boolean("is_used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tokenIdx: index("password_reset_token_idx").on(table.token),
    userIdx: index("password_reset_user_idx").on(table.userId),
    expiryIdx: index("password_reset_expiry_idx").on(table.expiresAt)
  })
);
const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    // Email being verified
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    isUsed: boolean("is_used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tokenIdx: index("email_verification_token_idx").on(table.token),
    userIdx: index("email_verification_user_idx").on(table.userId),
    expiryIdx: index("email_verification_expiry_idx").on(table.expiresAt)
  })
);
const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
    emailNotifications: boolean("email_notifications").notNull().default(true),
    webhookUrl: varchar("webhook_url", { length: 500 }),
    timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("user_preferences_user_idx").on(table.userId)
  })
);
const usersRelations = relations(users, ({ many, one }) => ({
  monitors: many(monitors),
  notifications: many(emailNotifications),
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
  preferences: one(userPreferences)
}));
const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id]
  })
}));
const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id]
  })
}));
const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id]
  })
}));
const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id]
  })
}));
const userSchema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  emailVerificationTokens,
  emailVerificationTokensRelations,
  oauthAccounts,
  oauthAccountsRelations,
  passwordResetTokens,
  passwordResetTokensRelations,
  sessions,
  sessionsRelations,
  userPreferences,
  userPreferencesRelations,
  users,
  usersRelations
}, Symbol.toStringTag, { value: "Module" }));

export { monitorDrafts as a, monitorSchema as b, userSchema as c, emailUnsubscribes as d, emailNotifications as e, monitorEvaluations as f, factHistory as g, userPreferences as h, emailVerificationTokens as i, monitorFacts as j, monitors as m, notificationSchema as n, passwordResetTokens as p, sessions as s, users as u };
//# sourceMappingURL=users-CCLvGjXf.js.map
