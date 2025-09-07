import { e as error, j as json } from './index-Djsj11qr.js';
import { J as JWTService } from './jwt-alvM1AqS.js';
import { db } from './connection-D27Xdyu3.js';
import { m as monitors, g as factHistory } from './users-CCLvGjXf.js';
import { and, eq, gte, desc } from 'drizzle-orm';
import 'jsonwebtoken';
import 'dotenv';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'drizzle-orm/pg-core';

const GET = async ({ params, url, cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(accessToken);
    const userId = payload.userId;
    const monitorId = params.id;
    if (!monitorId) {
      throw error(400, "Monitor ID is required");
    }
    const monitor = await db.select().from(monitors).where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId))).limit(1);
    if (monitor.length === 0) {
      throw error(404, "Monitor not found or access denied");
    }
    const monitorData = monitor[0];
    const timeRange = url.searchParams.get("range") || "24h";
    const now = /* @__PURE__ */ new Date();
    let startTime;
    switch (timeRange) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1e3);
        break;
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    }
    const historyData = await db.select({
      timestamp: factHistory.timestamp,
      value: factHistory.value,
      triggeredAlert: factHistory.triggeredAlert,
      changeAmount: factHistory.changeAmount,
      changePercentage: factHistory.changePercentage
    }).from(factHistory).where(
      and(
        eq(factHistory.monitorId, monitorId),
        gte(factHistory.timestamp, startTime)
      )
    ).orderBy(desc(factHistory.timestamp)).limit(20);
    const dataPoints = historyData.reverse().map((point) => ({
      timestamp: point.timestamp.toISOString(),
      value: point.value,
      triggered: point.triggeredAlert
    }));
    if (dataPoints.length === 0 && monitorData.currentValue !== null) {
      dataPoints.push({
        timestamp: (monitorData.lastChecked || monitorData.updatedAt).toISOString(),
        value: monitorData.currentValue,
        triggered: false
      });
    }
    const numericValues = dataPoints.map((point) => {
      if (typeof point.value === "number") return point.value;
      if (typeof point.value === "string" && !isNaN(parseFloat(point.value))) {
        return parseFloat(point.value);
      }
      return null;
    }).filter((val) => val !== null);
    let summary = {
      current: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : monitorData.currentValue,
      trend: "stable",
      changePercent: void 0,
      min: void 0,
      max: void 0
    };
    if (numericValues.length > 1) {
      summary.min = Math.min(...numericValues);
      summary.max = Math.max(...numericValues);
      const firstValue = numericValues[0];
      const lastValue = numericValues[numericValues.length - 1];
      const change = (lastValue - firstValue) / firstValue * 100;
      summary.changePercent = Math.round(change * 100) / 100;
      if (change > 1) {
        summary.trend = "up";
      } else if (change < -1) {
        summary.trend = "down";
      }
    }
    const response = {
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
        "Cache-Control": "public, max-age=300"
        // 5 minute cache
      }
    });
  } catch (err) {
    console.error("Mini-chart data endpoint error:", err);
    if (err?.status) {
      throw err;
    }
    return json(
      {
        success: false,
        error: "Failed to retrieve chart data"
      },
      { status: 500 }
    );
  }
};

export { GET };
//# sourceMappingURL=_server.ts-gTMNBrOr.js.map
