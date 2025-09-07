import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt.js';
import { db } from '$lib/db/connection.js';
import { monitors, factHistory, monitorEvaluations } from '$lib/db/schemas/monitors.js';
import { eq, and, desc, gte, sql, count, avg, min, max } from 'drizzle-orm';

interface InsightData {
  success: boolean;
  insights: {
    performance: {
      reliability: number; // Percentage uptime
      averageResponseTime: number; // ms
      successRate: number; // Percentage of successful evaluations
      totalEvaluations: number;
    };
    alerting: {
      totalAlerts: number;
      alertFrequency: string; // e.g., "2.3 alerts per day"
      lastAlert: string | null;
      alertPattern: {
        hourly: { [hour: string]: number };
        daily: { [day: string]: number };
      };
    };
    trends: {
      dataQuality: number; // Percentage of high-confidence data points
      changeFrequency: string; // e.g., "Changes 1.2 times per day"
      volatility: 'low' | 'medium' | 'high';
      trendDirection: 'increasing' | 'decreasing' | 'stable';
      predictedNextChange: string | null;
    };
    userFriendlyInsights: string[]; // Human-readable insights
  };
}

export const GET: RequestHandler = async ({ params, cookies }) => {
  try {
    // Authentication check
    const accessToken = cookies.get('access_token');
    if (!accessToken) {
      throw error(401, 'Authentication required');
    }

    const payload = JWTService.verifyAccessToken(accessToken);
    const userId = payload.userId;
    const monitorId = params.id;

    if (!monitorId) {
      throw error(400, 'Monitor ID is required');
    }

    // Verify monitor ownership
    const monitor = await db
      .select()
      .from(monitors)
      .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
      .limit(1);

    if (monitor.length === 0) {
      throw error(404, 'Monitor not found or access denied');
    }

    const monitorData = monitor[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Performance metrics
    const evaluationStats = await db
      .select({
        total: count(),
        avgProcessingTime: avg(monitorEvaluations.processingTimeMs),
        successfulEvaluations: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)::int`
      })
      .from(monitorEvaluations)
      .where(
        and(
          eq(monitorEvaluations.monitorId, monitorId),
          gte(monitorEvaluations.createdAt, thirtyDaysAgo)
        )
      );

    const evalData = evaluationStats[0];
    const successRate = evalData.total > 0 ? (evalData.successfulEvaluations / evalData.total) * 100 : 100;
    const reliability = successRate; // Simplified reliability metric

    // Alert statistics
    const alertStats = await db
      .select({
        totalAlerts: count(),
        lastAlert: max(factHistory.timestamp),
        alertsByHour: sql<string>`
          json_object_agg(
            EXTRACT(hour FROM timestamp)::text,
            COUNT(*)
          ) FILTER (WHERE triggered_alert = true)
        `,
        alertsByDay: sql<string>`
          json_object_agg(
            EXTRACT(dow FROM timestamp)::text,
            COUNT(*)
          ) FILTER (WHERE triggered_alert = true)
        `
      })
      .from(factHistory)
      .where(
        and(
          eq(factHistory.monitorId, monitorId),
          gte(factHistory.timestamp, thirtyDaysAgo)
        )
      );

    const alerts = alertStats[0];
    const totalAlerts = alerts.totalAlerts;
    const alertsPerDay = totalAlerts / 30;

    // Trend analysis
    const trendData = await db
      .select({
        value: factHistory.value,
        timestamp: factHistory.timestamp,
        changeAmount: factHistory.changeAmount,
        changePercentage: factHistory.changePercentage
      })
      .from(factHistory)
      .where(
        and(
          eq(factHistory.monitorId, monitorId),
          gte(factHistory.timestamp, thirtyDaysAgo)
        )
      )
      .orderBy(factHistory.timestamp);

    // Calculate volatility and trends
    let volatility: 'low' | 'medium' | 'high' = 'low';
    let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let changeFrequency = 0;

    if (trendData.length > 1) {
      const changes = trendData.filter(d => d.changeAmount !== null);
      changeFrequency = changes.length / 30; // changes per day

      if (changes.length > 0) {
        const changeAmounts = changes
          .map(d => Math.abs(parseFloat(d.changeAmount?.toString() || '0')))
          .filter(val => !isNaN(val));

        if (changeAmounts.length > 0) {
          const avgChange = changeAmounts.reduce((a, b) => a + b, 0) / changeAmounts.length;
          
          if (avgChange > 10) volatility = 'high';
          else if (avgChange > 5) volatility = 'medium';
        }
      }

      // Determine trend direction
      const recentData = trendData.slice(-7); // Last week
      if (recentData.length > 1) {
        const firstValue = parseFloat(recentData[0].value?.toString() || '0');
        const lastValue = parseFloat(recentData[recentData.length - 1].value?.toString() || '0');
        
        if (!isNaN(firstValue) && !isNaN(lastValue)) {
          const change = ((lastValue - firstValue) / firstValue) * 100;
          if (change > 2) trendDirection = 'increasing';
          else if (change < -2) trendDirection = 'decreasing';
        }
      }
    }

    // Generate user-friendly insights
    const insights: string[] = [];
    
    if (reliability > 95) {
      insights.push(`Your monitor is highly reliable with ${reliability.toFixed(1)}% successful evaluations.`);
    } else if (reliability < 80) {
      insights.push(`Monitor reliability could be improved. Currently at ${reliability.toFixed(1)}% success rate.`);
    }

    if (totalAlerts > 0) {
      insights.push(`Generated ${totalAlerts} alerts in the last 30 days (${alertsPerDay.toFixed(1)} per day on average).`);
    } else {
      insights.push("No alerts triggered in the last 30 days - your conditions may need adjustment.");
    }

    if (volatility === 'high') {
      insights.push("High volatility detected - this data source changes frequently.");
    } else if (volatility === 'low') {
      insights.push("Low volatility - this data source is relatively stable.");
    }

    if (trendDirection === 'increasing') {
      insights.push("Trending upward over the past week.");
    } else if (trendDirection === 'decreasing') {
      insights.push("Trending downward over the past week.");
    } else {
      insights.push("Values have remained relatively stable recently.");
    }

    if (changeFrequency > 5) {
      insights.push(`High activity detected with ${changeFrequency.toFixed(1)} changes per day.`);
    }

    const response: InsightData = {
      success: true,
      insights: {
        performance: {
          reliability: Math.round(reliability * 10) / 10,
          averageResponseTime: Math.round(parseFloat(evalData.avgProcessingTime?.toString() || '0')),
          successRate: Math.round(successRate * 10) / 10,
          totalEvaluations: evalData.total
        },
        alerting: {
          totalAlerts,
          alertFrequency: `${alertsPerDay.toFixed(1)} alerts per day`,
          lastAlert: alerts.lastAlert?.toISOString() || null,
          alertPattern: {
            hourly: alerts.alertsByHour ? JSON.parse(alerts.alertsByHour) : {},
            daily: alerts.alertsByDay ? JSON.parse(alerts.alertsByDay) : {}
          }
        },
        trends: {
          dataQuality: Math.round((trendData.length / Math.max(evalData.total, 1)) * 100 * 10) / 10,
          changeFrequency: `${changeFrequency.toFixed(1)} changes per day`,
          volatility,
          trendDirection,
          predictedNextChange: trendDirection !== 'stable' ? 'Within next 2-3 days based on current trend' : null
        },
        userFriendlyInsights: insights
      }
    };

    return json(response, {
      headers: {
        'Cache-Control': 'public, max-age=600' // 10 minute cache
      }
    });

  } catch (err) {
    console.error('Insights endpoint error:', err);
    
    if (err?.status) {
      throw err;
    }

    return json(
      {
        success: false,
        error: 'Failed to generate insights',
        insights: {
          performance: {
            reliability: 0,
            averageResponseTime: 0,
            successRate: 0,
            totalEvaluations: 0
          },
          alerting: {
            totalAlerts: 0,
            alertFrequency: '0 alerts per day',
            lastAlert: null,
            alertPattern: { hourly: {}, daily: {} }
          },
          trends: {
            dataQuality: 0,
            changeFrequency: '0 changes per day',
            volatility: 'low' as const,
            trendDirection: 'stable' as const,
            predictedNextChange: null
          },
          userFriendlyInsights: ['Unable to generate insights at this time. Please try again later.']
        }
      },
      { status: 500 }
    );
  }
};