import puppeteer, { Browser, Page } from 'puppeteer';

export interface ScrapingOptions {
  selector?: string;
  type?: 'string' | 'number' | 'boolean' | 'object';
  waitFor?: string;
  timeout?: number;
  screenshot?: boolean;
}

export interface ScrapingResult {
  success: boolean;
  data: any;
  error?: string;
  screenshot?: Buffer;
  processingTime: number;
}

/**
 * Web scraping service using Puppeteer for real data extraction
 */
export class WebScraperService {
  private static browser: Browser | null = null;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Initialize Puppeteer browser
   */
  private static async initializeBrowser(): Promise<void> {
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
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        });
        
        console.log('Puppeteer browser initialized');
      } catch (error) {
        console.error('Failed to initialize Puppeteer browser:', error);
        this.initializationPromise = null;
        throw error;
      }
    })();

    await this.initializationPromise;
  }

  /**
   * Extract data from a URL using CSS selectors
   */
  static async extractData(url: string, options: ScrapingOptions = {}): Promise<any> {
    const startTime = Date.now();
    
    try {
      await this.initializeBrowser();
      
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      
      try {
        // Configure page
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate to URL with timeout
        const timeout = options.timeout || 30000;
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout 
        });

        // Wait for specific element if specified
        if (options.waitFor) {
          await page.waitForSelector(options.waitFor, { timeout: 10000 });
        }

        // Extract data using selector
        let data: any = null;
        
        if (options.selector) {
          data = await this.extractBySelector(page, options.selector, options.type);
        } else {
          // Default: extract page title and basic content
          data = await page.evaluate(() => ({
            title: document.title,
            url: window.location.href,
            timestamp: new Date().toISOString()
          }));
        }

        // Take screenshot if requested
        let screenshot: Buffer | undefined;
        if (options.screenshot) {
          screenshot = await page.screenshot({ 
            fullPage: false,
            type: 'png'
          });
        }

        const processingTime = Date.now() - startTime;

        console.log(`Scraped ${url} in ${processingTime}ms`);

        return data;

      } finally {
        await page.close();
      }

    } catch (error) {
      console.error('Web scraping failed:', error);
      
      // Return null for failed scraping (evaluation service will handle)
      return null;
    }
  }

  /**
   * Extract data using CSS selector
   */
  private static async extractBySelector(
    page: Page, 
    selector: string, 
    type: string = 'string'
  ): Promise<any> {
    try {
      // Try multiple selectors (comma-separated)
      const selectors = selector.split(',').map(s => s.trim());
      
      for (const sel of selectors) {
        const element = await page.$(sel);
        if (element) {
          const text = await element.evaluate(el => el.textContent?.trim() || '');
          
          if (text) {
            return this.convertToType(text, type);
          }
        }
      }

      // No element found with any selector
      return null;

    } catch (error) {
      console.error('Selector extraction failed:', error);
      return null;
    }
  }

  /**
   * Convert extracted text to specified type
   */
  private static convertToType(text: string, type: string): any {
    switch (type) {
      case 'number':
        // Extract number from text (handles currency, percentages, etc.)
        const numMatch = text.match(/[\d.,]+/);
        if (numMatch) {
          const cleanNum = numMatch[0].replace(/,/g, '');
          const num = parseFloat(cleanNum);
          return isNaN(num) ? null : num;
        }
        return null;

      case 'boolean':
        const lowerText = text.toLowerCase();
        if (['true', 'yes', 'available', 'in stock', 'active', 'enabled'].some(t => lowerText.includes(t))) {
          return true;
        }
        if (['false', 'no', 'unavailable', 'out of stock', 'inactive', 'disabled'].some(t => lowerText.includes(t))) {
          return false;
        }
        return null;

      case 'object':
        // Try to parse as JSON, fallback to simple object
        try {
          return JSON.parse(text);
        } catch {
          return { value: text, extracted: new Date().toISOString() };
        }

      case 'string':
      default:
        return text;
    }
  }

  /**
   * Test scraping functionality
   */
  static async testScraping(): Promise<{
    success: boolean;
    results: Array<{
      url: string;
      success: boolean;
      data: any;
      error?: string;
    }>;
  }> {
    const testUrls = [
      {
        url: 'https://example.com',
        selector: 'h1',
        type: 'string'
      },
      {
        url: 'https://httpstat.us/200',
        selector: 'body',
        type: 'string'
      }
    ];

    const results = [];
    let successCount = 0;

    for (const test of testUrls) {
      try {
        const data = await this.extractData(test.url, {
          selector: test.selector,
          type: test.type as any,
          timeout: 10000
        });

        const success = data !== null;
        if (success) successCount++;

        results.push({
          url: test.url,
          success,
          data,
          error: success ? undefined : 'No data extracted'
        });

      } catch (error) {
        results.push({
          url: test.url,
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
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
  static async healthCheck(): Promise<{
    browserReady: boolean;
    canScrape: boolean;
    version?: string;
  }> {
    try {
      await this.initializeBrowser();
      
      const browserReady = this.browser !== null;
      
      let canScrape = false;
      let version: string | undefined;

      if (browserReady) {
        // Test basic scraping capability
        const testResult = await this.extractData('data:text/html,<html><body><h1>Test</h1></body></html>', {
          selector: 'h1',
          timeout: 5000
        });
        
        canScrape = testResult === 'Test';
        version = await this.browser!.version();
      }

      return {
        browserReady,
        canScrape,
        version
      };

    } catch (error) {
      console.error('Scraping health check failed:', error);
      return {
        browserReady: false,
        canScrape: false
      };
    }
  }

  /**
   * Close browser (cleanup)
   */
  static async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.initializationPromise = null;
      console.log('Puppeteer browser closed');
    }
  }
}