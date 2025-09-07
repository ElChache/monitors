import { db } from "./db.js";
import { f as monitorEvaluations } from "./users.js";
import { eq, gte, lte, count, and, desc, asc, avg, sql } from "drizzle-orm";
class HistoricalDataService {
  /**
   * Get historical data for a monitor
   */
  static async getMonitorHistory(monitorId, options = {}) {
    const {
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      sortOrder = "desc",
      aggregation = "none",
      includeStats = false
    } = options;
    try {
      const conditions = [eq(monitorEvaluations.monitorId, monitorId)];
      if (startDate) {
        conditions.push(gte(monitorEvaluations.evaluatedAt, startDate));
      }
      if (endDate) {
        conditions.push(lte(monitorEvaluations.evaluatedAt, endDate));
      }
      const [{ total }] = await db.select({ total: count() }).from(monitorEvaluations).where(and(...conditions));
      let data = [];
      if (aggregation === "none") {
        const query = db.select({
          id: monitorEvaluations.id,
          timestamp: monitorEvaluations.evaluatedAt,
          currentValue: monitorEvaluations.currentValue,
          triggered: monitorEvaluations.triggered,
          processingTime: monitorEvaluations.processingTime
        }).from(monitorEvaluations).where(and(...conditions)).limit(limit).offset(offset);
        if (sortOrder === "desc") {
          query.orderBy(desc(monitorEvaluations.evaluatedAt));
        } else {
          query.orderBy(asc(monitorEvaluations.evaluatedAt));
        }
        const results = await query;
        data = results.map((row) => ({
          timestamp: row.timestamp,
          value: row.currentValue,
          triggered: row.triggered,
          processingTime: row.processingTime || 0,
          evaluationId: row.id
        }));
      } else {
        data = await this.getAggregatedData(monitorId, aggregation, conditions, sortOrder);
      }
      let stats;
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
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      console.error("Historical data retrieval error:", error);
      throw new Error("Failed to retrieve historical data");
    }
  }
  /**
   * Get aggregated historical data
   */
  static async getAggregatedData(monitorId, aggregation, conditions, sortOrder) {
    let interval;
    switch (aggregation) {
      case "hourly":
        interval = "1 hour";
        break;
      case "daily":
        interval = "1 day";
        break;
      case "weekly":
        interval = "1 week";
        break;
      default:
        throw new Error("Invalid aggregation type");
    }
    const query = db.select({
      timestamp: sql`date_trunc(${interval}, ${monitorEvaluations.evaluatedAt})`.as("timestamp"),
      count: count().as("count"),
      avgProcessingTime: avg(monitorEvaluations.processingTime).as("avgProcessingTime"),
      triggeredCount: sql`SUM(CASE WHEN ${monitorEvaluations.triggered} THEN 1 ELSE 0 END)`.as("triggeredCount"),
      // Note: min/max on currentValue would need proper handling based on data type
      minValue: sql`MIN(${monitorEvaluations.currentValue})`.as("minValue"),
      maxValue: sql`MAX(${monitorEvaluations.currentValue})`.as("maxValue"),
      avgValue: sql`AVG(CASE WHEN ${monitorEvaluations.currentValue}::text ~ '^[0-9.]+$' THEN ${monitorEvaluations.currentValue}::numeric ELSE NULL END)`.as("avgValue")
    }).from(monitorEvaluations).where(and(...conditions)).groupBy(sql`date_trunc(${interval}, ${monitorEvaluations.evaluatedAt})`);
    if (sortOrder === "desc") {
      query.orderBy(desc(sql`date_trunc(${interval}, ${monitorEvaluations.evaluatedAt})`));
    } else {
      query.orderBy(asc(sql`date_trunc(${interval}, ${monitorEvaluations.evaluatedAt})`));
    }
    const results = await query;
    return results.map((row) => ({
      timestamp: row.timestamp,
      count: row.count,
      avgValue: row.avgValue,
      minValue: row.minValue,
      maxValue: row.maxValue,
      triggeredCount: row.triggeredCount,
      avgProcessingTime: row.avgProcessingTime || 0
    }));
  }
  /**
   * Calculate historical statistics
   */
  static async calculateStats(monitorId, conditions) {
    const [statsResult] = await db.select({
      totalEvaluations: count().as("totalEvaluations"),
      totalTriggered: sql`SUM(CASE WHEN ${monitorEvaluations.triggered} THEN 1 ELSE 0 END)`.as("totalTriggered"),
      avgProcessingTime: avg(monitorEvaluations.processingTime).as("avgProcessingTime"),
      minValue: sql`MIN(${monitorEvaluations.currentValue})`.as("minValue"),
      maxValue: sql`MAX(${monitorEvaluations.currentValue})`.as("maxValue"),
      minDate: sql`MIN(${monitorEvaluations.evaluatedAt})`.as("minDate"),
      maxDate: sql`MAX(${monitorEvaluations.evaluatedAt})`.as("maxDate")
    }).from(monitorEvaluations).where(and(...conditions));
    const triggerRate = statsResult.totalEvaluations > 0 ? statsResult.totalTriggered / statsResult.totalEvaluations * 100 : 0;
    return {
      totalEvaluations: statsResult.totalEvaluations,
      totalTriggered: statsResult.totalTriggered,
      triggerRate: Math.round(triggerRate * 100) / 100,
      avgProcessingTime: statsResult.avgProcessingTime || 0,
      minValue: statsResult.minValue,
      maxValue: statsResult.maxValue,
      dateRange: {
        start: statsResult.minDate || /* @__PURE__ */ new Date(),
        end: statsResult.maxDate || /* @__PURE__ */ new Date()
      }
    };
  }
  /**
   * Export historical data to CSV format
   */
  static async exportToCSV(monitorId, options = {}) {
    const { data } = await this.getMonitorHistory(monitorId, {
      ...options,
      limit: 1e4,
      // Large limit for export
      aggregation: "none"
      // Always export raw data
    });
    if (!Array.isArray(data) || data.length === 0) {
      return "timestamp,value,triggered,processingTime\n";
    }
    const headers = "timestamp,value,triggered,processingTime,evaluationId\n";
    const rows = data.map((point) => {
      const timestamp = point.timestamp.toISOString();
      const value = typeof point.value === "object" ? JSON.stringify(point.value) : point.value;
      const triggered = point.triggered ? "true" : "false";
      const processingTime = point.processingTime;
      const evaluationId = point.evaluationId;
      return `${timestamp},"${value}",${triggered},${processingTime},${evaluationId}`;
    }).join("\n");
    return headers + rows;
  }
  /**
   * Export historical data to JSON format
   */
  static async exportToJSON(monitorId, options = {}) {
    const result = await this.getMonitorHistory(monitorId, {
      ...options,
      limit: 1e4,
      // Large limit for export
      includeStats: true
    });
    return {
      monitorId,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      options,
      ...result
    };
  }
  /**
   * Get data for chart visualization
   */
  static async getChartData(monitorId, timeRange = "24h", aggregation = "hourly") {
    const now = /* @__PURE__ */ new Date();
    let startDate;
    let chartAggregation = aggregation;
    switch (timeRange) {
      case "1h":
        startDate = new Date(now.getTime() - 60 * 60 * 1e3);
        chartAggregation = "none";
        break;
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
        chartAggregation = "hourly";
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        chartAggregation = "daily";
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
        chartAggregation = "daily";
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
        chartAggregation = "weekly";
        break;
    }
    const { data } = await this.getMonitorHistory(monitorId, {
      startDate,
      endDate: now,
      aggregation: chartAggregation,
      sortOrder: "asc",
      limit: 1e3
    });
    if (chartAggregation === "none") {
      const points = data;
      return {
        labels: points.map((p) => p.timestamp.toISOString()),
        datasets: [
          {
            label: "Triggered",
            data: points.map((p) => p.triggered ? 1 : 0),
            backgroundColor: "rgba(239, 68, 68, 0.5)",
            borderColor: "rgb(239, 68, 68)"
          },
          {
            label: "Processing Time (ms)",
            data: points.map((p) => p.processingTime),
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)"
          }
        ]
      };
    } else {
      const aggregatedPoints = data;
      return {
        labels: aggregatedPoints.map((p) => p.timestamp.toISOString()),
        datasets: [
          {
            label: "Evaluation Count",
            data: aggregatedPoints.map((p) => p.count),
            backgroundColor: "rgba(34, 197, 94, 0.5)",
            borderColor: "rgb(34, 197, 94)"
          },
          {
            label: "Triggered Count",
            data: aggregatedPoints.map((p) => p.triggeredCount),
            backgroundColor: "rgba(239, 68, 68, 0.5)",
            borderColor: "rgb(239, 68, 68)"
          },
          {
            label: "Avg Processing Time (ms)",
            data: aggregatedPoints.map((p) => p.avgProcessingTime),
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)"
          }
        ]
      };
    }
  }
}
export {
  HistoricalDataService as H
};
