/**
 * AI008 Integration Examples
 * 
 * Demonstrates how the notification generation service integrates
 * with the complete monitoring workflow for real-world scenarios.
 */

import {
  generateNotification,
  determineUrgency,
  UrgencyLevel,
  NotificationType,
  ToneStyle,
  type NotificationContext
} from '../notificationGeneration.js';

/**
 * Complete stock monitoring workflow example
 */
export async function stockMonitoringWorkflow() {
  console.log('🏃‍♂️ Stock Monitoring Workflow Example');
  console.log('=====================================');
  
  // Simulate monitor trigger: Tesla stock exceeds threshold
  const monitorData = {
    monitorId: 'tsla_monitor_001',
    monitorName: 'Tesla Stock Price Alert',
    currentValue: 245.75,
    previousValue: 238.20,
    threshold: 240,
    unit: 'USD',
    source: 'Yahoo Finance',
    timestamp: new Date()
  };

  // Calculate change percentage
  const changePercentage = ((monitorData.currentValue - monitorData.previousValue) / monitorData.previousValue) * 100;

  // Determine urgency based on the change
  const urgencyLevel = determineUrgency(
    monitorData,
    NotificationType.THRESHOLD_EXCEEDED,
    changePercentage
  );

  console.log(`📊 Monitor Data:
  - Current Price: $${monitorData.currentValue}
  - Previous Price: $${monitorData.previousValue}
  - Change: +$${(monitorData.currentValue - monitorData.previousValue).toFixed(2)} (${changePercentage.toFixed(2)}%)
  - Urgency: ${urgencyLevel}`);

  // User preferences
  const userContext = {
    userId: 'user_12345',
    userName: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    timezone: 'America/New_York',
    preferredTone: ToneStyle.PROFESSIONAL,
    notificationPreferences: {
      includeHistoricalContext: true,
      includeActionRecommendations: true,
      maxEmailLength: 'medium' as const
    }
  };

  // Create notification context
  const context: NotificationContext = {
    notificationType: NotificationType.THRESHOLD_EXCEEDED,
    urgencyLevel,
    triggerReason: `Stock price exceeded $${monitorData.threshold} threshold`,
    monitorData,
    userContext,
    historicalData: [
      { value: 230.50, timestamp: new Date(Date.now() - 86400000 * 7) }, // 7 days ago
      { value: 235.80, timestamp: new Date(Date.now() - 86400000 * 3) }, // 3 days ago
      { value: 238.20, timestamp: new Date(Date.now() - 86400000 * 1) }  // 1 day ago
    ]
  };

  try {
    // Generate notification
    const notification = await generateNotification(context, {
      includeHtml: true,
      testMode: true
    });

    console.log(`
📧 Generated Notification:
Subject: ${notification.subject}
Estimated Read Time: ${notification.estimatedReadTime}
Confidence Score: ${notification.confidenceScore}

Body:
${notification.bodyText}

Key Points:
${notification.keyPoints.map(point => `• ${point}`).join('\n')}

${notification.actionRecommendations ? `Action Recommendations:
${notification.actionRecommendations.map(rec => `• ${rec}`).join('\n')}` : ''}

Personalization Used: ${notification.personalizationUsed.join(', ')}
Generation Time: ${notification.generationTime}ms
`);

    return notification;

  } catch (error) {
    console.error('❌ Notification generation failed:', error);
    throw error;
  }
}

/**
 * Weather emergency notification example
 */
export async function weatherEmergencyWorkflow() {
  console.log('🌪️ Weather Emergency Workflow Example');
  console.log('=====================================');

  const context: NotificationContext = {
    notificationType: NotificationType.STATUS_UPDATE,
    urgencyLevel: UrgencyLevel.CRITICAL,
    triggerReason: 'Severe weather warning issued by National Weather Service',
    monitorData: {
      monitorId: 'weather_miami_001',
      monitorName: 'Miami Weather Emergency Monitor',
      currentValue: 'Hurricane Warning - Category 3',
      previousValue: 'Tropical Storm Watch',
      source: 'National Weather Service',
      metadata: {
        windSpeed: '115 mph',
        expectedLandfall: '6 hours',
        evacuationZones: ['A', 'B']
      },
      timestamp: new Date()
    },
    userContext: {
      userId: 'user_98765',
      userName: 'Mike Rodriguez',
      email: 'mike.rodriguez@example.com',
      timezone: 'America/Miami',
      preferredTone: ToneStyle.BRIEF, // Emergency = brief and clear
      notificationPreferences: {
        includeActionRecommendations: true,
        maxEmailLength: 'short'
      }
    }
  };

  try {
    const notification = await generateNotification(context);

    console.log(`
🚨 Emergency Notification:
Subject: ${notification.subject}
Urgency: ${notification.urgencyLevel}

Body:
${notification.bodyText}

Key Points:
${notification.keyPoints.map(point => `• ${point}`).join('\n')}

Emergency Actions:
${notification.actionRecommendations?.map(rec => `• ${rec}`).join('\n') || 'None specified'}
`);

    return notification;

  } catch (error) {
    console.error('❌ Emergency notification failed:', error);
    throw error;
  }
}

/**
 * Cryptocurrency trend detection example
 */
export async function cryptoTrendWorkflow() {
  console.log('₿ Cryptocurrency Trend Workflow Example');
  console.log('=======================================');

  const context: NotificationContext = {
    notificationType: NotificationType.TREND_DETECTED,
    urgencyLevel: UrgencyLevel.MEDIUM,
    triggerReason: 'Bullish trend detected over 7-day period',
    monitorData: {
      monitorId: 'btc_trend_001',
      monitorName: 'Bitcoin Trend Analysis',
      currentValue: 52750,
      previousValue: 48200,
      unit: 'USD',
      source: 'CoinGecko API',
      metadata: {
        trendStrength: 'Strong',
        volumeIncrease: '45%',
        timeframe: '7 days'
      },
      timestamp: new Date()
    },
    userContext: {
      userId: 'crypto_trader_001',
      userName: 'Alex Chen',
      email: 'alex.chen@tradingfirm.com',
      timezone: 'America/Los_Angeles',
      preferredTone: ToneStyle.TECHNICAL,
      notificationPreferences: {
        includeHistoricalContext: true,
        includeActionRecommendations: true,
        maxEmailLength: 'long'
      }
    },
    historicalData: [
      { value: 45800, timestamp: new Date(Date.now() - 86400000 * 7) },
      { value: 47200, timestamp: new Date(Date.now() - 86400000 * 5) },
      { value: 48900, timestamp: new Date(Date.now() - 86400000 * 3) },
      { value: 50100, timestamp: new Date(Date.now() - 86400000 * 1) }
    ]
  };

  try {
    const notification = await generateNotification(context, {
      includeHtml: true
    });

    console.log(`
📈 Trend Analysis Notification:
Subject: ${notification.subject}
Analysis Confidence: ${notification.confidenceScore}

Technical Analysis:
${notification.bodyText}

Key Indicators:
${notification.keyPoints.map(point => `• ${point}`).join('\n')}

Trading Recommendations:
${notification.actionRecommendations?.map(rec => `• ${rec}`).join('\n') || 'None specified'}

Analysis Depth: ${notification.readabilityScore} complexity
`);

    return notification;

  } catch (error) {
    console.error('❌ Trend analysis notification failed:', error);
    throw error;
  }
}

/**
 * Website downtime monitoring example
 */
export async function websiteDowntimeWorkflow() {
  console.log('🌐 Website Downtime Workflow Example');
  console.log('====================================');

  const context: NotificationContext = {
    notificationType: NotificationType.ERROR_OCCURRED,
    urgencyLevel: UrgencyLevel.CRITICAL,
    triggerReason: 'Website became unreachable - HTTP 500 errors',
    monitorData: {
      monitorId: 'site_uptime_001',
      monitorName: 'E-commerce Site Uptime Monitor',
      currentValue: 'DOWN - HTTP 500 Internal Server Error',
      previousValue: 'UP - Response time 245ms',
      source: 'https://shop.example.com',
      metadata: {
        errorCode: 500,
        lastSuccessfulCheck: '2 minutes ago',
        responseTime: null,
        downtime: '2 minutes 15 seconds'
      },
      timestamp: new Date()
    },
    userContext: {
      userId: 'devops_001',
      userName: 'Emily Parker',
      email: 'emily.parker@techcorp.com',
      timezone: 'UTC',
      preferredTone: ToneStyle.TECHNICAL,
      notificationPreferences: {
        includeActionRecommendations: true,
        maxEmailLength: 'medium'
      }
    }
  };

  try {
    const notification = await generateNotification(context);

    console.log(`
🔴 Downtime Alert:
Subject: ${notification.subject}
Severity: ${notification.urgencyLevel}

Incident Details:
${notification.bodyText}

System Status:
${notification.keyPoints.map(point => `• ${point}`).join('\n')}

Incident Response:
${notification.actionRecommendations?.map(rec => `• ${rec}`).join('\n') || 'None specified'}
`);

    return notification;

  } catch (error) {
    console.error('❌ Downtime notification failed:', error);
    throw error;
  }
}

/**
 * Daily scheduled report example
 */
export async function dailyReportWorkflow() {
  console.log('📊 Daily Report Workflow Example');
  console.log('================================');

  const context: NotificationContext = {
    notificationType: NotificationType.SCHEDULED_REPORT,
    urgencyLevel: UrgencyLevel.LOW,
    triggerReason: 'Daily portfolio performance summary',
    monitorData: {
      monitorId: 'portfolio_daily_001',
      monitorName: 'Investment Portfolio Daily Summary',
      currentValue: 'Portfolio up 2.3% today',
      metadata: {
        totalValue: 125750.80,
        dailyChange: 2875.20,
        topPerformer: 'AAPL (+5.2%)',
        underPerformer: 'TSLA (-1.8%)',
        totalReturn: '8.7%'
      },
      timestamp: new Date()
    },
    userContext: {
      userId: 'investor_001',
      userName: 'Robert Kim',
      email: 'robert.kim@gmail.com',
      timezone: 'America/New_York',
      preferredTone: ToneStyle.CASUAL,
      notificationPreferences: {
        includeHistoricalContext: true,
        includeActionRecommendations: false,
        maxEmailLength: 'medium'
      }
    },
    historicalData: [
      { value: 'Portfolio up 1.1%', timestamp: new Date(Date.now() - 86400000 * 1) },
      { value: 'Portfolio down 0.5%', timestamp: new Date(Date.now() - 86400000 * 2) },
      { value: 'Portfolio up 3.2%', timestamp: new Date(Date.now() - 86400000 * 3) }
    ]
  };

  try {
    const notification = await generateNotification(context);

    console.log(`
📈 Daily Portfolio Report:
Subject: ${notification.subject}
Report Type: ${notification.urgencyLevel} priority

Performance Summary:
${notification.bodyText}

Today's Highlights:
${notification.keyPoints.map(point => `• ${point}`).join('\n')}

Report Generation Time: ${notification.generationTime}ms
`);

    return notification;

  } catch (error) {
    console.error('❌ Daily report failed:', error);
    throw error;
  }
}

/**
 * Run all workflow examples
 */
export async function runAllNotificationExamples() {
  console.log('🚀 AI008 Notification Generation - Complete Workflow Examples');
  console.log('============================================================');
  console.log('');

  try {
    await stockMonitoringWorkflow();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await weatherEmergencyWorkflow();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await cryptoTrendWorkflow();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await websiteDowntimeWorkflow();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await dailyReportWorkflow();
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('✅ All workflow examples completed successfully!');
    console.log('');
    console.log('🔗 Integration Points:');
    console.log('• Monitor evaluation triggers → AI008 notification generation');
    console.log('• User preferences → Personalized content and tone');
    console.log('• Monitor metadata → Rich context for explanations');
    console.log('• Historical data → Trend analysis and context');
    console.log('• Urgency detection → Appropriate escalation and actions');
    console.log('• Email service → Delivery via BE006 email system');

  } catch (error) {
    console.error('❌ Workflow examples failed:', error);
  }
}

// Export for testing
export const examples = {
  stockMonitoringWorkflow,
  weatherEmergencyWorkflow,
  cryptoTrendWorkflow,
  websiteDowntimeWorkflow,
  dailyReportWorkflow,
  runAllNotificationExamples
};