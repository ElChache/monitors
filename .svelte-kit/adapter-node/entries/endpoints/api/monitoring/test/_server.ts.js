import { json } from "@sveltejs/kit";
import { J as JWTService } from "../../../../../chunks/jwt.js";
import "../../../../../chunks/db.js";
import "../../../../../chunks/users.js";
import { W as WebScraperService } from "../../../../../chunks/evaluation_service.js";
import "../../../../../chunks/service4.js";
import { M as MonitorJobQueue } from "../../../../../chunks/job_queue_simple.js";
import { M as MonitorService } from "../../../../../chunks/monitor_service.js";
const GET = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get("session");
    if (!sessionToken) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: "Invalid session" }, { status: 401 });
    }
    console.log(`Running comprehensive monitoring system test for user: ${payload.userId}`);
    const testResults = {
      overall: "running",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      tests: {}
    };
    try {
      const queueHealth = await MonitorJobQueue.healthCheck();
      testResults.tests.jobQueue = {
        name: "Job Queue Health",
        status: queueHealth.connected ? "pass" : "fail",
        result: queueHealth,
        error: queueHealth.error
      };
    } catch (error) {
      testResults.tests.jobQueue = {
        name: "Job Queue Health",
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
    try {
      const scraperHealth = await WebScraperService.healthCheck();
      testResults.tests.webScraper = {
        name: "Web Scraper Health",
        status: scraperHealth.canScrape ? "pass" : "fail",
        result: scraperHealth
      };
    } catch (error) {
      testResults.tests.webScraper = {
        name: "Web Scraper Health",
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
    try {
      const scrapingTest = await WebScraperService.testScraping();
      testResults.tests.scrapingFunction = {
        name: "Web Scraping Functionality",
        status: scrapingTest.success ? "pass" : "fail",
        result: scrapingTest
      };
    } catch (error) {
      testResults.tests.scrapingFunction = {
        name: "Web Scraping Functionality",
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
    try {
      const queueStats = await MonitorJobQueue.getQueueStats();
      testResults.tests.queueStats = {
        name: "Queue Statistics",
        status: "pass",
        result: queueStats
      };
    } catch (error) {
      testResults.tests.queueStats = {
        name: "Queue Statistics",
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
    try {
      const testMonitorConfig = {
        name: "Test Monitor",
        prompt: "Monitor the current time from https://example.com",
        type: "state",
        extractedFact: "Current timestamp",
        triggerCondition: "changes",
        factType: "string",
        checkFrequency: 60
      };
      const monitorTest = await MonitorService.testMonitor(payload.userId, testMonitorConfig);
      testResults.tests.monitorTest = {
        name: "Monitor Configuration Test",
        status: monitorTest.success ? "pass" : "fail",
        result: {
          success: monitorTest.success,
          extractedValue: monitorTest.extractedValue,
          processingTime: monitorTest.processingTime
        },
        error: monitorTest.error
      };
    } catch (error) {
      testResults.tests.monitorTest = {
        name: "Monitor Configuration Test",
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
    const testStatuses = Object.values(testResults.tests).map((test) => test.status);
    const failedTests = testStatuses.filter((status) => status === "fail").length;
    const passedTests = testStatuses.filter((status) => status === "pass").length;
    testResults.overall = failedTests === 0 ? "pass" : passedTests > 0 ? "partial" : "fail";
    const summary = {
      total: testStatuses.length,
      passed: passedTests,
      failed: failedTests,
      overall: testResults.overall
    };
    return json({
      success: true,
      message: `Monitoring system test completed: ${passedTests}/${testStatuses.length} tests passed`,
      data: {
        ...testResults,
        summary
      }
    });
  } catch (error) {
    console.error("Monitoring system test endpoint error:", error);
    if (error.message?.includes("expired")) {
      return json({ error: "Session expired" }, { status: 401 });
    }
    return json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
export {
  GET
};
