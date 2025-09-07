import { pgTable, text, timestamp, uuid, varchar, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { monitors } from './monitors';

// Email notifications - sent notifications tracking
export const emailNotifications = pgTable(
  'email_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    monitorId: uuid('monitor_id')
      .references(() => monitors.id, { onDelete: 'cascade' }), // null for system notifications
    
    // Email details
    subject: varchar('subject', { length: 255 }).notNull(),
    htmlContent: text('html_content').notNull(),
    plainTextContent: text('plain_text_content').notNull(),
    
    // Delivery tracking
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }),
    
    // SendGrid tracking
    sendGridMessageId: varchar('sendgrid_message_id', { length: 255 }).unique(),
    deliveryStatus: varchar('delivery_status', { length: 20 })
      .notNull()
      .$type<'sent' | 'delivered' | 'bounce' | 'spam' | 'unsubscribe' | 'failed'>()
      .default('sent'),
    
    // Trigger context
    triggerValue: jsonb('trigger_value'), // Value that triggered the notification
    previousValue: jsonb('previous_value'), // Previous value for comparison
    changeDetected: boolean('change_detected').notNull().default(false),
    
    // Notification type
    notificationType: varchar('notification_type', { length: 50 })
      .notNull()
      .$type<'monitor_trigger' | 'welcome' | 'email_verification' | 'password_reset' | 'system'>()
      .default('monitor_trigger'),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('email_notifications_user_idx').on(table.userId),
    monitorIdx: index('email_notifications_monitor_idx').on(table.monitorId),
    sentAtIdx: index('email_notifications_sent_at_idx').on(table.sentAt),
    deliveryStatusIdx: index('email_notifications_delivery_status_idx').on(table.deliveryStatus),
    sendGridIdIdx: index('email_notifications_sendgrid_id_idx').on(table.sendGridMessageId),
    notificationTypeIdx: index('email_notifications_type_idx').on(table.notificationType),
  })
);

// Email templates for different types of notifications
export const emailTemplates = pgTable(
  'email_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(), // 'monitor_trigger', 'welcome', etc.
    version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    subject: varchar('subject', { length: 255 }).notNull(),
    htmlTemplate: text('html_template').notNull(), // HTML template with placeholders
    plainTextTemplate: text('plain_text_template').notNull(), // Plain text template
    
    // Template metadata
    description: text('description'),
    variables: jsonb('variables').notNull(), // Array of required template variables
    isActive: boolean('is_active').notNull().default(true),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('email_templates_name_idx').on(table.name),
    activeIdx: index('email_templates_active_idx').on(table.isActive),
  })
);

// Email delivery webhooks from SendGrid
export const emailWebhooks = pgTable(
  'email_webhooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sendGridMessageId: varchar('sendgrid_message_id', { length: 255 }),
    eventType: varchar('event_type', { length: 50 }).notNull(), // 'delivered', 'bounce', 'open', etc.
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    
    // Webhook payload
    payload: jsonb('payload').notNull(), // Full SendGrid webhook payload
    
    // Processing status
    processed: boolean('processed').notNull().default(false),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    messageIdIdx: index('email_webhooks_message_id_idx').on(table.sendGridMessageId),
    eventTypeIdx: index('email_webhooks_event_type_idx').on(table.eventType),
    processedIdx: index('email_webhooks_processed_idx').on(table.processed),
    timestampIdx: index('email_webhooks_timestamp_idx').on(table.timestamp),
  })
);

// Email unsubscribes tracking
export const emailUnsubscribes = pgTable(
  'email_unsubscribes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    unsubscribeToken: varchar('unsubscribe_token', { length: 255 }).notNull().unique(),
    notificationType: varchar('notification_type', { length: 50 })
      .$type<'monitor_trigger' | 'welcome' | 'email_verification' | 'password_reset' | 'system' | 'all'>()
      .default('all'),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }).notNull().defaultNow(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('email_unsubscribes_user_idx').on(table.userId),
    tokenIdx: index('email_unsubscribes_token_idx').on(table.unsubscribeToken),
    emailTypeIdx: index('email_unsubscribes_email_type_idx').on(table.email, table.notificationType),
  })
);

// Define relationships
export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, {
    fields: [emailNotifications.userId],
    references: [users.id],
  }),
  monitor: one(monitors, {
    fields: [emailNotifications.monitorId],
    references: [monitors.id],
  }),
}));

export const emailUnsubscribesRelations = relations(emailUnsubscribes, ({ one }) => ({
  user: one(users, {
    fields: [emailUnsubscribes.userId],
    references: [users.id],
  }),
}));