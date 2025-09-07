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
    const timeRange = url.searchParams.get("timeRange") || "24h";
    const aggregation = url.searchParams.get("aggregation") || "hourly";
    const chartData = await HistoricalDataService.getChartData(monitorId, timeRange, aggregation);
    return json({
      success: true,
      monitorId,
      timeRange,
      aggregation,
      chartData
    });
  } catch (error) {
    console.error("Chart data error:", error);
    return json(
      { error: "Failed to retrieve chart data" },
      { status: 500 }
    );
  }
}

export { GET };
//# sourceMappingURL=_server.ts-CZnoLI8e.js.map
