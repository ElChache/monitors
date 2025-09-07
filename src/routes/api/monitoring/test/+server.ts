import { json, type RequestHandler } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt';
import { MonitorService, MonitorJobQueue, WebScraperService } from '$lib/server/monitoring';

/**
 * GET /api/monitoring/test - Comprehensive monitoring system test
 * Tests all components of the monitoring system
 */
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    console.log(`Running comprehensive monitoring system test for user: ${payload.userId}`);

    const testResults = {
      overall: 'running',
      timestamp: new Date().toISOString(),
      tests: {} as any,
    };

    // Test 1: Job Queue Health
    try {
      const queueHealth = await MonitorJobQueue.healthCheck();
      testResults.tests.jobQueue = {
        name: 'Job Queue Health',
        status: queueHealth.connected ? 'pass' : 'fail',
        result: queueHealth,
        error: queueHealth.error,
      };
    } catch (error) {
      testResults.tests.jobQueue = {
        name: 'Job Queue Health',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 2: Web Scraper Health
    try {
      const scraperHealth = await WebScraperService.healthCheck();
      testResults.tests.webScraper = {
        name: 'Web Scraper Health',
        status: scraperHealth.canScrape ? 'pass' : 'fail',
        result: scraperHealth,
      };
    } catch (error) {
      testResults.tests.webScraper = {
        name: 'Web Scraper Health',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 3: Web Scraping Functionality
    try {
      const scrapingTest = await WebScraperService.testScraping();
      testResults.tests.scrapingFunction = {
        name: 'Web Scraping Functionality',
        status: scrapingTest.success ? 'pass' : 'fail',
        result: scrapingTest,
      };
    } catch (error) {
      testResults.tests.scrapingFunction = {
        name: 'Web Scraping Functionality',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 4: Queue Statistics
    try {
      const queueStats = await MonitorJobQueue.getQueueStats();
      testResults.tests.queueStats = {
        name: 'Queue Statistics',
        status: 'pass',
        result: queueStats,
      };
    } catch (error) {
      testResults.tests.queueStats = {
        name: 'Queue Statistics',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 5: Test Monitor Configuration
    try {
      const testMonitorConfig = {
        name: 'Test Monitor',
        prompt: 'Monitor the current time from https://example.com',
        type: 'state' as const,
        extractedFact: 'Current timestamp',
        triggerCondition: 'changes',
        factType: 'string' as const,
        checkFrequency: 60,
      };

      const monitorTest = await MonitorService.testMonitor(payload.userId, testMonitorConfig);
      testResults.tests.monitorTest = {
        name: 'Monitor Configuration Test',
        status: monitorTest.success ? 'pass' : 'fail',
        result: {
          success: monitorTest.success,
          extractedValue: monitorTest.extractedValue,
          processingTime: monitorTest.processingTime,
        },
        error: monitorTest.error,
      };
    } catch (error) {
      testResults.tests.monitorTest = {
        name: 'Monitor Configuration Test',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Determine overall test result
    const testStatuses = Object.values(testResults.tests).map((test: any) => test.status);
    const failedTests = testStatuses.filter(status => status === 'fail').length;
    const passedTests = testStatuses.filter(status => status === 'pass').length;

    testResults.overall = failedTests === 0 ? 'pass' : (passedTests > 0 ? 'partial' : 'fail');

    const summary = {
      total: testStatuses.length,
      passed: passedTests,
      failed: failedTests,
      overall: testResults.overall,
    };

    return json({
      success: true,
      message: `Monitoring system test completed: ${passedTests}/${testStatuses.length} tests passed`,
      data: {
        ...testResults,
        summary,
      },
    });

  } catch (error: any) {
    console.error('Monitoring system test endpoint error:', error);
    
    if (error.message?.includes('expired')) {
      return json({ error: 'Session expired' }, { status: 401 });
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};