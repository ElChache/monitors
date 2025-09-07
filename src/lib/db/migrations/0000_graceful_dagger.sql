CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"refresh_token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"refresh_expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"webhook_url" varchar(500),
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"password_hash" text,
	"google_id" varchar(100),
	"is_beta_user" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "fact_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"triggered_alert" boolean DEFAULT false NOT NULL,
	"source" varchar(500) NOT NULL,
	"change_type" varchar(20),
	"change_amount" numeric(15, 6),
	"change_percentage" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitor_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"job_id" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"processing_time_ms" integer,
	"extracted_value" jsonb,
	"triggered_alert" boolean DEFAULT false,
	"error_message" text,
	"triggered_by" varchar(50) NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monitor_evaluations_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "monitor_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"extracted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" varchar(500) NOT NULL,
	"processing_time_ms" integer NOT NULL,
	"triggered_alert" boolean DEFAULT false NOT NULL,
	"change_from_previous" jsonb,
	"confidence" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"errors" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"type" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"extracted_fact" text NOT NULL,
	"trigger_condition" text NOT NULL,
	"fact_type" varchar(20) NOT NULL,
	"last_checked" timestamp with time zone,
	"current_value" jsonb,
	"previous_value" jsonb,
	"trigger_count" integer DEFAULT 0 NOT NULL,
	"evaluation_count" integer DEFAULT 0 NOT NULL,
	"last_manual_refresh" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"limit_type" varchar(50) NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"monitor_id" uuid,
	"subject" varchar(255) NOT NULL,
	"html_content" text NOT NULL,
	"plain_text_content" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"sendgrid_message_id" varchar(255),
	"delivery_status" varchar(20) DEFAULT 'sent' NOT NULL,
	"trigger_value" jsonb,
	"previous_value" jsonb,
	"change_detected" boolean DEFAULT false NOT NULL,
	"notification_type" varchar(50) DEFAULT 'monitor_trigger' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_notifications_sendgrid_message_id_unique" UNIQUE("sendgrid_message_id")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"html_template" text NOT NULL,
	"plain_text_template" text NOT NULL,
	"description" text,
	"variables" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "email_unsubscribes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"unsubscribe_token" varchar(255) NOT NULL,
	"notification_type" varchar(50) DEFAULT 'all',
	"unsubscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_unsubscribes_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "email_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sendgrid_message_id" varchar(255),
	"event_type" varchar(50) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_history" ADD CONSTRAINT "fact_history_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor_evaluations" ADD CONSTRAINT "monitor_evaluations_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor_facts" ADD CONSTRAINT "monitor_facts_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitors" ADD CONSTRAINT "monitors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_unsubscribes" ADD CONSTRAINT "email_unsubscribes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_verification_token_idx" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "email_verification_user_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_expiry_idx" ON "email_verification_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "oauth_provider_user_idx" ON "oauth_accounts" USING btree ("provider","provider_user_id");--> statement-breakpoint
CREATE INDEX "oauth_user_idx" ON "oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_expiry_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "sessions_refresh_token_idx" ON "sessions" USING btree ("refresh_token");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_preferences_user_idx" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "users_beta_user_idx" ON "users" USING btree ("is_beta_user");--> statement-breakpoint
CREATE INDEX "fact_history_monitor_timestamp_idx" ON "fact_history" USING btree ("monitor_id","timestamp");--> statement-breakpoint
CREATE INDEX "fact_history_timestamp_idx" ON "fact_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "fact_history_change_type_idx" ON "fact_history" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX "monitor_evaluations_monitor_idx" ON "monitor_evaluations" USING btree ("monitor_id");--> statement-breakpoint
CREATE INDEX "monitor_evaluations_status_idx" ON "monitor_evaluations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "monitor_evaluations_job_id_idx" ON "monitor_evaluations" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "monitor_evaluations_triggered_by_idx" ON "monitor_evaluations" USING btree ("triggered_by");--> statement-breakpoint
CREATE INDEX "monitor_evaluations_created_at_idx" ON "monitor_evaluations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "monitor_facts_monitor_idx" ON "monitor_facts" USING btree ("monitor_id");--> statement-breakpoint
CREATE INDEX "monitor_facts_extracted_at_idx" ON "monitor_facts" USING btree ("extracted_at");--> statement-breakpoint
CREATE INDEX "monitor_facts_triggered_alert_idx" ON "monitor_facts" USING btree ("triggered_alert");--> statement-breakpoint
CREATE INDEX "monitor_facts_source_idx" ON "monitor_facts" USING btree ("source");--> statement-breakpoint
CREATE INDEX "monitors_user_idx" ON "monitors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "monitors_active_idx" ON "monitors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "monitors_type_idx" ON "monitors" USING btree ("type");--> statement-breakpoint
CREATE INDEX "monitors_last_checked_idx" ON "monitors" USING btree ("last_checked");--> statement-breakpoint
CREATE INDEX "monitors_name_search_idx" ON "monitors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "rate_limits_user_limit_idx" ON "rate_limits" USING btree ("user_id","limit_type");--> statement-breakpoint
CREATE INDEX "rate_limits_identifier_limit_idx" ON "rate_limits" USING btree ("identifier","limit_type");--> statement-breakpoint
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits" USING btree ("reset_at");--> statement-breakpoint
CREATE INDEX "email_notifications_user_idx" ON "email_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_notifications_monitor_idx" ON "email_notifications" USING btree ("monitor_id");--> statement-breakpoint
CREATE INDEX "email_notifications_sent_at_idx" ON "email_notifications" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_notifications_delivery_status_idx" ON "email_notifications" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "email_notifications_sendgrid_id_idx" ON "email_notifications" USING btree ("sendgrid_message_id");--> statement-breakpoint
CREATE INDEX "email_notifications_type_idx" ON "email_notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX "email_templates_name_idx" ON "email_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "email_templates_active_idx" ON "email_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_unsubscribes_user_idx" ON "email_unsubscribes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_unsubscribes_token_idx" ON "email_unsubscribes" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "email_unsubscribes_email_type_idx" ON "email_unsubscribes" USING btree ("email","notification_type");--> statement-breakpoint
CREATE INDEX "email_webhooks_message_id_idx" ON "email_webhooks" USING btree ("sendgrid_message_id");--> statement-breakpoint
CREATE INDEX "email_webhooks_event_type_idx" ON "email_webhooks" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "email_webhooks_processed_idx" ON "email_webhooks" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "email_webhooks_timestamp_idx" ON "email_webhooks" USING btree ("timestamp");