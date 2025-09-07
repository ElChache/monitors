import { test, expect } from '@playwright/test';
import { 
  FactExtractionInputSchema, 
  FactExtractionOutputSchema 
} from '$lib/ai/test/interfaces';

test.describe('AI-Powered Monitor Evaluation', () => {
  test('extract facts from web content', async ({ request }) => {
    const response = await request.post('/api/monitors/evaluate', {
      data: {
        monitorId: 'test_monitor_stock_001',
        content: `
          <html>
            <body>
              <h1>Tesla Stock Update</h1>
              <p>Current price: $243.50, down 2.3% today</p>
              <p>Trading volume: 8.5 million shares</p>
            </body>
          </html>
        `,
        contentType: 'HTML'
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();

    const extractedFacts = FactExtractionOutputSchema.parse(responseData.extractedFacts);
    
    expect(extractedFacts.extractedFacts.length).toBeGreaterThan(0);
    
    const priceFactExists = extractedFacts.extractedFacts.some(fact => 
      fact.fact.includes('$243.50') && fact.category === 'price'
    );
    const volumeFactExists = extractedFacts.extractedFacts.some(fact => 
      fact.fact.includes('8.5 million') && fact.category === 'volume'
    );

    expect(priceFactExists).toBe(true);
    expect(volumeFactExists).toBe(true);
  });

  test('enhance web scraping data', async ({ request }) => {
    const response = await request.post('/api/monitors/enhance', {
      data: {
        monitorId: 'test_monitor_stock_002',
        rawContent: `
          <html>
            <body>
              Messy stock data with lots of noise
              TSLA: 243.50 (-2.3%) today
              Volume: high
              Random ads and navigation
            </body>
          </html>
        `,
        sourceUrl: 'https://example.com/stock-data'
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();

    expect(responseData).toHaveProperty('cleanedContent');
    expect(responseData).toHaveProperty('extractedMetadata');

    // Verify noise removal
    expect(responseData.cleanedContent).not.toContain('Random ads');
    expect(responseData.cleanedContent).toContain('TSLA: 243.50');

    // Verify metadata extraction
    expect(responseData.extractedMetadata.sourceQuality).toBeGreaterThan(0.7);
    expect(responseData.extractedMetadata.processingTime).toBeLessThan(500);
  });

  test('handle complex content types', async ({ request }) => {
    const response = await request.post('/api/monitors/evaluate', {
      data: {
        monitorId: 'test_monitor_mixed_001',
        content: JSON.stringify({
          stockData: {
            symbol: 'TSLA',
            price: 243.50,
            change: -2.3,
            volume: 8500000
          },
          news: [
            { headline: 'Tesla stock drops on market uncertainty' },
            { headline: 'New product announcement expected soon' }
          ]
        }),
        contentType: 'JSON'
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();

    const extractedFacts = FactExtractionOutputSchema.parse(responseData.extractedFacts);
    
    expect(extractedFacts.extractedFacts.length).toBeGreaterThan(1);
    
    const stockPriceFact = extractedFacts.extractedFacts.find(fact => 
      fact.fact.includes('243.50') && fact.category === 'price'
    );
    const stockChangeFact = extractedFacts.extractedFacts.find(fact => 
      fact.fact.includes('-2.3%') && fact.category === 'change'
    );

    expect(stockPriceFact).toBeDefined();
    expect(stockChangeFact).toBeDefined();
  });

  test('fallback for content extraction failure', async ({ request }) => {
    const response = await request.post('/api/monitors/evaluate', {
      data: {
        monitorId: 'test_monitor_failure_001',
        content: 'TRIGGER_AI_SERVICE_FAILURE',
        contentType: 'HTML'
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();

    expect(responseData).toHaveProperty('fallbackExtraction');
    expect(responseData.fallbackExtraction.facts.length).toBeGreaterThan(0);
    expect(responseData.fallbackExtraction.processingMethod).toBe('manual');
  });
});