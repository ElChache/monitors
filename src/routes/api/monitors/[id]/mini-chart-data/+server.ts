import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt.js';
import { db } from '$lib/db/connection.js';
import { monitors, factHistory } from '$lib/db/schemas/monitors.js';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

interface MiniChartDataPoint {
  timestamp: string;
  value: number | string | boolean;
  triggered: boolean;
}

interface MiniChartResponse {
  success: boolean;
  data: {
    timeRange: string;
    dataPoints: MiniChartDataPoint[];
    summary: {
      current: any;
      min?: number;
      max?: number;
      trend: 'up' | 'down' | 'stable';
      changePercent?: number;
    };
    lastUpdate: string;
  };
}

export const GET: RequestHandler = async ({ params, url, cookies }) => {
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

    // Get time range from query params (default to 24h)
    const timeRange = url.searchParams.get('range') || '24h';
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get historical data points
    const historyData = await db
      .select({
        timestamp: factHistory.timestamp,
        value: factHistory.value,
        triggeredAlert: factHistory.triggeredAlert,
        changeAmount: factHistory.changeAmount,
        changePercentage: factHistory.changePercentage
      })
      .from(factHistory)
      .where(
        and(
          eq(factHistory.monitorId, monitorId),
          gte(factHistory.timestamp, startTime)
        )
      )
      .orderBy(desc(factHistory.timestamp))
      .limit(20); // Limit for mini-chart optimization

    // Process data points for chart display
    const dataPoints: MiniChartDataPoint[] = historyData.reverse().map(point => ({
      timestamp: point.timestamp.toISOString(),
      value: point.value as any,
      triggered: point.triggeredAlert
    }));

    // If no historical data, use current value
    if (dataPoints.length === 0 && monitorData.currentValue !== null) {
      dataPoints.push({
        timestamp: (monitorData.lastChecked || monitorData.updatedAt).toISOString(),
        value: monitorData.currentValue as any,
        triggered: false
      });
    }

    // Calculate summary statistics
    const numericValues = dataPoints
      .map(point => {
        if (typeof point.value === 'number') return point.value;
        if (typeof point.value === 'string' && !isNaN(parseFloat(point.value))) {
          return parseFloat(point.value);
        }
        return null;
      })
      .filter(val => val !== null) as number[];

    let summary = {
      current: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : monitorData.currentValue,
      trend: 'stable' as 'up' | 'down' | 'stable',
      changePercent: undefined as number | undefined,
      min: undefined as number | undefined,
      max: undefined as number | undefined,
    };

    if (numericValues.length > 1) {
      summary.min = Math.min(...numericValues);
      summary.max = Math.max(...numericValues);
      
      // Calculate trend based on first and last values
      const firstValue = numericValues[0];
      const lastValue = numericValues[numericValues.length - 1];
      const change = ((lastValue - firstValue) / firstValue) * 100;
      
      summary.changePercent = Math.round(change * 100) / 100;
      
      if (change > 1) {
        summary.trend = 'up';
      } else if (change < -1) {
        summary.trend = 'down';
      }
    }

    const response: MiniChartResponse = {
      success: true,
      data: {
        timeRange,
        dataPoints,
        summary,
        lastUpdate: (monitorData.lastChecked || monitorData.updatedAt).toISOString()
      }
    };

    return json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      }
    });

  } catch (err) {
    console.error('Mini-chart data endpoint error:', err);
    
    if (err?.status) {
      throw err;
    }

    return json(
      {
        success: false,
        error: 'Failed to retrieve chart data'
      },
      { status: 500 }
    );
  }
};