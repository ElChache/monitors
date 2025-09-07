import { j as json } from './index-Djsj11qr.js';
import { H as HistoricalDataService } from './historical_service-CeqSZnBH.js';
import { A as AuthService } from './service2-D_Iyu9gC.js';
import './db-whCnGq-7.js';
import './users-CCLvGjXf.js';
import 'puppeteer';
import './service4-B-hvY16X.js';
import './evaluation_service-CE7LdKAb.js';
import { M as MonitorService } from './monitor_service-TdkLdvPq.js';
import 'drizzle-orm';
import './connection-D27Xdyu3.js';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'dotenv';
import 'drizzle-orm/pg-core';
import './jwt-alvM1AqS.js';
import 'jsonwebtoken';
import '@node-rs/bcrypt';
import 'zod';
import '@aws-sdk/client-ses';
import './templates-C2bOMWsP.js';

async function GET({ params, request, url }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const user = await AuthService.getCurrentUser(token);
    if (!user) {
      return json({ error: "Invalid token" }, { status: 401 });
    }
    const monitorId = params.id;
    if (!monitorId) {
      return json({ error: "Monitor ID required" }, { status: 400 });
    }
    const monitor = await MonitorService.getMonitor(monitorId, user.id);
    if (!monitor) {
      return json({ error: "Monitor not found" }, { status: 404 });
    }
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const aggregation = url.searchParams.get("aggregation") || "none";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const format = url.searchParams.get("format") || "json";
    let startDate;
    let endDate;
    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return json({ error: "Invalid start date format" }, { status: 400 });
      }
    }
    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return json({ error: "Invalid end date format" }, { status: 400 });
      }
    }
    if (limit > 1e4) {
      return json({ error: "Limit cannot exceed 10000" }, { status: 400 });
    }
    if (startDate && endDate && startDate > endDate) {
      return json({ error: "Start date cannot be after end date" }, { status: 400 });
    }
    if (format === "csv") {
      const csvData = await HistoricalDataService.exportToCSV(monitorId, {
        startDate,
        endDate,
        sortOrder
      });
      return new Response(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="monitor-${monitorId}-history.csv"`
        }
      });
    }
    if (format === "json-export") {
      const exportData = await HistoricalDataService.exportToJSON(monitorId, {
        startDate,
        endDate,
        limit,
        offset,
        sortOrder,
        aggregation,
        includeStats: true
      });
      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="monitor-${monitorId}-export.json"`
        }
      });
    }
    const result = await HistoricalDataService.getMonitorHistory(monitorId, {
      startDate,
      endDate,
      limit,
      offset,
      sortOrder,
      aggregation,
      includeStats
    });
    return json({
      success: true,
      monitorId,
      options: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        limit,
        offset,
        sortOrder,
        aggregation,
        includeStats
      },
      ...result
    });
  } catch (error) {
    console.error("Historical data error:", error);
    return json(
      { error: "Failed to retrieve historical data" },
      { status: 500 }
    );
  }
}

export { GET };
//# sourceMappingURL=_server.ts-D8numEWm.js.map
