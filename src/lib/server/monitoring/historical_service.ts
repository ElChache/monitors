import { db } from '../db';
import { monitorEvaluations } from '../../db/schemas/monitors';
import { eq, and, gte, lte, desc, asc, count, avg, min, max, sql } from 'drizzle-orm';

export interface HistoricalDataPoint {
  timestamp: Date;
  value: any;
  triggered: boolean;
  processingTime: number;
  evaluationId: string;
}

export interface AggregatedDataPoint {
  timestamp: Date;
  count: number;
  avgValue: number | null;
  minValue: any;
  maxValue: any;
  triggeredCount: number;
  avgProcessingTime: number;
}

export interface HistoricalStats {
  totalEvaluations: number;
  totalTriggered: number;
  triggerRate: number;
  avgProcessingTime: number;
  minValue: any;
  maxValue: any;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface HistoricalDataOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
  aggregation?: 'none' | 'hourly' | 'daily' | 'weekly';
  includeStats?: boolean;
}

/**
 * Historical data service for monitor evaluation data
 */
export class HistoricalDataService {
  /**
   * Get historical data for a monitor
   */
  static async getMonitorHistory(
    monitorId: string,
    options: HistoricalDataOptions = {}
  ): Promise<{
    data: HistoricalDataPoint[] | AggregatedDataPoint[];
    stats?: HistoricalStats;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const {
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      sortOrder = 'desc',
      aggregation = 'none',
      includeStats = false
    } = options;

    try {
      // Build date range conditions
      const conditions = [eq(monitorEvaluations.monitorId, monitorId)];
      
      if (startDate) {
        conditions.push(gte(monitorEvaluations.evaluatedAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(monitorEvaluations.evaluatedAt, endDate));
      }

      // Get total count for pagination
      const [{ total }] = await db
        .select({ total: count() })
        .from(monitorEvaluations)
        .where(and(...conditions));

      let data: HistoricalDataPoint[] | AggregatedDataPoint[] = [];

      if (aggregation === 'none') {
        // Get raw historical data points
        const query = db
          .select({
            id: monitorEvaluations.id,
            timestamp: monitorEvaluations.evaluatedAt,
            currentValue: monitorEvaluations.currentValue,
            triggered: monitorEvaluations.triggered,
            processingTime: monitorEvaluations.processingTime,
          })
          .from(monitorEvaluations)
          .where(and(...conditions))
          .limit(limit)
          .offset(offset);

        if (sortOrder === 'desc') {
          query.orderBy(desc(monitorEvaluations.evaluatedAt));
        } else {
          query.orderBy(asc(monitorEvaluations.evaluatedAt));
        }

        const results = await query;

        data = results.map(row => ({
          timestamp: row.timestamp,
          value: row.currentValue,
          triggered: row.triggered,
          processingTime: row.processingTime || 0,
          evaluationId: row.id,
        }));

      } else {
        // Get aggregated data
        data = await this.getAggregatedData(monitorId, aggregation, conditions, sortOrder);
      }

      // Calculate statistics if requested
      let stats: HistoricalStats | undefined;
      if (includeStats) {
        stats = await this.calculateStats(monitorId, conditions);
      }

      return {
        data,
        stats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };

    } catch (error) {
      console.error('Historical data retrieval error:', error);
      throw new Error('Failed to retrieve historical data');
    }
  }

  /**
   * Get aggregated historical data
   */
  private static async getAggregatedData(
    monitorId: string,
    aggregation: 'hourly' | 'daily' | 'weekly',
    conditions: any[],
    sortOrder: 'asc' | 'desc'
  ): Promise<AggregatedDataPoint[]> {
    let dateFormat: string;
    let interval: string;

    switch (aggregation) {
      case 'hourly':
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        interval = '1 hour';
        break;
      case 'daily':
        dateFormat = 'YYYY-MM-DD 00:00:00';
        interval = '1 day';
        break;
      case 'weekly':
        dateFormat = 'YYYY-"W"IW';
        interval = '1 week';
        break;
      default:
        throw new Error('Invalid aggregation type');
    }

    const query = db
      .select({
        timestamp: sql<Date>`date_trunc(${interval}, ${monitorEvaluations.evaluatedAt})`.as('timestamp'),
        count: count().as('count'),
        avgProcessingTime: avg(monitorEvaluations.processingTime).as('avgProcessingTime'),
        triggeredCount: sql<number>`SUM(CASE WHEN ${monitorEvaluations.triggered} THEN 1 ELSE 0 END)`.as('triggeredCount'),
        // Note: min/max on currentValue would need proper handling based on data type
        minValue: sql<any>`MIN(${monitorEvaluations.currentValue})`.as('minValue'),
        maxValue: sql<any>`MAX(${monitorEvaluations.currentValue})`.as('maxValue'),
        avgValue: sql<number>`AVG(CASE WHEN ${monitorEvaluations.currentValue}::text ~ '^[0-9.]+$' THEN ${monitorEvaluations.currentValue}::numeric ELSE NULL END)`.as('avgValue'),
      })
      .from(monitorEvaluations)
      .where(and(...conditions))
      .groupBy(sql`date_trunc(${interval}, ${monitorEvaluations.evaluatedAt})`);

    if (sortOrder === 'desc') {
      query.orderBy(desc(sql`date_trunc(${interval}, ${monitorEvaluations.evaluatedAt})`));
    } else {
      query.orderBy(asc(sql`date_trunc(${interval}, ${monitorEvaluations.evaluatedAt})`));
    }

    const results = await query;

    return results.map(row => ({
      timestamp: row.timestamp,
      count: row.count,
      avgValue: row.avgValue,
      minValue: row.minValue,
      maxValue: row.maxValue,
      triggeredCount: row.triggeredCount,
      avgProcessingTime: row.avgProcessingTime || 0,
    }));
  }

  /**
   * Calculate historical statistics
   */
  private static async calculateStats(
    monitorId: string,
    conditions: any[]
  ): Promise<HistoricalStats> {
    const [statsResult] = await db
      .select({
        totalEvaluations: count().as('totalEvaluations'),
        totalTriggered: sql<number>`SUM(CASE WHEN ${monitorEvaluations.triggered} THEN 1 ELSE 0 END)`.as('totalTriggered'),
        avgProcessingTime: avg(monitorEvaluations.processingTime).as('avgProcessingTime'),
        minValue: sql<any>`MIN(${monitorEvaluations.currentValue})`.as('minValue'),
        maxValue: sql<any>`MAX(${monitorEvaluations.currentValue})`.as('maxValue'),
        minDate: sql<Date>`MIN(${monitorEvaluations.evaluatedAt})`.as('minDate'),
        maxDate: sql<Date>`MAX(${monitorEvaluations.evaluatedAt})`.as('maxDate'),
      })
      .from(monitorEvaluations)
      .where(and(...conditions));

    const triggerRate = statsResult.totalEvaluations > 0 
      ? (statsResult.totalTriggered / statsResult.totalEvaluations) * 100 
      : 0;

    return {
      totalEvaluations: statsResult.totalEvaluations,
      totalTriggered: statsResult.totalTriggered,
      triggerRate: Math.round(triggerRate * 100) / 100,
      avgProcessingTime: statsResult.avgProcessingTime || 0,
      minValue: statsResult.minValue,
      maxValue: statsResult.maxValue,
      dateRange: {
        start: statsResult.minDate || new Date(),
        end: statsResult.maxDate || new Date(),
      },
    };
  }

  /**
   * Export historical data to CSV format
   */
  static async exportToCSV(
    monitorId: string,
    options: HistoricalDataOptions = {}
  ): Promise<string> {
    const { data } = await this.getMonitorHistory(monitorId, {
      ...options,
      limit: 10000, // Large limit for export
      aggregation: 'none' // Always export raw data
    });

    if (!Array.isArray(data) || data.length === 0) {
      return 'timestamp,value,triggered,processingTime\n';
    }

    const headers = 'timestamp,value,triggered,processingTime,evaluationId\n';
    const rows = (data as HistoricalDataPoint[]).map(point => {
      const timestamp = point.timestamp.toISOString();
      const value = typeof point.value === 'object' ? JSON.stringify(point.value) : point.value;
      const triggered = point.triggered ? 'true' : 'false';
      const processingTime = point.processingTime;
      const evaluationId = point.evaluationId;
      
      return `${timestamp},"${value}",${triggered},${processingTime},${evaluationId}`;
    }).join('\n');

    return headers + rows;
  }

  /**
   * Export historical data to JSON format
   */
  static async exportToJSON(
    monitorId: string,
    options: HistoricalDataOptions = {}
  ): Promise<object> {
    const result = await this.getMonitorHistory(monitorId, {
      ...options,
      limit: 10000, // Large limit for export
      includeStats: true
    });

    return {
      monitorId,
      exportedAt: new Date().toISOString(),
      options,
      ...result
    };
  }

  /**
   * Get data for chart visualization
   */
  static async getChartData(
    monitorId: string,
    timeRange: '1h' | '24h' | '7d' | '30d' | '90d' = '24h',
    aggregation: 'none' | 'hourly' | 'daily' = 'hourly'
  ): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  }> {
    const now = new Date();
    let startDate: Date;
    let chartAggregation = aggregation;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        chartAggregation = 'none';
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        chartAggregation = 'hourly';
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        chartAggregation = 'daily';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        chartAggregation = 'daily';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        chartAggregation = 'weekly';
        break;
    }

    const { data } = await this.getMonitorHistory(monitorId, {
      startDate,
      endDate: now,
      aggregation: chartAggregation,
      sortOrder: 'asc',
      limit: 1000
    });

    if (chartAggregation === 'none') {
      const points = data as HistoricalDataPoint[];
      return {
        labels: points.map(p => p.timestamp.toISOString()),
        datasets: [
          {
            label: 'Triggered',
            data: points.map(p => p.triggered ? 1 : 0),
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
          },
          {
            label: 'Processing Time (ms)',
            data: points.map(p => p.processingTime),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
          }
        ]
      };
    } else {
      const aggregatedPoints = data as AggregatedDataPoint[];
      return {
        labels: aggregatedPoints.map(p => p.timestamp.toISOString()),
        datasets: [
          {
            label: 'Evaluation Count',
            data: aggregatedPoints.map(p => p.count),
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderColor: 'rgb(34, 197, 94)',
          },
          {
            label: 'Triggered Count',
            data: aggregatedPoints.map(p => p.triggeredCount),
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
          },
          {
            label: 'Avg Processing Time (ms)',
            data: aggregatedPoints.map(p => p.avgProcessingTime),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
          }
        ]
      };
    }
  }
}