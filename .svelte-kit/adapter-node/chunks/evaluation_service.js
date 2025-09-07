import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { u as users, m as monitors, j as monitorFacts, g as factHistory, f as monitorEvaluations } from "./users.js";
import puppeteer from "puppeteer";
import { E as EmailService } from "./service4.js";
import { a as EmailTrackingService } from "./templates.js";
import { z } from "zod";
class WebScraperService {
  static browser = null;
  static initializationPromise = null;
  /**
   * Initialize Puppeteer browser
   */
  static async initializeBrowser() {
    if (this.browser) return;
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }
    this.initializationPromise = (async () => {
      try {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu"
          ]
        });
        console.log("Puppeteer browser initialized");
      } catch (error) {
        console.error("Failed to initialize Puppeteer browser:", error);
        this.initializationPromise = null;
        throw error;
      }
    })();
    await this.initializationPromise;
  }
  /**
   * Extract data from a URL using CSS selectors
   */
  static async extractData(url, options = {}) {
    const startTime = Date.now();
    try {
      await this.initializeBrowser();
      if (!this.browser) {
        throw new Error("Browser not initialized");
      }
      const page = await this.browser.newPage();
      try {
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        await page.setViewport({ width: 1920, height: 1080 });
        const timeout = options.timeout || 3e4;
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout
        });
        if (options.waitFor) {
          await page.waitForSelector(options.waitFor, { timeout: 1e4 });
        }
        let data = null;
        if (options.selector) {
          data = await this.extractBySelector(page, options.selector, options.type);
        } else {
          data = await page.evaluate(() => ({
            title: document.title,
            url: window.location.href,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }));
        }
        let screenshot;
        if (options.screenshot) {
          screenshot = await page.screenshot({
            fullPage: false,
            type: "png"
          });
        }
        const processingTime = Date.now() - startTime;
        console.log(`Scraped ${url} in ${processingTime}ms`);
        return data;
      } finally {
        await page.close();
      }
    } catch (error) {
      console.error("Web scraping failed:", error);
      return null;
    }
  }
  /**
   * Extract data using CSS selector
   */
  static async extractBySelector(page, selector, type = "string") {
    try {
      const selectors = selector.split(",").map((s) => s.trim());
      for (const sel of selectors) {
        const element = await page.$(sel);
        if (element) {
          const text = await element.evaluate((el) => el.textContent?.trim() || "");
          if (text) {
            return this.convertToType(text, type);
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Selector extraction failed:", error);
      return null;
    }
  }
  /**
   * Convert extracted text to specified type
   */
  static convertToType(text, type) {
    switch (type) {
      case "number":
        const numMatch = text.match(/[\d.,]+/);
        if (numMatch) {
          const cleanNum = numMatch[0].replace(/,/g, "");
          const num = parseFloat(cleanNum);
          return isNaN(num) ? null : num;
        }
        return null;
      case "boolean":
        const lowerText = text.toLowerCase();
        if (["true", "yes", "available", "in stock", "active", "enabled"].some((t) => lowerText.includes(t))) {
          return true;
        }
        if (["false", "no", "unavailable", "out of stock", "inactive", "disabled"].some((t) => lowerText.includes(t))) {
          return false;
        }
        return null;
      case "object":
        try {
          return JSON.parse(text);
        } catch {
          return { value: text, extracted: (/* @__PURE__ */ new Date()).toISOString() };
        }
      case "string":
      default:
        return text;
    }
  }
  /**
   * Test scraping functionality
   */
  static async testScraping() {
    const testUrls = [
      {
        url: "https://example.com",
        selector: "h1",
        type: "string"
      },
      {
        url: "https://httpstat.us/200",
        selector: "body",
        type: "string"
      }
    ];
    const results = [];
    let successCount = 0;
    for (const test of testUrls) {
      try {
        const data = await this.extractData(test.url, {
          selector: test.selector,
          type: test.type,
          timeout: 1e4
        });
        const success = data !== null;
        if (success) successCount++;
        results.push({
          url: test.url,
          success,
          data,
          error: success ? void 0 : "No data extracted"
        });
      } catch (error) {
        results.push({
          url: test.url,
          success: false,
          data: null,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    return {
      success: successCount > 0,
      results
    };
  }
  /**
   * Health check for scraping service
   */
  static async healthCheck() {
    try {
      await this.initializeBrowser();
      const browserReady = this.browser !== null;
      let canScrape = false;
      let version;
      if (browserReady) {
        const testResult = await this.extractData("data:text/html,<html><body><h1>Test</h1></body></html>", {
          selector: "h1",
          timeout: 5e3
        });
        canScrape = testResult === "Test";
        version = await this.browser.version();
      }
      return {
        browserReady,
        canScrape,
        version
      };
    } catch (error) {
      console.error("Scraping health check failed:", error);
      return {
        browserReady: false,
        canScrape: false
      };
    }
  }
  /**
   * Close browser (cleanup)
   */
  static async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.initializationPromise = null;
      console.log("Puppeteer browser closed");
    }
  }
}
class IntegratedEmailService {
  /**
   * Send AI-generated monitor notification with enhanced personalization
   */
  static async sendAIGeneratedNotification(monitorId, currentValue, previousValue, aiNotificationData) {
    try {
      const monitorResult = await db.select({
        monitor: monitors,
        user: users
      }).from(monitors).innerJoin(users, eq(monitors.userId, users.id)).where(eq(monitors.id, monitorId)).limit(1);
      if (monitorResult.length === 0) {
        console.error("Monitor or user not found:", monitorId);
        return false;
      }
      const { monitor, user } = monitorResult[0];
      const isUnsubscribed = await EmailTrackingService.isUnsubscribed(
        user.id,
        "monitor_notifications"
      );
      if (isUnsubscribed) {
        console.log(`User ${user.email} is unsubscribed from monitor notifications`);
        return true;
      }
      const baseUrl = process.env.APP_URL || "https://monitors.app";
      const monitorUrl = `${baseUrl}/monitors/${monitor.id}`;
      const dashboardUrl = `${baseUrl}/dashboard`;
      const unsubscribeUrl = EmailTrackingService.generateUnsubscribeUrl(
        user.id,
        "monitor_notifications"
      );
      const enhancedNotificationData = {
        monitorName: monitor.name,
        userName: user.name || user.email.split("@")[0],
        currentValue,
        previousValue,
        triggerCondition: monitor.triggerCondition,
        monitorUrl,
        dashboardUrl,
        unsubscribeUrl,
        // AI-enhanced fields
        aiSubject: aiNotificationData.subject,
        aiBody: aiNotificationData.body,
        urgencyLevel: aiNotificationData.urgency || "medium",
        actionRecommendations: aiNotificationData.recommendations || [],
        contextualInsights: aiNotificationData.insights || []
      };
      const success = await EmailService.sendMonitorNotification(
        user.email,
        enhancedNotificationData
      );
      await EmailTrackingService.logDelivery(
        user.id,
        user.email,
        "ai_monitor_notification",
        aiNotificationData.subject || `AI Monitor Alert: ${monitor.name}`,
        {
          success,
          messageId: success ? `ai_monitor_${monitorId}_${Date.now()}` : void 0,
          urgency: aiNotificationData.urgency,
          aiGenerated: true
        }
      );
      return success;
    } catch (error) {
      console.error("Failed to send AI-generated monitor notification:", error);
      return false;
    }
  }
  /**
   * Send monitor notification with full database integration
   */
  static async sendMonitorNotification(monitorId, currentValue, previousValue = null) {
    try {
      const monitorResult = await db.select({
        monitor: monitors,
        user: users
      }).from(monitors).innerJoin(users, eq(monitors.userId, users.id)).where(eq(monitors.id, monitorId)).limit(1);
      if (monitorResult.length === 0) {
        console.error("Monitor or user not found:", monitorId);
        return false;
      }
      const { monitor, user } = monitorResult[0];
      const isUnsubscribed = await EmailTrackingService.isUnsubscribed(
        user.id,
        "monitor_notifications"
      );
      if (isUnsubscribed) {
        console.log(`User ${user.email} is unsubscribed from monitor notifications`);
        return true;
      }
      const baseUrl = process.env.APP_URL || "https://monitors.app";
      const monitorUrl = `${baseUrl}/monitors/${monitor.id}`;
      const dashboardUrl = `${baseUrl}/dashboard`;
      const unsubscribeUrl = EmailTrackingService.generateUnsubscribeUrl(
        user.id,
        "monitor_notifications"
      );
      const notificationData = {
        monitorName: monitor.name,
        userName: user.name || user.email.split("@")[0],
        currentValue,
        previousValue,
        triggerCondition: monitor.triggerCondition,
        monitorUrl,
        dashboardUrl,
        unsubscribeUrl
      };
      const success = await EmailService.sendMonitorNotification(
        user.email,
        notificationData
      );
      await EmailTrackingService.logDelivery(
        user.id,
        user.email,
        "monitor_notification",
        `Monitor Alert: ${monitor.name}`,
        { success, messageId: success ? `monitor_${monitorId}_${Date.now()}` : void 0 }
      );
      return success;
    } catch (error) {
      console.error("Failed to send monitor notification:", error);
      return false;
    }
  }
  /**
   * Send user verification email with database integration
   */
  static async sendUserVerification(userId, verificationToken) {
    try {
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userResult.length === 0) {
        console.error("User not found:", userId);
        return false;
      }
      const user = userResult[0];
      const baseUrl = process.env.APP_URL || "https://monitors.app";
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      const verificationData = {
        userName: user.name || user.email.split("@")[0],
        verificationUrl,
        expirationHours: 24
      };
      const success = await EmailService.sendUserVerification(
        user.email,
        verificationData
      );
      await EmailTrackingService.logDelivery(
        user.id,
        user.email,
        "user_verification",
        "Verify your Monitors! account",
        { success, messageId: success ? `verify_${userId}_${Date.now()}` : void 0 }
      );
      return success;
    } catch (error) {
      console.error("Failed to send user verification email:", error);
      return false;
    }
  }
  /**
   * Send password reset email with database integration
   */
  static async sendPasswordReset(userId, resetToken) {
    try {
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userResult.length === 0) {
        console.error("User not found:", userId);
        return false;
      }
      const user = userResult[0];
      const baseUrl = process.env.APP_URL || "https://monitors.app";
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      const resetData = {
        userName: user.name || user.email.split("@")[0],
        resetUrl,
        expirationHours: 2
      };
      const success = await EmailService.sendPasswordReset(
        user.email,
        resetData
      );
      await EmailTrackingService.logDelivery(
        user.id,
        user.email,
        "password_reset",
        "Reset your Monitors! password",
        { success, messageId: success ? `reset_${userId}_${Date.now()}` : void 0 }
      );
      return success;
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return false;
    }
  }
  /**
   * Send bulk monitor notifications (for scheduled evaluations)
   */
  static async sendBulkMonitorNotifications(notifications) {
    let sent = 0;
    let failed = 0;
    for (const notification of notifications) {
      try {
        const success = await this.sendMonitorNotification(
          notification.monitorId,
          notification.currentValue,
          notification.previousValue
        );
        if (success) {
          sent++;
        } else {
          failed++;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Failed to send bulk notification:", error);
        failed++;
      }
    }
    console.log(`Bulk notification results: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }
  /**
   * Get user email preferences (for future implementation)
   */
  static async getUserEmailPreferences(userId) {
    try {
      const [monitorUnsub, weeklyUnsub, marketingUnsub] = await Promise.all([
        EmailTrackingService.isUnsubscribed(userId, "monitor_notifications"),
        EmailTrackingService.isUnsubscribed(userId, "weekly_digest"),
        EmailTrackingService.isUnsubscribed(userId, "marketing_emails")
      ]);
      return {
        monitorNotifications: !monitorUnsub,
        weeklyDigest: !weeklyUnsub,
        marketingEmails: !marketingUnsub
      };
    } catch (error) {
      console.error("Failed to get email preferences:", error);
      return {
        monitorNotifications: true,
        weeklyDigest: true,
        marketingEmails: false
      };
    }
  }
  /**
   * Update user email preferences
   */
  static async updateEmailPreferences(userId, preferences) {
    try {
      const actions = [];
      if (preferences.monitorNotifications !== void 0) {
        if (preferences.monitorNotifications) {
        } else {
          actions.push(
            EmailTrackingService.unsubscribe(userId, "monitor_notifications")
          );
        }
      }
      if (preferences.weeklyDigest !== void 0) {
        if (!preferences.weeklyDigest) {
          actions.push(
            EmailTrackingService.unsubscribe(userId, "weekly_digest")
          );
        }
      }
      if (preferences.marketingEmails !== void 0) {
        if (!preferences.marketingEmails) {
          actions.push(
            EmailTrackingService.unsubscribe(userId, "marketing_emails")
          );
        }
      }
      await Promise.all(actions);
      return true;
    } catch (error) {
      console.error("Failed to update email preferences:", error);
      return false;
    }
  }
}
var AIProviderType = /* @__PURE__ */ ((AIProviderType2) => {
  AIProviderType2["CLAUDE"] = "claude";
  AIProviderType2["OPENAI"] = "openai";
  return AIProviderType2;
})(AIProviderType || {});
var AIProviderStatus = /* @__PURE__ */ ((AIProviderStatus2) => {
  AIProviderStatus2["HEALTHY"] = "healthy";
  AIProviderStatus2["WARNING"] = "warning";
  AIProviderStatus2["CRITICAL"] = "critical";
  AIProviderStatus2["OFFLINE"] = "offline";
  return AIProviderStatus2;
})(AIProviderStatus || {});
z.object({
  content: z.string().min(1, "Prompt content cannot be empty"),
  role: z.enum(["system", "user", "assistant"]).default("user"),
  context: z.record(z.any()).optional(),
  maxTokens: z.number().min(1).max(1e4).optional(),
  temperature: z.number().min(0).max(2).optional(),
  metadata: z.record(z.string()).optional()
});
z.object({
  content: z.string(),
  provider: z.nativeEnum(AIProviderType),
  usage: z.object({
    promptTokens: z.number().min(0),
    completionTokens: z.number().min(0),
    totalTokens: z.number().min(0),
    estimatedCost: z.number().min(0).optional()
  }),
  metadata: z.object({
    model: z.string(),
    responseTime: z.number().min(0),
    requestId: z.string().optional(),
    finishReason: z.string().optional()
  }),
  timestamp: z.date().default(() => /* @__PURE__ */ new Date())
});
z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url().optional(),
  maxRetries: z.number().min(0).max(10).default(3),
  timeout: z.number().min(1e3).max(6e4).default(3e4),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).default(60),
    tokensPerMinute: z.number().min(100).optional()
  }).optional(),
  priority: z.number().min(1).max(10).default(5),
  enabled: z.boolean().default(true)
});
z.object({
  provider: z.nativeEnum(AIProviderType),
  status: z.nativeEnum(AIProviderStatus),
  responseTime: z.number().min(0).optional(),
  errorRate: z.number().min(0).max(1).optional(),
  lastChecked: z.date(),
  uptime: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional()
});
function getGlobalAIManager(config) {
  {
    {
      throw new Error("AI Manager not initialized. Provide configuration on first call.");
    }
  }
}
var MonitorType = /* @__PURE__ */ ((MonitorType2) => {
  MonitorType2["STATE"] = "state";
  MonitorType2["CHANGE"] = "change";
  MonitorType2["TREND"] = "trend";
  MonitorType2["THRESHOLD"] = "threshold";
  MonitorType2["SCHEDULE"] = "schedule";
  return MonitorType2;
})(MonitorType || {});
var EntityType = /* @__PURE__ */ ((EntityType2) => {
  EntityType2["STOCK"] = "stock";
  EntityType2["CRYPTOCURRENCY"] = "cryptocurrency";
  EntityType2["WEATHER"] = "weather";
  EntityType2["SPORTS_TEAM"] = "sports_team";
  EntityType2["NEWS_TOPIC"] = "news_topic";
  EntityType2["WEBSITE"] = "website";
  EntityType2["PRICE"] = "price";
  EntityType2["AVAILABILITY"] = "availability";
  EntityType2["STATUS"] = "status";
  EntityType2["METRIC"] = "metric";
  EntityType2["UNKNOWN"] = "unknown";
  return EntityType2;
})(EntityType || {});
var ConditionType = /* @__PURE__ */ ((ConditionType2) => {
  ConditionType2["EQUALS"] = "equals";
  ConditionType2["GREATER_THAN"] = "greater_than";
  ConditionType2["LESS_THAN"] = "less_than";
  ConditionType2["BETWEEN"] = "between";
  ConditionType2["CONTAINS"] = "contains";
  ConditionType2["CHANGES"] = "changes";
  ConditionType2["INCREASES"] = "increases";
  ConditionType2["DECREASES"] = "decreases";
  ConditionType2["MATCHES_REGEX"] = "matches_regex";
  return ConditionType2;
})(ConditionType || {});
var MonitoringFrequency = /* @__PURE__ */ ((MonitoringFrequency2) => {
  MonitoringFrequency2["REAL_TIME"] = "real_time";
  MonitoringFrequency2["FREQUENT"] = "frequent";
  MonitoringFrequency2["REGULAR"] = "regular";
  MonitoringFrequency2["HOURLY"] = "hourly";
  MonitoringFrequency2["DAILY"] = "daily";
  MonitoringFrequency2["WEEKLY"] = "weekly";
  MonitoringFrequency2["CUSTOM"] = "custom";
  return MonitoringFrequency2;
})(MonitoringFrequency || {});
const ExtractedEntitySchema = z.object({
  type: z.nativeEnum(EntityType),
  value: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional()
});
const ExtractedConditionSchema = z.object({
  type: z.nativeEnum(ConditionType),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional()
});
const FrequencyRecommendationSchema = z.object({
  recommended: z.nativeEnum(MonitoringFrequency),
  reasoning: z.string(),
  alternativeOptions: z.array(z.nativeEnum(MonitoringFrequency)).optional(),
  customInterval: z.number().optional(),
  // in minutes
  confidence: z.number().min(0).max(1)
});
const PromptClassificationResultSchema = z.object({
  // Core classification
  monitorType: z.nativeEnum(MonitorType),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  // Extracted entities
  entities: z.array(ExtractedEntitySchema),
  primaryEntity: ExtractedEntitySchema.optional(),
  // Extracted conditions
  conditions: z.array(ExtractedConditionSchema),
  // Frequency recommendation
  frequency: FrequencyRecommendationSchema,
  // Validation and quality
  isValid: z.boolean(),
  validationErrors: z.array(z.string()),
  qualityScore: z.number().min(0).max(1),
  // Improvement suggestions
  suggestions: z.array(z.string()).optional(),
  improvedPrompt: z.string().optional(),
  // Metadata
  processingTime: z.number(),
  timestamp: z.date().default(() => /* @__PURE__ */ new Date())
});
class PromptClassificationService {
  aiManager = getGlobalAIManager();
  /**
   * Classify a user prompt and extract all relevant monitoring parameters
   */
  async classifyPrompt(prompt, options = {}) {
    const startTime = Date.now();
    try {
      const classificationPrompt = this.createClassificationPrompt(prompt);
      const aiResponse = await this.aiManager.generateResponse(
        {
          content: classificationPrompt,
          role: "user",
          maxTokens: 2e3,
          temperature: 0.3,
          context: {
            system: createMonitorSystemPrompt({
              task: "classify",
              instructions: "Provide structured JSON response for prompt classification"
            })
          }
        },
        options.preferredProvider
      );
      const rawResult = this.parseAIResponse(aiResponse.content);
      const processingTime = Date.now() - startTime;
      const result = {
        ...rawResult,
        processingTime,
        timestamp: /* @__PURE__ */ new Date()
      };
      const validatedResult = PromptClassificationResultSchema.parse(result);
      if (options.includeImprovements && validatedResult.qualityScore < 0.8) {
        const improvements = await this.generateImprovements(prompt, validatedResult);
        validatedResult.suggestions = improvements.suggestions;
        validatedResult.improvedPrompt = improvements.improvedPrompt;
      }
      return validatedResult;
    } catch (error) {
      return this.createFallbackResult(prompt, Date.now() - startTime, error);
    }
  }
  /**
   * Batch classify multiple prompts
   */
  async classifyPrompts(prompts, options = {}) {
    const batchSize = 5;
    const results = [];
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchPromises = batch.map((prompt) => this.classifyPrompt(prompt, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    return results;
  }
  /**
   * Create the AI prompt for classification
   */
  createClassificationPrompt(userPrompt) {
    return `Analyze the following user prompt for monitor creation and provide a structured classification:

USER PROMPT: "${userPrompt}"

Please analyze this prompt and return a JSON response with the following structure:
{
  "monitorType": "state|change|trend|threshold|schedule",
  "confidence": 0.95,
  "reasoning": "Explanation of classification decision",
  "entities": [
    {
      "type": "stock|cryptocurrency|weather|sports_team|news_topic|website|price|availability|status|metric|unknown",
      "value": "extracted entity name",
      "confidence": 0.90,
      "metadata": {}
    }
  ],
  "primaryEntity": {
    "type": "stock",
    "value": "TSLA",
    "confidence": 0.95
  },
  "conditions": [
    {
      "type": "greater_than|less_than|equals|between|contains|changes|increases|decreases|matches_regex",
      "value": 200,
      "confidence": 0.85,
      "metadata": {"unit": "USD"}
    }
  ],
  "frequency": {
    "recommended": "frequent|regular|hourly|daily|weekly|real_time|custom",
    "reasoning": "Explanation for frequency choice",
    "alternativeOptions": ["daily", "hourly"],
    "customInterval": 15,
    "confidence": 0.80
  },
  "isValid": true,
  "validationErrors": [],
  "qualityScore": 0.85
}

CLASSIFICATION GUIDELINES:
1. STATE: User wants to know current value ("What is...", "Show me...")
2. CHANGE: User wants notification when something changes ("Tell me when...", "Alert me if...")
3. TREND: User wants to track direction/patterns ("Is ... trending up?", "Track growth of...")
4. THRESHOLD: User specifies specific trigger values ("When price > $100")
5. SCHEDULE: User wants regular reports ("Daily report on...", "Weekly summary")

ENTITY EXTRACTION:
- Look for company names, stock symbols, cryptocurrencies, locations for weather
- Extract sports teams, websites, specific products/services
- Identify metrics being monitored (price, temperature, availability, etc.)

CONDITION PARSING:
- Extract numerical thresholds, comparison operators
- Identify percentage changes, ranges, text patterns
- Look for temporal conditions ("within 24 hours", "by end of week")

FREQUENCY DETERMINATION:
- Financial data: frequent to real_time
- Weather: regular to hourly
- News/status: hourly to daily
- General web content: daily
- Consider urgency indicators in prompt

Provide ONLY the JSON response, no additional text.`;
  }
  /**
   * Parse AI response and extract classification data
   */
  parseAIResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return {
        monitorType: parsed.monitorType || "state",
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || "Classification based on prompt analysis",
        entities: parsed.entities || [],
        primaryEntity: parsed.primaryEntity,
        conditions: parsed.conditions || [],
        frequency: parsed.frequency || {
          recommended: "daily",
          reasoning: "Default daily frequency",
          confidence: 0.5
        },
        isValid: parsed.isValid !== false,
        validationErrors: parsed.validationErrors || [],
        qualityScore: parsed.qualityScore || 0.6
      };
    } catch (error) {
      return {
        monitorType: "state",
        confidence: 0.3,
        reasoning: "Failed to parse AI response, using fallback classification",
        entities: [],
        conditions: [],
        frequency: {
          recommended: "daily",
          reasoning: "Default frequency due to parsing error",
          confidence: 0.3
        },
        isValid: false,
        validationErrors: [`Parsing error: ${error.message}`],
        qualityScore: 0.3
      };
    }
  }
  /**
   * Generate improvement suggestions for low-quality prompts
   */
  async generateImprovements(originalPrompt, classification) {
    try {
      const improvementPrompt = `The user prompt "${originalPrompt}" has been classified with quality score ${classification.qualityScore}.

Please provide:
1. 3-5 specific suggestions to improve the prompt clarity
2. A rewritten version of the prompt that would be clearer and more specific

Current classification issues:
${classification.validationErrors.join(", ")}

Return JSON:
{
  "suggestions": ["Add specific threshold values", "Specify desired frequency"],
  "improvedPrompt": "Tell me when Tesla (TSLA) stock price goes above $200, check every 15 minutes"
}`;
      const aiResponse = await this.aiManager.generateResponse({
        content: improvementPrompt,
        role: "user",
        maxTokens: 500,
        temperature: 0.4,
        context: {
          system: createMonitorSystemPrompt({
            task: "generate",
            instructions: "Provide helpful suggestions for improving monitor prompts"
          })
        }
      });
      const parsed = JSON.parse(aiResponse.content);
      return {
        suggestions: parsed.suggestions || ["Consider adding more specific details"],
        improvedPrompt: parsed.improvedPrompt || originalPrompt
      };
    } catch {
      return {
        suggestions: ["Be more specific about what you want to monitor", "Include threshold values if applicable"],
        improvedPrompt: originalPrompt
      };
    }
  }
  /**
   * Create fallback result when classification fails
   */
  createFallbackResult(prompt, processingTime, error) {
    return {
      monitorType: "state",
      confidence: 0.2,
      reasoning: "Fallback classification due to processing error",
      entities: [],
      conditions: [],
      frequency: {
        recommended: "daily",
        reasoning: "Default daily frequency",
        confidence: 0.2
      },
      isValid: false,
      validationErrors: [`Processing error: ${error.message}`],
      qualityScore: 0.2,
      processingTime,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Validate extracted entities against known patterns
   */
  validateEntities(entities) {
    const errors = [];
    entities.forEach((entity, index) => {
      if (entity.confidence < 0.3) {
        errors.push(`Entity ${index + 1} has very low confidence (${entity.confidence})`);
      }
      if (!entity.value || entity.value.trim().length === 0) {
        errors.push(`Entity ${index + 1} has empty value`);
      }
      if (entity.type === "stock" && entity.value) {
        const stockPattern = /^[A-Z]{1,5}$/;
        if (!stockPattern.test(entity.value) && entity.value.length > 10) {
          errors.push(`Entity "${entity.value}" doesn't match expected stock symbol pattern`);
        }
      }
    });
    return errors;
  }
  /**
   * Validate extracted conditions
   */
  validateConditions(conditions) {
    const errors = [];
    conditions.forEach((condition, index) => {
      if (condition.confidence < 0.3) {
        errors.push(`Condition ${index + 1} has very low confidence`);
      }
      if (condition.value === null || condition.value === void 0) {
        errors.push(`Condition ${index + 1} has no value`);
      }
      if ([
        "greater_than",
        "less_than"
        /* LESS_THAN */
      ].includes(condition.type)) {
        if (typeof condition.value !== "number") {
          errors.push(`Condition ${index + 1}: ${condition.type} requires numeric value`);
        }
      }
    });
    return errors;
  }
}
let _promptClassificationServiceInstance = null;
const getPromptClassificationService = () => {
  if (!_promptClassificationServiceInstance) {
    _promptClassificationServiceInstance = new PromptClassificationService();
  }
  return _promptClassificationServiceInstance;
};
async function classifyPrompt(prompt, options) {
  return getPromptClassificationService().classifyPrompt(prompt, options);
}
var UrgencyLevel = /* @__PURE__ */ ((UrgencyLevel2) => {
  UrgencyLevel2["LOW"] = "low";
  UrgencyLevel2["MEDIUM"] = "medium";
  UrgencyLevel2["HIGH"] = "high";
  UrgencyLevel2["CRITICAL"] = "critical";
  return UrgencyLevel2;
})(UrgencyLevel || {});
var NotificationType = /* @__PURE__ */ ((NotificationType2) => {
  NotificationType2["THRESHOLD_EXCEEDED"] = "threshold_exceeded";
  NotificationType2["THRESHOLD_BELOW"] = "threshold_below";
  NotificationType2["VALUE_CHANGED"] = "value_changed";
  NotificationType2["TREND_DETECTED"] = "trend_detected";
  NotificationType2["STATUS_UPDATE"] = "status_update";
  NotificationType2["ERROR_OCCURRED"] = "error_occurred";
  NotificationType2["SCHEDULED_REPORT"] = "scheduled_report";
  return NotificationType2;
})(NotificationType || {});
var ToneStyle = /* @__PURE__ */ ((ToneStyle2) => {
  ToneStyle2["PROFESSIONAL"] = "professional";
  ToneStyle2["CASUAL"] = "casual";
  ToneStyle2["TECHNICAL"] = "technical";
  ToneStyle2["BRIEF"] = "brief";
  ToneStyle2["ENTHUSIASTIC"] = "enthusiastic";
  return ToneStyle2;
})(ToneStyle || {});
const MonitorDataSchema = z.object({
  monitorId: z.string(),
  monitorName: z.string(),
  currentValue: z.union([z.string(), z.number(), z.boolean()]),
  previousValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  threshold: z.union([z.string(), z.number()]).optional(),
  unit: z.string().optional(),
  source: z.string().optional(),
  timestamp: z.date().default(() => /* @__PURE__ */ new Date()),
  metadata: z.record(z.any()).optional()
});
const UserContextSchema = z.object({
  userId: z.string(),
  userName: z.string().optional(),
  email: z.string().email(),
  timezone: z.string().default("UTC"),
  language: z.string().default("en"),
  preferredTone: z.nativeEnum(ToneStyle).default(
    "professional"
    /* PROFESSIONAL */
  ),
  notificationPreferences: z.object({
    includeHistoricalContext: z.boolean().default(true),
    includeActionRecommendations: z.boolean().default(true),
    maxEmailLength: z.enum(["short", "medium", "long"]).default("medium")
  }).default({})
});
const NotificationContextSchema = z.object({
  notificationType: z.nativeEnum(NotificationType),
  urgencyLevel: z.nativeEnum(UrgencyLevel),
  triggerReason: z.string(),
  monitorData: MonitorDataSchema,
  userContext: UserContextSchema,
  historicalData: z.array(z.object({
    value: z.union([z.string(), z.number(), z.boolean()]),
    timestamp: z.date()
  })).optional(),
  customInstructions: z.string().optional()
});
const GeneratedNotificationSchema = z.object({
  // Email content
  subject: z.string(),
  bodyText: z.string(),
  bodyHtml: z.string().optional(),
  // Metadata
  urgencyLevel: z.nativeEnum(UrgencyLevel),
  estimatedReadTime: z.string(),
  // e.g., "2 min read"
  // Content analysis
  keyPoints: z.array(z.string()),
  actionRecommendations: z.array(z.string()).optional(),
  // Technical details
  templateVariables: z.record(z.any()),
  personalizationUsed: z.array(z.string()),
  // Quality metrics
  confidenceScore: z.number().min(0).max(1),
  readabilityScore: z.string().optional(),
  // e.g., "Grade 8"
  // Metadata
  generationTime: z.number(),
  timestamp: z.date().default(() => /* @__PURE__ */ new Date())
});
class NotificationGenerationService {
  aiManager = getGlobalAIManager();
  /**
   * Generate a complete email notification for a monitor trigger
   */
  async generateNotification(context, options = {}) {
    const startTime = Date.now();
    try {
      const validatedContext = NotificationContextSchema.parse(context);
      const prompt = this.createNotificationPrompt(validatedContext, options.includeHtml);
      const aiResponse = await this.aiManager.generateResponse(
        {
          content: prompt,
          role: "user",
          maxTokens: 1e3,
          temperature: 0.4,
          // Lower temperature for consistent, professional output
          context: {
            system: createMonitorSystemPrompt({
              task: "generate",
              domain: "email_notifications",
              instructions: "Generate professional email notifications with clear explanations and appropriate urgency"
            })
          }
        },
        options.preferredProvider
      );
      const rawResult = this.parseNotificationResponse(aiResponse.content);
      const generationTime = Date.now() - startTime;
      const notification = {
        ...rawResult,
        urgencyLevel: validatedContext.urgencyLevel,
        templateVariables: this.extractTemplateVariables(validatedContext),
        personalizationUsed: this.getPersonalizationFeatures(validatedContext),
        generationTime,
        timestamp: /* @__PURE__ */ new Date()
      };
      return GeneratedNotificationSchema.parse(notification);
    } catch (error) {
      return this.createFallbackNotification(context, Date.now() - startTime, error);
    }
  }
  /**
   * Generate multiple notification variations for A/B testing
   */
  async generateNotificationVariations(context, variations, options = {}) {
    const promises = variations.map(async (variation) => {
      const modifiedContext = {
        ...context,
        userContext: {
          ...context.userContext,
          preferredTone: variation.tone,
          notificationPreferences: {
            ...context.userContext.notificationPreferences,
            maxEmailLength: variation.length
          }
        },
        customInstructions: variation.style
      };
      return this.generateNotification(modifiedContext, options);
    });
    return Promise.all(promises);
  }
  /**
   * Determine urgency level based on monitor data and trigger
   */
  determineUrgencyLevel(monitorData, notificationType, changePercentage) {
    if (notificationType === "error_occurred") {
      return "critical";
    }
    if (changePercentage && Math.abs(changePercentage) > 50) {
      return "critical";
    }
    if (notificationType === "threshold_exceeded" || notificationType === "threshold_below") {
      return "high";
    }
    if (changePercentage && Math.abs(changePercentage) > 20) {
      return "high";
    }
    if (notificationType === "trend_detected" || notificationType === "value_changed") {
      return "medium";
    }
    return "low";
  }
  /**
   * Generate action recommendations based on the trigger
   */
  generateActionRecommendations(context) {
    const { notificationType, monitorData } = context;
    const recommendations = [];
    switch (notificationType) {
      case "threshold_exceeded":
        recommendations.push(`Consider reviewing your ${monitorData.monitorName} threshold settings`);
        recommendations.push("Check if this change aligns with your expectations");
        if (monitorData.source) {
          recommendations.push(`Visit ${monitorData.source} for more details`);
        }
        break;
      case "trend_detected":
        recommendations.push("Monitor this trend over the next few data points");
        recommendations.push("Consider adjusting your monitoring frequency if needed");
        break;
      case "error_occurred":
        recommendations.push("Check your monitor configuration");
        recommendations.push("Verify that the data source is accessible");
        recommendations.push("Contact support if this error persists");
        break;
      case "scheduled_report":
        recommendations.push("Review the data for any unexpected patterns");
        recommendations.push("Update your monitoring settings if needed");
        break;
      default:
        recommendations.push("Review your monitor dashboard for more information");
    }
    return recommendations;
  }
  /**
   * Create the AI prompt for notification generation
   */
  createNotificationPrompt(context, includeHtml = false) {
    const { monitorData, userContext, notificationType, urgencyLevel, triggerReason } = context;
    const toneInstructions = {
      [
        "professional"
        /* PROFESSIONAL */
      ]: "Use formal, business-appropriate language",
      [
        "casual"
        /* CASUAL */
      ]: "Use friendly, conversational tone",
      [
        "technical"
        /* TECHNICAL */
      ]: "Include technical details and precise terminology",
      [
        "brief"
        /* BRIEF */
      ]: "Keep content concise and to the point",
      [
        "enthusiastic"
        /* ENTHUSIASTIC */
      ]: "Use energetic and engaging language"
    };
    const lengthInstructions = {
      "short": "1-2 sentences, essential information only",
      "medium": "2-4 sentences with context and explanation",
      "long": "Comprehensive explanation with background and recommendations"
    };
    return `Generate an email notification for a monitor trigger with the following details:

MONITOR INFORMATION:
- Monitor Name: ${monitorData.monitorName}
- Current Value: ${monitorData.currentValue}${monitorData.unit ? ` ${monitorData.unit}` : ""}
${monitorData.previousValue !== void 0 ? `- Previous Value: ${monitorData.previousValue}${monitorData.unit ? ` ${monitorData.unit}` : ""}` : ""}
${monitorData.threshold !== void 0 ? `- Threshold: ${monitorData.threshold}${monitorData.unit ? ` ${monitorData.unit}` : ""}` : ""}
- Trigger Reason: ${triggerReason}
- Notification Type: ${notificationType}
- Urgency: ${urgencyLevel}

USER PREFERENCES:
- Name: ${userContext.userName || "User"}
- Tone: ${toneInstructions[userContext.preferredTone]}
- Length: ${lengthInstructions[userContext.notificationPreferences.maxEmailLength]}
- Timezone: ${userContext.timezone}

${context.historicalData ? `HISTORICAL CONTEXT:
${context.historicalData.map((d) => `- ${d.timestamp.toISOString()}: ${d.value}`).join("\n")}` : ""}

${context.customInstructions ? `CUSTOM INSTRUCTIONS: ${context.customInstructions}` : ""}

Generate a JSON response with the following structure:
{
  "subject": "Concise email subject line (under 50 characters)",
  "bodyText": "Plain text email body with clear explanation",
  ${includeHtml ? '"bodyHtml": "HTML formatted version of the email body",' : ""}
  "keyPoints": ["Key insight 1", "Key insight 2"],
  ${userContext.notificationPreferences.includeActionRecommendations ? '"actionRecommendations": ["Action 1", "Action 2"],' : ""}
  "estimatedReadTime": "X min read",
  "confidenceScore": 0.95,
  "readabilityScore": "Grade 8"
}

REQUIREMENTS:
- Subject must be attention-grabbing and informative
- Body must explain what happened, why it matters, and what it means
- Use appropriate urgency language for ${urgencyLevel} level notifications
- Include timestamp in user's timezone (${userContext.timezone})
- Make it actionable and clear
${userContext.notificationPreferences.includeHistoricalContext ? "- Include relevant historical context" : ""}
- Maintain ${userContext.preferredTone} tone throughout

Return ONLY the JSON response, no additional text.`;
  }
  /**
   * Parse AI response and extract notification content
   */
  parseNotificationResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject: parsed.subject || "Monitor Alert",
        bodyText: parsed.bodyText || "Your monitor has triggered an alert.",
        bodyHtml: parsed.bodyHtml,
        keyPoints: parsed.keyPoints || [],
        actionRecommendations: parsed.actionRecommendations,
        estimatedReadTime: parsed.estimatedReadTime || "1 min read",
        confidenceScore: parsed.confidenceScore || 0.7,
        readabilityScore: parsed.readabilityScore || "Grade 8"
      };
    } catch (error) {
      return {
        subject: "Monitor Alert - Processing Error",
        bodyText: "Your monitor has triggered an alert, but there was an issue generating the detailed notification.",
        keyPoints: ["Monitor alert triggered"],
        estimatedReadTime: "1 min read",
        confidenceScore: 0.3,
        readabilityScore: "Grade 6"
      };
    }
  }
  /**
   * Extract template variables for email customization
   */
  extractTemplateVariables(context) {
    return {
      monitorName: context.monitorData.monitorName,
      currentValue: context.monitorData.currentValue,
      previousValue: context.monitorData.previousValue,
      threshold: context.monitorData.threshold,
      unit: context.monitorData.unit,
      userName: context.userContext.userName,
      urgency: context.urgencyLevel,
      timestamp: context.monitorData.timestamp.toISOString(),
      timezone: context.userContext.timezone,
      notificationType: context.notificationType,
      triggerReason: context.triggerReason
    };
  }
  /**
   * Get list of personalization features used
   */
  getPersonalizationFeatures(context) {
    const features = [];
    if (context.userContext.userName) {
      features.push("user_name");
    }
    if (context.userContext.timezone !== "UTC") {
      features.push("timezone_localization");
    }
    if (context.userContext.preferredTone !== "professional") {
      features.push("tone_customization");
    }
    if (context.userContext.language !== "en") {
      features.push("language_localization");
    }
    if (context.historicalData && context.historicalData.length > 0) {
      features.push("historical_context");
    }
    if (context.customInstructions) {
      features.push("custom_instructions");
    }
    return features;
  }
  /**
   * Create fallback notification when generation fails
   */
  createFallbackNotification(context, generationTime, error) {
    const { monitorData, userContext, urgencyLevel } = context;
    return {
      subject: `${monitorData.monitorName} Alert`,
      bodyText: `Your monitor "${monitorData.monitorName}" has triggered an alert. Current value: ${monitorData.currentValue}${monitorData.unit ? ` ${monitorData.unit}` : ""}. Please check your dashboard for more details.`,
      urgencyLevel,
      estimatedReadTime: "1 min read",
      keyPoints: [`${monitorData.monitorName} alert triggered`],
      templateVariables: this.extractTemplateVariables(context),
      personalizationUsed: [],
      confidenceScore: 0.2,
      generationTime,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Validate notification content for quality and appropriateness
   */
  validateNotificationContent(notification) {
    const issues = [];
    const suggestions = [];
    if (notification.subject.length > 60) {
      issues.push("Subject line too long (over 60 characters)");
    }
    if (notification.subject.length < 10) {
      issues.push("Subject line too short (under 10 characters)");
    }
    if (notification.bodyText.length < 50) {
      issues.push("Email body too short (under 50 characters)");
    }
    if (notification.bodyText.length > 2e3) {
      suggestions.push("Consider shortening email body for better readability");
    }
    if (notification.confidenceScore < 0.5) {
      issues.push("Low confidence score - content quality may be poor");
    }
    if (notification.keyPoints.length === 0) {
      suggestions.push("Add key points to improve content structure");
    }
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}
let _notificationGenerationServiceInstance = null;
const getNotificationGenerationService = () => {
  if (!_notificationGenerationServiceInstance) {
    _notificationGenerationServiceInstance = new NotificationGenerationService();
  }
  return _notificationGenerationServiceInstance;
};
async function generateNotification(context, options) {
  return getNotificationGenerationService().generateNotification(context, options);
}
var ContentType = /* @__PURE__ */ ((ContentType2) => {
  ContentType2["TEXT"] = "text";
  ContentType2["HTML"] = "html";
  ContentType2["JSON_LD"] = "json-ld";
  ContentType2["MICRODATA"] = "microdata";
  ContentType2["TABLE"] = "table";
  ContentType2["LIST"] = "list";
  ContentType2["IMAGE_OCR"] = "image-ocr";
  ContentType2["PDF"] = "pdf";
  return ContentType2;
})(ContentType || {});
var FactType = /* @__PURE__ */ ((FactType2) => {
  FactType2["NUMERICAL"] = "numerical";
  FactType2["TEMPORAL"] = "temporal";
  FactType2["TEXT"] = "text";
  FactType2["BOOLEAN"] = "boolean";
  FactType2["URL"] = "url";
  FactType2["STRUCTURED"] = "structured";
  return FactType2;
})(FactType || {});
const FactExtractionInputSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  contentType: z.nativeEnum(ContentType),
  sourceUrl: z.string().url().optional(),
  expectedFacts: z.array(z.string()).optional(),
  extractionHints: z.object({
    target: z.string().optional(),
    selector: z.string().optional(),
    pattern: z.string().optional(),
    unit: z.string().optional()
  }).optional(),
  qualityThreshold: z.number().min(0).max(1).default(0.7)
});
const BatchExtractionInputSchema = z.object({
  extractions: z.array(FactExtractionInputSchema).min(1).max(10),
  correlate: z.boolean().default(false),
  timeout: z.number().min(1e3).max(3e4).default(1e4)
});
class ContentAnalyzer {
  static analyzeContent(content, contentType) {
    const size = content.length;
    let structure = "unstructured";
    if (contentType === "json-ld" || contentType === "table") {
      structure = "structured";
    } else if (contentType === "html" || contentType === "microdata") {
      structure = "semi-structured";
    }
    const language = this.detectLanguage(content);
    return {
      contentType,
      size,
      structure,
      language,
      encoding: "utf-8"
    };
  }
  static detectLanguage(content) {
    const englishWords = ["the", "and", "is", "in", "to", "of", "a", "that", "it", "with"];
    const words = content.toLowerCase().split(/\s+/).slice(0, 100);
    const englishWordCount = words.filter((word) => englishWords.includes(word)).length;
    return englishWordCount > words.length * 0.1 ? "en" : "unknown";
  }
}
class FactValidator {
  static validateFact(fact) {
    const issues = [];
    let qualityScore = 1;
    if (!fact.value) {
      issues.push("Missing fact value");
      qualityScore -= 0.5;
    }
    if (!fact.confidence || fact.confidence < 0 || fact.confidence > 1) {
      issues.push("Invalid confidence score");
      qualityScore -= 0.3;
    }
    if (fact.type === "numerical") {
      if (typeof fact.value !== "number" && isNaN(Number(fact.value))) {
        issues.push("Numerical fact value is not a valid number");
        qualityScore -= 0.4;
      }
    }
    if (fact.type === "temporal") {
      const date = new Date(fact.value);
      if (isNaN(date.getTime())) {
        issues.push("Temporal fact value is not a valid date");
        qualityScore -= 0.4;
      }
    }
    if (fact.type === "url") {
      try {
        new URL(fact.value);
      } catch {
        issues.push("URL fact value is not a valid URL");
        qualityScore -= 0.4;
      }
    }
    if (fact.confidence && fact.confidence < 0.5) {
      qualityScore -= 0.5 - fact.confidence;
    }
    return {
      isValid: issues.length === 0,
      issues,
      qualityScore: Math.max(0, qualityScore)
    };
  }
}
class FactExtractionService {
  aiManager;
  constructor(aiManager) {
    this.aiManager = aiManager || getGlobalAIManager();
  }
  /**
   * Extract facts from single content source
   */
  async extractFacts(input) {
    const startTime = Date.now();
    try {
      const validatedInput = FactExtractionInputSchema.parse(input);
      const contentAnalysis = ContentAnalyzer.analyzeContent(
        validatedInput.content,
        validatedInput.contentType
      );
      const extractionPrompt = this.createExtractionPrompt(validatedInput, contentAnalysis);
      const aiResponse = await this.aiManager.generateResponse({
        content: extractionPrompt,
        role: "user",
        maxTokens: 2e3,
        temperature: 0.1,
        context: {
          system: createMonitorSystemPrompt({
            task: "extract",
            domain: "fact-extraction",
            instructions: "Extract factual information with high precision and confidence scoring"
          })
        }
      });
      if (!aiResponse.success) {
        throw new Error(`AI extraction failed: ${aiResponse.error}`);
      }
      const extractedFacts = this.parseAIResponse(aiResponse.content, validatedInput);
      const validatedFacts = extractedFacts.map((fact) => {
        const validation = FactValidator.validateFact(fact);
        return {
          ...fact,
          validation
        };
      });
      const qualityFacts = validatedFacts.filter(
        (fact) => fact.validation.qualityScore >= validatedInput.qualityThreshold
      );
      const qualitySummary = this.generateQualitySummary(validatedFacts);
      const processingTime = Date.now() - startTime;
      return {
        success: true,
        facts: qualityFacts,
        processingTime,
        contentAnalysis,
        qualitySummary
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        facts: [],
        processingTime,
        contentAnalysis: ContentAnalyzer.analyzeContent(input.content, input.contentType),
        qualitySummary: {
          overallScore: 0,
          highConfidenceFacts: 0,
          validationIssues: 0,
          recommendedActions: ["Fix extraction error and retry"]
        },
        error: error instanceof Error ? error.message : "Unknown extraction error"
      };
    }
  }
  /**
   * Extract facts from multiple sources with optional correlation
   */
  async extractFactsBatch(input) {
    const startTime = Date.now();
    try {
      const validatedInput = BatchExtractionInputSchema.parse(input);
      const extractionPromises = validatedInput.extractions.map(
        (extraction, index) => Promise.race([
          this.extractFacts(extraction),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error(`Extraction ${index} timed out`)), validatedInput.timeout)
          )
        ]).catch((error) => ({
          success: false,
          facts: [],
          processingTime: validatedInput.timeout,
          contentAnalysis: ContentAnalyzer.analyzeContent(extraction.content, extraction.contentType),
          qualitySummary: {
            overallScore: 0,
            highConfidenceFacts: 0,
            validationIssues: 1,
            recommendedActions: ["Retry with longer timeout"]
          },
          error: error.message
        }))
      );
      const results = await Promise.all(extractionPromises);
      let correlations = [];
      if (validatedInput.correlate) {
        correlations = await this.findFactCorrelations(results);
      }
      const processingTime = Date.now() - startTime;
      return {
        success: results.some((r) => r.success),
        results,
        correlations,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        results: [],
        correlations: [],
        processingTime,
        error: error instanceof Error ? error.message : "Unknown batch extraction error"
      };
    }
  }
  /**
   * Create AI prompt for fact extraction
   */
  createExtractionPrompt(input, analysis) {
    let prompt = `Extract factual information from the following ${input.contentType} content:

`;
    prompt += `Content (${analysis.size} characters):
${input.content.substring(0, 2e3)}`;
    if (input.content.length > 2e3) {
      prompt += "\n... (truncated)";
    }
    prompt += "\n\n";
    if (input.expectedFacts?.length) {
      prompt += `Expected fact types: ${input.expectedFacts.join(", ")}

`;
    }
    if (input.extractionHints) {
      prompt += "Extraction hints:\n";
      Object.entries(input.extractionHints).forEach(([key, value]) => {
        if (value) prompt += `- ${key}: ${value}
`;
      });
      prompt += "\n";
    }
    prompt += `Please extract facts and return them as a JSON array with this structure:
[
  {
    "id": "unique-fact-id",
    "type": "numerical|temporal|text|boolean|url|structured",
    "value": "extracted-value",
    "confidence": 0.95,
    "location": "content-location-or-selector",
    "unit": "optional-unit",
    "context": "surrounding-context"
  }
]

Rules:
1. Only extract verifiable, factual information
2. Assign confidence scores (0-1) based on clarity and certainty
3. Include location/selector information where possible
4. For numerical values, include units when identifiable
5. Provide brief context for ambiguous facts
6. Return empty array if no reliable facts found`;
    return prompt;
  }
  /**
   * Parse AI response into structured facts
   */
  parseAIResponse(response, input) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in AI response");
      }
      const parsedFacts = JSON.parse(jsonMatch[0]);
      return parsedFacts.map((fact, index) => ({
        id: fact.id || `fact-${Date.now()}-${index}`,
        type: this.mapFactType(fact.type),
        value: fact.value,
        confidence: Math.min(1, Math.max(0, fact.confidence || 0.5)),
        source: {
          contentType: input.contentType,
          location: fact.location || "unknown",
          selector: fact.selector,
          timestamp: /* @__PURE__ */ new Date()
        },
        metadata: {
          unit: fact.unit,
          format: typeof fact.value,
          context: fact.context
        }
      }));
    } catch (error) {
      console.warn("Failed to parse AI fact extraction response:", error);
      return [];
    }
  }
  mapFactType(type) {
    switch (type?.toLowerCase()) {
      case "numerical":
      case "number":
        return "numerical";
      case "temporal":
      case "date":
      case "time":
        return "temporal";
      case "boolean":
      case "bool":
        return "boolean";
      case "url":
      case "link":
        return "url";
      case "structured":
      case "object":
        return "structured";
      default:
        return "text";
    }
  }
  /**
   * Generate quality summary for extraction results
   */
  generateQualitySummary(facts) {
    if (facts.length === 0) {
      return {
        overallScore: 0,
        highConfidenceFacts: 0,
        validationIssues: 0,
        recommendedActions: ["No facts extracted - review content and extraction parameters"]
      };
    }
    const avgQuality = facts.reduce((sum, fact) => sum + fact.validation.qualityScore, 0) / facts.length;
    const highConfidenceFacts = facts.filter((f) => f.confidence >= 0.8).length;
    const validationIssues = facts.reduce((sum, fact) => sum + fact.validation.issues.length, 0);
    const recommendedActions = [];
    if (avgQuality < 0.6) {
      recommendedActions.push("Consider adjusting quality threshold or improving content quality");
    }
    if (highConfidenceFacts / facts.length < 0.5) {
      recommendedActions.push("Many facts have low confidence - verify extraction parameters");
    }
    if (validationIssues > facts.length * 0.3) {
      recommendedActions.push("High validation issues - review fact extraction logic");
    }
    if (recommendedActions.length === 0) {
      recommendedActions.push("Extraction quality is good");
    }
    return {
      overallScore: Math.round(avgQuality * 100) / 100,
      highConfidenceFacts,
      validationIssues,
      recommendedActions
    };
  }
  /**
   * Find correlations between facts from multiple sources
   */
  async findFactCorrelations(results) {
    const correlations = [];
    const allFacts = results.flatMap((r) => r.facts);
    const numericalFacts = allFacts.filter(
      (f) => f.type === "numerical"
      /* NUMERICAL */
    );
    for (let i = 0; i < numericalFacts.length; i++) {
      for (let j = i + 1; j < numericalFacts.length; j++) {
        const fact1 = numericalFacts[i];
        const fact2 = numericalFacts[j];
        const val1 = Number(fact1.value);
        const val2 = Number(fact2.value);
        if (Math.abs(val1 - val2) / Math.max(val1, val2) < 0.1) {
          correlations.push({
            facts: [fact1.id, fact2.id],
            relationship: "similar_values",
            confidence: 0.8
          });
        }
      }
    }
    return correlations;
  }
}
async function extractFacts(input) {
  const service = new FactExtractionService();
  return await service.extractFacts(input);
}
const ScrapingEnhancementInputSchema = z.object({
  rawContent: z.string().min(1, "Raw content cannot be empty"),
  sourceUrl: z.string().url(),
  contentType: z.string().default("text/html"),
  scrapingTimestamp: z.date().default(() => /* @__PURE__ */ new Date()),
  targetInformation: z.string().optional(),
  context: z.object({
    expectedDataTypes: z.array(z.nativeEnum(FactType)).optional(),
    relevanceHints: z.array(z.string()).optional(),
    noisePatterns: z.array(z.string()).optional(),
    prioritySelectors: z.array(z.string()).optional()
  }).optional(),
  enhancementOptions: z.object({
    removeNoise: z.boolean().default(true),
    normalizeData: z.boolean().default(true),
    extractTemporal: z.boolean().default(true),
    summarizeContent: z.boolean().default(false),
    detectDuplicates: z.boolean().default(true)
  }).default({})
});
const BatchEnhancementInputSchema = z.object({
  scrapings: z.array(ScrapingEnhancementInputSchema).min(1).max(5),
  correlateAcrossSources: z.boolean().default(true),
  deduplicationStrategy: z.enum(["strict", "fuzzy", "none"]).default("fuzzy"),
  outputFormat: z.enum(["enhanced", "facts_only", "summary"]).default("enhanced")
});
class ContentCleaner {
  static NOISE_PATTERNS = {
    advertisements: [
      /ad(?:vertisement)?[\s\-_]*(?:banner|block|space)/gi,
      /google[\s\-_]*ads?/gi,
      /sponsored[\s\-_]*content/gi,
      /\bads?\b.*\b(?:by|from)\b/gi
    ],
    navigation: [
      /(?:nav|menu|breadcrumb|sidebar)[\s\-_]*(?:item|link|bar)?/gi,
      /(?:home|about|contact|privacy|terms)[\s\-_]*(?:page|link)?/gi,
      /(?:skip|jump)[\s\-_]*to[\s\-_]*(?:content|navigation|main)/gi
    ],
    boilerplate: [
      /copyright[\s\S]*?(?:\d{4}|\ball\s+rights\s+reserved)/gi,
      /powered[\s\-_]*by[\s\S]*?(?:\.|<)/gi,
      /(?:terms|privacy)[\s\-_]*(?:of[\s\-_]*(?:use|service)|policy)/gi
    ],
    social: [
      /(?:share|like|tweet|follow)[\s\-_]*(?:us|this|on)?/gi,
      /(?:facebook|twitter|instagram|linkedin|youtube)/gi,
      /\d+[\s\-_]*(?:likes?|shares?|comments?|views?)/gi
    ]
  };
  static classifyContent(content, selector) {
    const id = `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const wordCount = content.trim().split(/\s+/).length;
    const containsNumbers = /\d/.test(content);
    const containsDates = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/.test(content);
    const noiseClassification = this.detectNoise(content);
    const relevance = this.scoreRelevance(content, noiseClassification.isNoise);
    const confidence = this.calculateConfidence(content, relevance, noiseClassification.removalConfidence);
    return {
      id,
      content,
      relevance,
      confidence,
      position: {
        selector,
        textPosition: 0
        // Would be calculated based on original position
      },
      metadata: {
        wordCount,
        containsNumbers,
        containsDates,
        language: this.detectLanguage(content)
      },
      noiseClassification
    };
  }
  static detectNoise(content) {
    const noiseTypes = [];
    let noiseScore = 0;
    Object.entries(this.NOISE_PATTERNS).forEach(([type, patterns]) => {
      const matchCount = patterns.reduce((count, pattern) => {
        return count + (content.match(pattern) || []).length;
      }, 0);
      if (matchCount > 0) {
        noiseTypes.push(type);
        noiseScore += matchCount * 0.2;
      }
    });
    if (content.length < 10) {
      noiseTypes.push(
        "boilerplate"
        /* BOILERPLATE */
      );
      noiseScore += 0.3;
    }
    if (content.split(/\s+/).filter((word) => word.length > 2).length < 3) {
      noiseTypes.push(
        "boilerplate"
        /* BOILERPLATE */
      );
      noiseScore += 0.2;
    }
    const isNoise = noiseScore > 0.5;
    const removalConfidence = Math.min(noiseScore, 1);
    return { isNoise, noiseTypes, removalConfidence };
  }
  static scoreRelevance(content, isNoise) {
    if (isNoise) return "noise";
    let relevanceScore = 0.5;
    if (/\$?\d+(?:\.\d+)?%?/.test(content)) relevanceScore += 0.2;
    if (/\b(?:today|yesterday|tomorrow|\d+\s+(?:days?|weeks?|months?|years?)\s+ago)\b/i.test(content)) {
      relevanceScore += 0.15;
    }
    if (content.includes(":") && content.split(":").length > 1) relevanceScore += 0.1;
    if (content.length < 20) relevanceScore -= 0.2;
    if (relevanceScore >= 0.8) return "highly_relevant";
    if (relevanceScore >= 0.6) return "moderately_relevant";
    return "low_relevance";
  }
  static calculateConfidence(content, relevance, noiseConfidence) {
    let confidence = 0.5;
    switch (relevance) {
      case "highly_relevant":
        confidence = 0.9;
        break;
      case "moderately_relevant":
        confidence = 0.7;
        break;
      case "low_relevance":
        confidence = 0.4;
        break;
      case "noise":
        confidence = 1 - noiseConfidence;
        break;
    }
    if (content.length > 50 && content.split(/\s+/).length > 5) {
      confidence += 0.1;
    }
    return Math.min(Math.max(confidence, 0), 1);
  }
  static detectLanguage(content) {
    const englishWords = ["the", "and", "is", "in", "to", "of", "a", "that", "it", "with", "for", "as", "was", "on", "are"];
    const words = content.toLowerCase().split(/\s+/).slice(0, 50);
    const englishWordCount = words.filter((word) => englishWords.includes(word)).length;
    return englishWordCount > words.length * 0.1 ? "en" : "unknown";
  }
}
class DataNormalizer {
  static normalizeValue(value, type) {
    const id = `norm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      switch (type) {
        case "currency":
          return this.normalizeCurrency(id, value);
        case "percentage":
          return this.normalizePercentage(id, value);
        case "date_time":
          return this.normalizeDateTime(id, value);
        case "measurement":
          return this.normalizeMeasurement(id, value);
        case "numbers":
          return this.normalizeNumber(id, value);
        default:
          return this.normalizeText(id, value);
      }
    } catch (error) {
      return {
        id,
        originalValue: value,
        normalizedValue: value,
        normalizationType: type,
        confidence: 0,
        metadata: {}
      };
    }
  }
  static normalizeCurrency(id, value) {
    const currencyRegex = /([£$€¥])?([\d,]+\.?\d*)\s*([A-Z]{3})?/i;
    const match = value.match(currencyRegex);
    if (!match) throw new Error("No currency pattern found");
    const symbol = match[1];
    const amount = parseFloat(match[2].replace(/,/g, ""));
    const code = match[3];
    let currency = "USD";
    if (symbol === "£") currency = "GBP";
    if (symbol === "€") currency = "EUR";
    if (symbol === "¥") currency = "JPY";
    if (code) currency = code.toUpperCase();
    return {
      id,
      originalValue: value,
      normalizedValue: amount,
      normalizationType: "currency",
      confidence: match ? 0.9 : 0.5,
      unit: currency,
      metadata: {
        currency,
        precision: amount % 1 === 0 ? 0 : 2
      }
    };
  }
  static normalizePercentage(id, value) {
    const percentRegex = /([\d.,]+)\s*%/;
    const match = value.match(percentRegex);
    if (!match) throw new Error("No percentage pattern found");
    const percent = parseFloat(match[1].replace(/,/g, ""));
    return {
      id,
      originalValue: value,
      normalizedValue: percent / 100,
      normalizationType: "percentage",
      confidence: 0.95,
      unit: "percent",
      metadata: {
        precision: 4
      }
    };
  }
  static normalizeDateTime(id, value) {
    const dateFormats = [
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{2})\/(\d{2})\/(\d{4})/,
      /(\d{2})-(\d{2})-(\d{4})/
    ];
    let normalizedDate = null;
    let confidence = 0;
    for (const format of dateFormats) {
      const match = value.match(format);
      if (match) {
        normalizedDate = new Date(value);
        if (!isNaN(normalizedDate.getTime())) {
          confidence = 0.9;
          break;
        }
      }
    }
    if (!normalizedDate) {
      normalizedDate = new Date(value);
      confidence = isNaN(normalizedDate.getTime()) ? 0 : 0.7;
    }
    return {
      id,
      originalValue: value,
      normalizedValue: normalizedDate.toISOString(),
      normalizationType: "date_time",
      confidence,
      metadata: {
        timezone: "UTC"
      }
    };
  }
  static normalizeMeasurement(id, value) {
    const measurementRegex = /([\d.,]+)\s*([a-zA-Z]+)/;
    const match = value.match(measurementRegex);
    if (!match) throw new Error("No measurement pattern found");
    const amount = parseFloat(match[1].replace(/,/g, ""));
    const unit = match[2].toLowerCase();
    return {
      id,
      originalValue: value,
      normalizedValue: amount,
      normalizationType: "measurement",
      confidence: 0.85,
      unit,
      metadata: {
        conversionApplied: "none"
      }
    };
  }
  static normalizeNumber(id, value) {
    const numberRegex = /[\d.,]+/;
    const match = value.match(numberRegex);
    if (!match) throw new Error("No number pattern found");
    const number = parseFloat(match[0].replace(/,/g, ""));
    return {
      id,
      originalValue: value,
      normalizedValue: number,
      normalizationType: "numbers",
      confidence: 0.8,
      metadata: {
        precision: number % 1 === 0 ? 0 : 2
      }
    };
  }
  static normalizeText(id, value) {
    return {
      id,
      originalValue: value,
      normalizedValue: value.trim(),
      normalizationType: "text",
      confidence: 1,
      metadata: {}
    };
  }
}
class TemporalExtractor {
  static extractTemporalData(content) {
    const temporalExpressions = [
      // Absolute dates
      {
        pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
        precision: "day",
        parse: (match) => /* @__PURE__ */ new Date(`${match[1]}-${match[2]}-${match[3]}`)
      },
      // Relative dates
      {
        pattern: /\b(\d+)\s+(days?|weeks?|months?|years?)\s+ago\b/gi,
        precision: "day",
        parse: (match) => {
          const amount = parseInt(match[1]);
          const unit = match[2].toLowerCase().replace(/s$/, "");
          const date = /* @__PURE__ */ new Date();
          switch (unit) {
            case "day":
              date.setDate(date.getDate() - amount);
              break;
            case "week":
              date.setDate(date.getDate() - amount * 7);
              break;
            case "month":
              date.setMonth(date.getMonth() - amount);
              break;
            case "year":
              date.setFullYear(date.getFullYear() - amount);
              break;
          }
          return date;
        }
      },
      // Context words
      {
        pattern: /\b(today|yesterday|tomorrow)\b/gi,
        precision: "day",
        parse: (match) => {
          const date = /* @__PURE__ */ new Date();
          switch (match[1].toLowerCase()) {
            case "yesterday":
              date.setDate(date.getDate() - 1);
              break;
            case "tomorrow":
              date.setDate(date.getDate() + 1);
              break;
          }
          return date;
        }
      }
    ];
    const results = [];
    temporalExpressions.forEach((expr) => {
      let match;
      while ((match = expr.pattern.exec(content)) !== null) {
        try {
          const extractedDate = expr.parse(match);
          if (!isNaN(extractedDate.getTime())) {
            results.push({
              id: `temporal-${Date.now()}-${results.length}`,
              extractedDate,
              originalText: match[0],
              confidence: 0.8,
              precision: expr.precision,
              relative: {
                isRelative: expr.pattern.source.includes("ago") || ["today", "yesterday", "tomorrow"].includes(match[1]?.toLowerCase()),
                referencePoint: /* @__PURE__ */ new Date(),
                description: match[0]
              }
            });
          }
        } catch (error) {
        }
      }
    });
    return results;
  }
}
class WebScrapingEnhancementService {
  aiManager;
  factExtractor;
  constructor(aiManager) {
    this.aiManager = aiManager || getGlobalAIManager();
    this.factExtractor = new FactExtractionService(this.aiManager);
  }
  /**
   * Enhance single web scraping result
   */
  async enhanceScrapingData(input) {
    const startTime = Date.now();
    try {
      const validatedInput = ScrapingEnhancementInputSchema.parse(input);
      const segments = await this.segmentContent(validatedInput.rawContent);
      const cleanedSegments = validatedInput.enhancementOptions.removeNoise ? segments.filter(
        (segment) => segment.relevance !== "noise"
        /* NOISE */
      ) : segments;
      let normalizedData = [];
      if (validatedInput.enhancementOptions.normalizeData) {
        normalizedData = await this.normalizeContent(cleanedSegments);
      }
      let temporalData = [];
      if (validatedInput.enhancementOptions.extractTemporal) {
        temporalData = this.extractTemporal(validatedInput.rawContent);
      }
      const cleanedContent = cleanedSegments.filter(
        (s) => s.relevance !== "noise"
        /* NOISE */
      ).map((s) => s.content).join("\n");
      let extractedFacts = [];
      if (cleanedContent.length > 10) {
        const factExtractionResult = await this.factExtractor.extractFacts({
          content: cleanedContent,
          contentType: ContentType.HTML,
          sourceUrl: validatedInput.sourceUrl,
          expectedFacts: validatedInput.context?.expectedDataTypes?.map((type) => type.toString()),
          qualityThreshold: 0.6
        });
        extractedFacts = factExtractionResult.facts;
      }
      let contentSummary;
      if (validatedInput.enhancementOptions.summarizeContent) {
        contentSummary = await this.generateContentSummary(cleanedContent, validatedInput.targetInformation);
      }
      const qualityMetrics = this.calculateQualityMetrics(
        segments,
        normalizedData,
        temporalData,
        extractedFacts
      );
      const processingTime = Date.now() - startTime;
      return {
        success: true,
        sourceUrl: validatedInput.sourceUrl,
        processingTime,
        enhancement: {
          originalSize: validatedInput.rawContent.length,
          cleanedSize: cleanedContent.length,
          noiseRemoved: segments.length - cleanedSegments.length,
          relevantSegments: cleanedSegments.filter(
            (s) => s.relevance === "highly_relevant" || s.relevance === "moderately_relevant"
            /* MODERATELY_RELEVANT */
          ).length
        },
        contentSegments: cleanedSegments,
        normalizedData,
        temporalData,
        extractedFacts,
        contentSummary,
        qualityMetrics
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        sourceUrl: input.sourceUrl || "unknown",
        processingTime,
        enhancement: {
          originalSize: input.rawContent.length,
          cleanedSize: 0,
          noiseRemoved: 0,
          relevantSegments: 0
        },
        contentSegments: [],
        normalizedData: [],
        temporalData: [],
        extractedFacts: [],
        qualityMetrics: {
          overallRelevance: 0,
          dataCompleteness: 0,
          temporalAccuracy: 0,
          normalizationSuccess: 0
        },
        error: error instanceof Error ? error.message : "Unknown enhancement error"
      };
    }
  }
  /**
   * Enhance multiple scraping results with cross-source analysis
   */
  async enhanceBatch(input) {
    const startTime = Date.now();
    try {
      const validatedInput = BatchEnhancementInputSchema.parse(input);
      const results = await Promise.all(
        validatedInput.scrapings.map((scraping) => this.enhanceScrapingData(scraping))
      );
      const crossSourceAnalysis = await this.performCrossSourceAnalysis(
        results,
        validatedInput.deduplicationStrategy
      );
      const aggregatedMetrics = this.calculateAggregatedMetrics(results);
      const processingTime = Date.now() - startTime;
      return {
        success: results.some((r) => r.success),
        results,
        crossSourceAnalysis,
        aggregatedMetrics,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        results: [],
        crossSourceAnalysis: {
          duplicatesFound: 0,
          correlations: [],
          inconsistencies: []
        },
        aggregatedMetrics: {
          totalNoiseRemoved: 0,
          avgRelevanceScore: 0,
          uniqueFactsExtracted: 0,
          temporalCoverage: {}
        },
        processingTime,
        error: error instanceof Error ? error.message : "Unknown batch enhancement error"
      };
    }
  }
  async segmentContent(content) {
    const segments = content.split(/\n\s*\n|\. {2,}|<\/p>|<\/div>|<br\s*\/?>/).filter((segment) => segment.trim().length > 5).map((segment) => ContentCleaner.classifyContent(segment.trim()));
    return segments;
  }
  async normalizeContent(segments) {
    const normalizedData = [];
    for (const segment of segments) {
      if (segment.metadata.containsNumbers) {
        if (/[\$£€¥]/.test(segment.content)) {
          try {
            const normalized = DataNormalizer.normalizeValue(
              segment.content,
              "currency"
              /* CURRENCY */
            );
            normalizedData.push(normalized);
          } catch (error) {
          }
        }
        if (/%/.test(segment.content)) {
          try {
            const normalized = DataNormalizer.normalizeValue(
              segment.content,
              "percentage"
              /* PERCENTAGE */
            );
            normalizedData.push(normalized);
          } catch (error) {
          }
        }
        try {
          const normalized = DataNormalizer.normalizeValue(
            segment.content,
            "numbers"
            /* NUMBERS */
          );
          normalizedData.push(normalized);
        } catch (error) {
        }
      }
      if (segment.metadata.containsDates) {
        try {
          const normalized = DataNormalizer.normalizeValue(
            segment.content,
            "date_time"
            /* DATE_TIME */
          );
          normalizedData.push(normalized);
        } catch (error) {
        }
      }
    }
    return normalizedData;
  }
  extractTemporal(content) {
    return TemporalExtractor.extractTemporalData(content);
  }
  async generateContentSummary(content, targetInformation) {
    try {
      const summaryPrompt = this.createSummaryPrompt(content, targetInformation);
      const aiResponse = await this.aiManager.generateResponse({
        content: summaryPrompt,
        role: "user",
        maxTokens: 500,
        temperature: 0.2,
        context: {
          system: createMonitorSystemPrompt({
            task: "analyze",
            domain: "content-summarization",
            instructions: "Provide concise content summary with key topics and findings"
          })
        }
      });
      if (!aiResponse.success) {
        throw new Error(`AI summary failed: ${aiResponse.error}`);
      }
      const parsed = JSON.parse(aiResponse.content);
      return {
        mainTopics: parsed.topics || [],
        keyFindings: parsed.findings || [],
        confidenceScore: parsed.confidence || 0.5
      };
    } catch (error) {
      return {
        mainTopics: ["Content analysis unavailable"],
        keyFindings: ["Unable to generate summary"],
        confidenceScore: 0
      };
    }
  }
  createSummaryPrompt(content, targetInformation) {
    let prompt = `Analyze and summarize the following web content:

${content.substring(0, 1500)}`;
    if (targetInformation) {
      prompt += `

Focus specifically on: ${targetInformation}`;
    }
    prompt += `

Return a JSON object with:
{
  "topics": ["main topic 1", "main topic 2", ...],
  "findings": ["key finding 1", "key finding 2", ...],
  "confidence": 0.8
}

Focus on factual information, numerical data, and actionable insights.`;
    return prompt;
  }
  calculateQualityMetrics(segments, normalizedData, temporalData, extractedFacts) {
    const totalSegments = segments.length;
    const relevantSegments = segments.filter(
      (s) => s.relevance === "highly_relevant" || s.relevance === "moderately_relevant"
      /* MODERATELY_RELEVANT */
    ).length;
    const overallRelevance = totalSegments > 0 ? relevantSegments / totalSegments : 0;
    const expectedDataPoints = segments.filter(
      (s) => s.metadata.containsNumbers || s.metadata.containsDates
    ).length;
    const extractedDataPoints = normalizedData.length + temporalData.length + extractedFacts.length;
    const dataCompleteness = expectedDataPoints > 0 ? Math.min(extractedDataPoints / expectedDataPoints, 1) : 0;
    const temporalAccuracy = temporalData.length > 0 ? temporalData.reduce((sum, t) => sum + t.confidence, 0) / temporalData.length : 0;
    const normalizationSuccess = normalizedData.length > 0 ? normalizedData.reduce((sum, n) => sum + n.confidence, 0) / normalizedData.length : 0;
    return {
      overallRelevance: Math.round(overallRelevance * 100) / 100,
      dataCompleteness: Math.round(dataCompleteness * 100) / 100,
      temporalAccuracy: Math.round(temporalAccuracy * 100) / 100,
      normalizationSuccess: Math.round(normalizationSuccess * 100) / 100
    };
  }
  async performCrossSourceAnalysis(results, deduplicationStrategy) {
    if (deduplicationStrategy === "none") {
      return {
        duplicatesFound: 0,
        correlations: [],
        inconsistencies: []
      };
    }
    const correlations = [];
    const inconsistencies = [];
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const result1 = results[i];
        const result2 = results[j];
        const similarity = this.calculateFactSimilarity(
          result1.extractedFacts,
          result2.extractedFacts
        );
        if (similarity > 0.7) {
          correlations.push({
            sources: [result1.sourceUrl, result2.sourceUrl],
            similarity: Math.round(similarity * 100) / 100,
            matchType: similarity > 0.95 ? "exact" : "fuzzy"
          });
        }
        const conflicts = this.detectDataConflicts(result1, result2);
        inconsistencies.push(...conflicts);
      }
    }
    return {
      duplicatesFound: correlations.filter((c) => c.similarity > 0.9).length,
      correlations,
      inconsistencies
    };
  }
  calculateFactSimilarity(facts1, facts2) {
    if (facts1.length === 0 && facts2.length === 0) return 1;
    if (facts1.length === 0 || facts2.length === 0) return 0;
    let matchingFacts = 0;
    const totalFacts = Math.max(facts1.length, facts2.length);
    for (const fact1 of facts1) {
      for (const fact2 of facts2) {
        if (fact1.type === fact2.type && this.valuesAreSimilar(fact1.value, fact2.value)) {
          matchingFacts++;
          break;
        }
      }
    }
    return matchingFacts / totalFacts;
  }
  valuesAreSimilar(value1, value2) {
    if (typeof value1 === "number" && typeof value2 === "number") {
      return Math.abs(value1 - value2) / Math.max(value1, value2) < 0.05;
    }
    if (typeof value1 === "string" && typeof value2 === "string") {
      return value1.toLowerCase().trim() === value2.toLowerCase().trim();
    }
    return value1 === value2;
  }
  detectDataConflicts(result1, result2) {
    const conflicts = [];
    for (const data1 of result1.normalizedData) {
      for (const data2 of result2.normalizedData) {
        if (data1.normalizationType === data2.normalizationType && data1.unit === data2.unit && !this.valuesAreSimilar(data1.normalizedValue, data2.normalizedValue)) {
          conflicts.push({
            sources: [result1.sourceUrl, result2.sourceUrl],
            conflictType: "value_mismatch",
            description: `Different ${data1.normalizationType} values: ${data1.normalizedValue} vs ${data2.normalizedValue}`
          });
        }
      }
    }
    return conflicts;
  }
  calculateAggregatedMetrics(results) {
    const totalNoiseRemoved = results.reduce((sum, r) => sum + r.enhancement.noiseRemoved, 0);
    const avgRelevanceScore = results.length > 0 ? results.reduce((sum, r) => sum + r.qualityMetrics.overallRelevance, 0) / results.length : 0;
    const uniqueFactsExtracted = results.reduce((sum, r) => sum + r.extractedFacts.length, 0);
    const allDates = results.flatMap((r) => r.temporalData.map((t) => t.extractedDate));
    const startDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : void 0;
    const endDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : void 0;
    let timeSpan;
    if (startDate && endDate) {
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffMs / (1e3 * 60 * 60 * 24));
      timeSpan = diffDays > 0 ? `${diffDays} days` : "Same day";
    }
    return {
      totalNoiseRemoved,
      avgRelevanceScore: Math.round(avgRelevanceScore * 100) / 100,
      uniqueFactsExtracted,
      temporalCoverage: {
        startDate,
        endDate,
        timeSpan
      }
    };
  }
}
async function enhanceScrapingData(input) {
  const service = new WebScrapingEnhancementService();
  return await service.enhanceScrapingData(input);
}
var TemplateCategory = /* @__PURE__ */ ((TemplateCategory2) => {
  TemplateCategory2["FINANCE"] = "finance";
  TemplateCategory2["WEATHER"] = "weather";
  TemplateCategory2["SPORTS"] = "sports";
  TemplateCategory2["NEWS"] = "news";
  TemplateCategory2["TECHNOLOGY"] = "technology";
  TemplateCategory2["HEALTH"] = "health";
  TemplateCategory2["ECOMMERCE"] = "ecommerce";
  TemplateCategory2["SOCIAL_MEDIA"] = "social_media";
  TemplateCategory2["CRYPTOCURRENCY"] = "cryptocurrency";
  TemplateCategory2["STOCKS"] = "stocks";
  TemplateCategory2["GENERAL"] = "general";
  return TemplateCategory2;
})(TemplateCategory || {});
const TemplateSuggestionInputSchema = z.object({
  userInput: z.string().min(3, "User input must be at least 3 characters"),
  userContext: z.object({
    userId: z.string().optional(),
    previousMonitors: z.array(z.object({
      type: z.nativeEnum(MonitorType),
      category: z.nativeEnum(TemplateCategory),
      success: z.boolean(),
      frequency: z.nativeEnum(MonitoringFrequency)
    })).optional(),
    preferences: z.object({
      preferredCategories: z.array(z.nativeEnum(TemplateCategory)).optional(),
      complexityLevel: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      frequencyPreference: z.nativeEnum(MonitoringFrequency).optional()
    }).optional()
  }).optional(),
  suggestionOptions: z.object({
    maxSuggestions: z.number().min(1).max(10).default(5),
    includeExamples: z.boolean().default(true),
    prioritizePopular: z.boolean().default(true),
    includeAdvanced: z.boolean().default(false),
    categoryFilter: z.array(z.nativeEnum(TemplateCategory)).optional()
  }).default({})
});
z.object({
  inputs: z.array(TemplateSuggestionInputSchema).min(1).max(5),
  correlateAcrossInputs: z.boolean().default(true),
  generateCombined: z.boolean().default(false)
});
[
  {
    id: "stock-price-drop",
    name: "Stock Price Drop Alert",
    description: "Monitor when a specific stock drops below a threshold",
    category: "stocks",
    type: MonitorType.THRESHOLD_CHANGE,
    popularity: "very_popular",
    effectiveness: "highly_effective",
    complexity: "beginner",
    template: {
      prompt: "Alert me when {STOCK_SYMBOL} stock drops below ${THRESHOLD}",
      expectedFacts: ["{STOCK_SYMBOL} current price"],
      triggerCondition: "current_price < {THRESHOLD}",
      frequency: MonitoringFrequency.EVERY_15_MINUTES,
      factType: "number"
    },
    variations: [
      {
        name: "Multiple Stock Alert",
        prompt: "Alert me when any of {STOCK_LIST} drops below ${THRESHOLD}",
        description: "Monitor multiple stocks with the same threshold"
      },
      {
        name: "Percentage Drop",
        prompt: "Alert me when {STOCK_SYMBOL} drops more than {PERCENTAGE}% from yesterday",
        description: "Monitor percentage-based changes instead of absolute values"
      }
    ],
    examples: [
      {
        scenario: "Apple stock monitoring",
        customization: "Replace {STOCK_SYMBOL} with AAPL, {THRESHOLD} with 150",
        expectedResult: "Alert when Apple stock drops below $150"
      },
      {
        scenario: "Tesla stock monitoring",
        customization: "Replace {STOCK_SYMBOL} with TSLA, {THRESHOLD} with 200",
        expectedResult: "Alert when Tesla stock drops below $200"
      }
    ],
    tags: ["finance", "investment", "stocks", "alerts", "price-monitoring"],
    metadata: {
      createdAt: /* @__PURE__ */ new Date("2024-01-01"),
      lastUpdated: /* @__PURE__ */ new Date("2024-01-15"),
      usageCount: 1250,
      successRate: 0.94,
      avgProcessingTime: 850,
      commonErrors: ["Invalid stock symbol", "Market hours restriction"]
    }
  },
  {
    id: "crypto-surge",
    name: "Cryptocurrency Surge Alert",
    description: "Monitor when cryptocurrency rises above a threshold",
    category: "cryptocurrency",
    type: MonitorType.THRESHOLD_CHANGE,
    popularity: "popular",
    effectiveness: "effective",
    complexity: "beginner",
    template: {
      prompt: "Alert me when {CRYPTO_SYMBOL} rises above ${THRESHOLD}",
      expectedFacts: ["{CRYPTO_SYMBOL} current price"],
      triggerCondition: "current_price > {THRESHOLD}",
      frequency: MonitoringFrequency.EVERY_5_MINUTES,
      factType: "number"
    },
    variations: [
      {
        name: "Percentage Surge",
        prompt: "Alert me when {CRYPTO_SYMBOL} rises more than {PERCENTAGE}% in 24 hours",
        description: "Monitor percentage-based increases over time periods"
      },
      {
        name: "Multi-crypto Alert",
        prompt: "Alert me when any of {CRYPTO_LIST} surges above their thresholds",
        description: "Monitor multiple cryptocurrencies simultaneously"
      }
    ],
    examples: [
      {
        scenario: "Bitcoin price monitoring",
        customization: "Replace {CRYPTO_SYMBOL} with BTC, {THRESHOLD} with 50000",
        expectedResult: "Alert when Bitcoin rises above $50,000"
      },
      {
        scenario: "Ethereum monitoring",
        customization: "Replace {CRYPTO_SYMBOL} with ETH, {THRESHOLD} with 3000",
        expectedResult: "Alert when Ethereum rises above $3,000"
      }
    ],
    tags: ["cryptocurrency", "bitcoin", "ethereum", "price-surge", "alerts"],
    metadata: {
      createdAt: /* @__PURE__ */ new Date("2024-01-01"),
      lastUpdated: /* @__PURE__ */ new Date("2024-01-10"),
      usageCount: 890,
      successRate: 0.89,
      avgProcessingTime: 720,
      commonErrors: ["High volatility noise", "Exchange rate differences"]
    }
  },
  {
    id: "weather-alert",
    name: "Weather Condition Alert",
    description: "Monitor specific weather conditions for a location",
    category: "weather",
    type: MonitorType.STATE_CHANGE,
    popularity: "popular",
    effectiveness: "highly_effective",
    complexity: "beginner",
    template: {
      prompt: "Alert me when it will {WEATHER_CONDITION} in {LOCATION} tomorrow",
      expectedFacts: ["weather forecast for {LOCATION}"],
      triggerCondition: "forecast includes {WEATHER_CONDITION}",
      frequency: MonitoringFrequency.TWICE_DAILY,
      factType: "string"
    },
    variations: [
      {
        name: "Temperature Alert",
        prompt: "Alert me when temperature in {LOCATION} goes {ABOVE/BELOW} {TEMPERATURE}°F",
        description: "Monitor temperature thresholds instead of conditions"
      },
      {
        name: "Multi-day Weather",
        prompt: "Alert me if it will {WEATHER_CONDITION} for {NUMBER} consecutive days in {LOCATION}",
        description: "Monitor weather patterns over multiple days"
      }
    ],
    examples: [
      {
        scenario: "Rain alert for commuting",
        customization: "Replace {WEATHER_CONDITION} with rain, {LOCATION} with New York",
        expectedResult: "Alert when rain is forecast for New York tomorrow"
      },
      {
        scenario: "Snow alert for travel",
        customization: "Replace {WEATHER_CONDITION} with snow, {LOCATION} with Denver",
        expectedResult: "Alert when snow is forecast for Denver tomorrow"
      }
    ],
    tags: ["weather", "forecast", "rain", "snow", "temperature", "location-based"],
    metadata: {
      createdAt: /* @__PURE__ */ new Date("2024-01-01"),
      lastUpdated: /* @__PURE__ */ new Date("2024-01-12"),
      usageCount: 2150,
      successRate: 0.91,
      avgProcessingTime: 950,
      commonErrors: ["Location not found", "Forecast data unavailable"]
    }
  },
  {
    id: "news-mention",
    name: "News Mention Alert",
    description: "Monitor when specific topics or entities are mentioned in news",
    category: "news",
    type: MonitorType.PATTERN_DETECTION,
    popularity: "common",
    effectiveness: "effective",
    complexity: "intermediate",
    template: {
      prompt: "Alert me when {TOPIC/COMPANY} is mentioned in {NEWS_SOURCE} news",
      expectedFacts: ["recent news articles mentioning {TOPIC/COMPANY}"],
      triggerCondition: "new articles found",
      frequency: MonitoringFrequency.HOURLY,
      factType: "object"
    },
    variations: [
      {
        name: "Sentiment-based News",
        prompt: "Alert me when {TOPIC} is mentioned {POSITIVELY/NEGATIVELY} in news",
        description: "Monitor news mentions with sentiment analysis"
      },
      {
        name: "Breaking News",
        prompt: "Alert me immediately when breaking news about {TOPIC} is published",
        description: "High-priority alerts for breaking news"
      }
    ],
    examples: [
      {
        scenario: "Company news monitoring",
        customization: "Replace {TOPIC/COMPANY} with Apple Inc, {NEWS_SOURCE} with major",
        expectedResult: "Alert when Apple Inc is mentioned in major news sources"
      },
      {
        scenario: "Technology trend monitoring",
        customization: "Replace {TOPIC/COMPANY} with artificial intelligence, {NEWS_SOURCE} with tech",
        expectedResult: "Alert when AI is mentioned in tech news"
      }
    ],
    tags: ["news", "mentions", "companies", "topics", "media-monitoring"],
    metadata: {
      createdAt: /* @__PURE__ */ new Date("2024-01-01"),
      lastUpdated: /* @__PURE__ */ new Date("2024-01-08"),
      usageCount: 654,
      successRate: 0.78,
      avgProcessingTime: 1200,
      commonErrors: ["Too many results", "Source access issues", "Language detection"]
    }
  },
  {
    id: "website-downtime",
    name: "Website Availability Monitor",
    description: "Monitor when a website goes down or becomes unavailable",
    category: "technology",
    type: MonitorType.STATE_CHANGE,
    popularity: "popular",
    effectiveness: "highly_effective",
    complexity: "beginner",
    template: {
      prompt: "Alert me when {WEBSITE_URL} goes down or becomes unavailable",
      expectedFacts: ["{WEBSITE_URL} response status"],
      triggerCondition: "status_code != 200",
      frequency: MonitoringFrequency.EVERY_5_MINUTES,
      factType: "number"
    },
    variations: [
      {
        name: "Response Time Alert",
        prompt: "Alert me when {WEBSITE_URL} response time exceeds {THRESHOLD} seconds",
        description: "Monitor website performance instead of just availability"
      },
      {
        name: "Content Change Alert",
        prompt: "Alert me when content on {WEBSITE_URL} changes",
        description: "Monitor specific page content for changes"
      }
    ],
    examples: [
      {
        scenario: "E-commerce site monitoring",
        customization: "Replace {WEBSITE_URL} with https://mystore.com",
        expectedResult: "Alert when mystore.com goes down"
      },
      {
        scenario: "API endpoint monitoring",
        customization: "Replace {WEBSITE_URL} with https://api.myservice.com/health",
        expectedResult: "Alert when API health endpoint fails"
      }
    ],
    tags: ["website", "uptime", "availability", "monitoring", "downtime", "performance"],
    metadata: {
      createdAt: /* @__PURE__ */ new Date("2024-01-01"),
      lastUpdated: /* @__PURE__ */ new Date("2024-01-14"),
      usageCount: 1890,
      successRate: 0.96,
      avgProcessingTime: 650,
      commonErrors: ["DNS resolution issues", "Timeout errors"]
    }
  },
  {
    id: "sports-score",
    name: "Sports Game Score Alert",
    description: "Monitor live sports game scores and results",
    category: "sports",
    type: MonitorType.REAL_TIME_TRACKING,
    popularity: "common",
    effectiveness: "effective",
    complexity: "beginner",
    template: {
      prompt: "Alert me with updates on {TEAM1} vs {TEAM2} {SPORT} game",
      expectedFacts: ["current score", "game status"],
      triggerCondition: "score changes or game ends",
      frequency: MonitoringFrequency.EVERY_5_MINUTES,
      factType: "object"
    },
    variations: [
      {
        name: "Team Season Tracker",
        prompt: "Alert me when {TEAM} wins/loses any game this season",
        description: "Monitor all games for a specific team"
      },
      {
        name: "Fantasy Sports Alert",
        prompt: "Alert me when {PLAYER} scores in {SPORT}",
        description: "Monitor individual player performance"
      }
    ],
    examples: [
      {
        scenario: "NFL game monitoring",
        customization: "Replace {TEAM1} with Patriots, {TEAM2} with Jets, {SPORT} with NFL",
        expectedResult: "Alert with Patriots vs Jets game updates"
      },
      {
        scenario: "NBA game monitoring",
        customization: "Replace {TEAM1} with Lakers, {TEAM2} with Warriors, {SPORT} with NBA",
        expectedResult: "Alert with Lakers vs Warriors game updates"
      }
    ],
    tags: ["sports", "games", "scores", "teams", "live-updates"],
    metadata: {
      createdAt: /* @__PURE__ */ new Date("2024-01-01"),
      lastUpdated: /* @__PURE__ */ new Date("2024-01-11"),
      usageCount: 445,
      successRate: 0.83,
      avgProcessingTime: 1100,
      commonErrors: ["Game schedule changes", "Score data delays"]
    }
  }
];
function createMonitorSystemPrompt(context) {
  const basePrompt = `You are an AI assistant specialized in helping users create and manage real-world monitors.

Your role is to help users track real-world conditions and changes through natural language descriptions.`;
  const taskPrompts = {
    classify: `
Task: Classify the user's request to determine if they want to monitor a current state or detect changes over time.

Guidelines:
- STATE monitors track current values (e.g., "What is Tesla's current stock price?")
- CHANGE monitors detect when something changes (e.g., "Tell me when Tesla stock goes above $200")
- Always provide reasoning for your classification
- Extract key parameters like thresholds, entities, and conditions`,
    extract: `
Task: Extract relevant facts and data from web content for monitor evaluation.

Guidelines:
- Focus on numerical values, dates, status indicators, and key metrics
- Provide confidence scores for extracted data
- Note the source and freshness of information
- Handle various data formats (tables, text, structured data)`,
    analyze: `
Task: Analyze monitor data to determine if trigger conditions have been met.

Guidelines:
- Compare current values with historical data and thresholds
- Identify significant changes or trends
- Provide clear reasoning for trigger decisions
- Consider data quality and confidence levels`,
    generate: `
Task: Generate natural language content for monitor notifications and explanations.

Guidelines:
- Create clear, concise, and actionable notifications
- Explain what changed and why it matters
- Use appropriate urgency levels
- Personalize based on user context and preferences`
  };
  let prompt = basePrompt + (taskPrompts[context.task] || "");
  if (context.domain) {
    prompt += `

Domain: ${context.domain}`;
  }
  if (context.instructions) {
    prompt += `

Specific Instructions: ${context.instructions}`;
  }
  return prompt;
}
class MonitorEvaluationService {
  /**
   * Evaluate a single monitor - the core function that makes monitoring work
   */
  static async evaluateMonitor(monitorId, jobId) {
    const startTime = Date.now();
    try {
      const monitorResult = await db.select().from(monitors).where(eq(monitors.id, monitorId)).limit(1);
      if (monitorResult.length === 0) {
        return {
          success: false,
          value: null,
          changed: false,
          triggered: false,
          error: "Monitor not found",
          processingTime: Date.now() - startTime
        };
      }
      const monitor = monitorResult[0];
      if (!monitor.isActive) {
        return {
          success: false,
          value: null,
          changed: false,
          triggered: false,
          error: "Monitor is not active",
          processingTime: Date.now() - startTime
        };
      }
      const evaluationId = await this.logEvaluationStart(monitorId, jobId);
      const extractedValue = await this.extractMonitorData(monitor);
      if (extractedValue === null) {
        await this.logEvaluationComplete(evaluationId, false, null, "Data extraction failed");
        return {
          success: false,
          value: null,
          changed: false,
          triggered: false,
          error: "Failed to extract data",
          processingTime: Date.now() - startTime
        };
      }
      const changed = this.hasValueChanged(monitor.currentValue, extractedValue, monitor.type);
      const triggered = this.evaluateTriggerCondition(
        monitor.triggerCondition,
        extractedValue,
        monitor.currentValue,
        monitor.factType
      );
      await this.updateMonitorState(monitor, extractedValue, changed, triggered);
      await this.storeFact(monitorId, extractedValue, triggered, "evaluation");
      if (triggered) {
        await this.sendNotification(monitorId, extractedValue, monitor.currentValue);
      }
      await this.logEvaluationComplete(evaluationId, true, extractedValue);
      const processingTime = Date.now() - startTime;
      return {
        success: true,
        value: extractedValue,
        changed,
        triggered,
        processingTime
      };
    } catch (error) {
      console.error("Monitor evaluation failed:", error);
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        value: null,
        changed: false,
        triggered: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime
      };
    }
  }
  /**
   * Extract data from the target source using AI-powered fact extraction
   */
  static async extractMonitorData(monitor) {
    try {
      console.log(`AI-powered data extraction for monitor ${monitor.id}`);
      const urlMatch = monitor.prompt.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        try {
          const rawContent = await WebScraperService.extractData(url, {
            selector: this.inferSelector(monitor.extractedFact),
            type: monitor.factType
          });
          if (rawContent) {
            const enhancedData = await enhanceScrapingData({
              content: typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent),
              sourceUrl: url,
              purpose: monitor.extractedFact,
              targetFactType: monitor.factType
            });
            const facts = await extractFacts({
              content: enhancedData.cleanContent,
              contentType: "HTML",
              targetFacts: [monitor.extractedFact],
              context: `Monitor: ${monitor.name}. Looking for: ${monitor.extractedFact}`
            });
            if (facts.extractedFacts && facts.extractedFacts.length > 0) {
              const relevantFact = facts.extractedFacts.find(
                (f) => f.confidence > 0.7 && f.type === monitor.factType
              ) || facts.extractedFacts[0];
              console.log(`AI extraction successful:`, {
                value: relevantFact.value,
                confidence: relevantFact.confidence,
                type: relevantFact.type
              });
              return relevantFact.value;
            }
            console.warn("AI fact extraction found no relevant facts, falling back to raw content");
            return rawContent;
          }
        } catch (aiError) {
          console.warn("AI extraction failed, falling back to basic web scraping:", aiError);
          return await WebScraperService.extractData(url, {
            selector: this.inferSelector(monitor.extractedFact),
            type: monitor.factType
          });
        }
      }
      console.log("No URL found in prompt, generating test data");
      return this.generateTestData(monitor);
    } catch (error) {
      console.error("Data extraction failed:", error);
      return null;
    }
  }
  /**
   * Infer CSS selector from extracted fact description
   */
  static inferSelector(extractedFact) {
    const fact = extractedFact.toLowerCase();
    if (fact.includes("price")) {
      return ".price, .current-price, [data-price], .product-price";
    }
    if (fact.includes("stock") || fact.includes("inventory")) {
      return ".stock, .inventory, .availability, [data-stock]";
    }
    if (fact.includes("title") || fact.includes("headline")) {
      return "h1, h2, .title, .headline, .article-title";
    }
    if (fact.includes("count") || fact.includes("number")) {
      return ".count, .number, .quantity, [data-count]";
    }
    return "body";
  }
  /**
   * Generate realistic test data for development/demo
   */
  static generateTestData(monitor) {
    const prompt = monitor.prompt.toLowerCase();
    if (prompt.includes("stock") || prompt.includes("price") || prompt.includes("$")) {
      const basePrice = 100 + Math.random() * 400;
      const change = (Math.random() - 0.5) * 10;
      return Math.round((basePrice + change) * 100) / 100;
    }
    if (prompt.includes("bitcoin") || prompt.includes("crypto") || prompt.includes("btc")) {
      const basePrice = 4e4 + Math.random() * 2e4;
      const change = (Math.random() - 0.5) * 2e3;
      return Math.round(basePrice + change);
    }
    if (prompt.includes("temperature") || prompt.includes("weather")) {
      return Math.round(15 + Math.random() * 20);
    }
    if (prompt.includes("stock") && !prompt.includes("price")) {
      return Math.floor(Math.random() * 100);
    }
    if (monitor.factType === "boolean") {
      return Math.random() > 0.7;
    }
    if (monitor.factType === "string") {
      const statuses = ["Available", "Out of Stock", "Limited", "Pre-order", "Discontinued"];
      return statuses[Math.floor(Math.random() * statuses.length)];
    }
    if (monitor.factType === "object") {
      return {
        value: Math.round(Math.random() * 1e3),
        status: Math.random() > 0.5 ? "active" : "inactive",
        updated: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    return Math.round(Math.random() * 1e3);
  }
  /**
   * Check if value has changed based on monitor type
   */
  static hasValueChanged(currentValue, newValue, monitorType) {
    if (currentValue === null || currentValue === void 0) {
      return true;
    }
    if (monitorType === "change") {
      return JSON.stringify(currentValue) !== JSON.stringify(newValue);
    }
    if (typeof newValue === "number" && typeof currentValue === "number") {
      const changePercent = Math.abs(newValue - currentValue) / currentValue;
      return changePercent > 0.01;
    }
    return JSON.stringify(currentValue) !== JSON.stringify(newValue);
  }
  /**
   * Evaluate trigger condition against the extracted value
   */
  static evaluateTriggerCondition(condition, currentValue, previousValue, factType) {
    try {
      const conditionLower = condition.toLowerCase();
      if (factType === "number" && typeof currentValue === "number") {
        const numValue = currentValue;
        if (conditionLower.includes("above") || conditionLower.includes(">")) {
          const threshold = this.extractNumber(condition);
          return threshold !== null && numValue > threshold;
        }
        if (conditionLower.includes("below") || conditionLower.includes("<")) {
          const threshold = this.extractNumber(condition);
          return threshold !== null && numValue < threshold;
        }
        if (conditionLower.includes("equals") || conditionLower.includes("=")) {
          const threshold = this.extractNumber(condition);
          return threshold !== null && Math.abs(numValue - threshold) < 0.01;
        }
        if (conditionLower.includes("drops") && previousValue !== null) {
          const threshold = this.extractNumber(condition) || 0;
          return numValue < previousValue - threshold;
        }
        if (conditionLower.includes("rises") || conditionLower.includes("increases")) {
          const threshold = this.extractNumber(condition) || 0;
          return previousValue !== null && numValue > previousValue + threshold;
        }
      }
      if (factType === "string" && typeof currentValue === "string") {
        if (conditionLower.includes("contains")) {
          const searchTerm = this.extractQuotedText(condition) || this.extractLastWord(condition);
          return searchTerm && currentValue.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (conditionLower.includes("equals") || conditionLower.includes("is")) {
          const target = this.extractQuotedText(condition) || this.extractLastWord(condition);
          return target && currentValue.toLowerCase() === target.toLowerCase();
        }
        if (conditionLower.includes("changes")) {
          return previousValue !== null && currentValue !== previousValue;
        }
      }
      if (factType === "boolean") {
        if (conditionLower.includes("true") || conditionLower.includes("becomes true")) {
          return currentValue === true;
        }
        if (conditionLower.includes("false") || conditionLower.includes("becomes false")) {
          return currentValue === false;
        }
        if (conditionLower.includes("changes")) {
          return previousValue !== null && currentValue !== previousValue;
        }
      }
      return previousValue !== null && JSON.stringify(currentValue) !== JSON.stringify(previousValue);
    } catch (error) {
      console.error("Trigger condition evaluation error:", error);
      return false;
    }
  }
  /**
   * Extract number from condition string
   */
  static extractNumber(text) {
    const matches = text.match(/[\d.,]+/);
    if (matches) {
      const numStr = matches[0].replace(/,/g, "");
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    }
    return null;
  }
  /**
   * Extract quoted text from condition
   */
  static extractQuotedText(text) {
    const matches = text.match(/"([^"]+)"|'([^']+)'/);
    return matches ? matches[1] || matches[2] : null;
  }
  /**
   * Extract last word from condition (fallback)
   */
  static extractLastWord(text) {
    const words = text.trim().split(/\s+/);
    return words.length > 0 ? words[words.length - 1] : null;
  }
  /**
   * Update monitor state with new values
   */
  static async updateMonitorState(monitor, newValue, changed, triggered) {
    const updates = {
      lastChecked: /* @__PURE__ */ new Date(),
      previousValue: monitor.currentValue,
      currentValue: newValue,
      evaluationCount: monitor.evaluationCount + 1,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (triggered) {
      updates.triggerCount = monitor.triggerCount + 1;
    }
    await db.update(monitors).set(updates).where(eq(monitors.id, monitor.id));
  }
  /**
   * Store fact in history
   */
  static async storeFact(monitorId, value, triggered, source) {
    await Promise.all([
      // Store in monitor_facts (recent facts)
      db.insert(monitorFacts).values({
        monitorId,
        value,
        extractedAt: /* @__PURE__ */ new Date(),
        source,
        triggeredAlert: triggered,
        processingTime: 100,
        // Placeholder
        confidence: 1,
        createdAt: /* @__PURE__ */ new Date()
      }),
      // Store in fact_history (long-term analytics)
      db.insert(factHistory).values({
        monitorId,
        value,
        timestamp: /* @__PURE__ */ new Date(),
        triggeredAlert: triggered,
        source,
        createdAt: /* @__PURE__ */ new Date()
      })
    ]);
  }
  /**
   * Send notification if monitor triggered with AI-powered personalization
   */
  static async sendNotification(monitorId, currentValue, previousValue) {
    try {
      const monitorResult = await db.select().from(monitors).where(eq(monitors.id, monitorId)).limit(1);
      if (monitorResult.length === 0) {
        console.error("Monitor not found for notification:", monitorId);
        return;
      }
      const monitor = monitorResult[0];
      try {
        console.log(`Generating AI-powered notification for monitor ${monitorId}`);
        const notificationData = await generateNotification({
          monitorName: monitor.name,
          monitorType: monitor.type,
          extractedFact: monitor.extractedFact,
          currentValue,
          previousValue,
          triggerCondition: monitor.triggerCondition,
          factType: monitor.factType
        });
        await IntegratedEmailService.sendAIGeneratedNotification(
          monitorId,
          currentValue,
          previousValue,
          notificationData
        );
        console.log(`AI-powered notification sent successfully for monitor ${monitorId}`);
      } catch (aiError) {
        console.warn("AI notification generation failed, falling back to standard notification:", aiError);
        await IntegratedEmailService.sendMonitorNotification(
          monitorId,
          currentValue,
          previousValue
        );
      }
    } catch (error) {
      console.error("Failed to send monitor notification:", error);
    }
  }
  /**
   * Log evaluation start
   */
  static async logEvaluationStart(monitorId, jobId) {
    const result = await db.insert(monitorEvaluations).values({
      monitorId,
      jobId,
      status: "processing",
      startedAt: /* @__PURE__ */ new Date(),
      triggeredBy: "manual",
      // TODO: detect source
      createdAt: /* @__PURE__ */ new Date()
    }).returning({ id: monitorEvaluations.id });
    return result[0].id;
  }
  /**
   * Log evaluation completion
   */
  static async logEvaluationComplete(evaluationId, success, extractedValue, errorMessage) {
    const updates = {
      status: success ? "completed" : "failed",
      completedAt: /* @__PURE__ */ new Date(),
      extractedValue,
      errorMessage
    };
    await db.update(monitorEvaluations).set(updates).where(eq(monitorEvaluations.id, evaluationId));
  }
  /**
   * Evaluate all active monitors (for scheduled runs)
   */
  static async evaluateAllActiveMonitors() {
    const activeMonitors = await db.select().from(monitors).where(eq(monitors.isActive, true));
    let successful = 0;
    let triggered = 0;
    let failed = 0;
    for (const monitor of activeMonitors) {
      try {
        const result = await this.evaluateMonitor(monitor.id);
        if (result.success) {
          successful++;
          if (result.triggered) {
            triggered++;
          }
        } else {
          failed++;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to evaluate monitor ${monitor.id}:`, error);
        failed++;
      }
    }
    console.log(`Evaluated ${activeMonitors.length} monitors: ${successful} successful, ${triggered} triggered, ${failed} failed`);
    return {
      total: activeMonitors.length,
      successful,
      triggered,
      failed
    };
  }
}
export {
  MonitorEvaluationService as M,
  WebScraperService as W,
  classifyPrompt as c
};
