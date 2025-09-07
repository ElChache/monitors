import { json } from '@sveltejs/kit';
import { HistoricalDataService } from '$lib/server/monitoring/historical_service';
import { AuthService } from '$lib/server/auth/service';
import { MonitorService } from '$lib/server/monitoring';

export async function GET({ params, request, url }) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await AuthService.getCurrentUser(token);
    if (!user) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const monitorId = params.id;
    if (!monitorId) {
      return json({ error: 'Monitor ID required' }, { status: 400 });
    }

    // Verify user owns this monitor
    const monitor = await MonitorService.getMonitor(monitorId, user.id);
    if (!monitor) {
      return json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Parse query parameters
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
    const aggregation = url.searchParams.get('aggregation') as 'none' | 'hourly' | 'daily' | 'weekly' || 'none';
    const includeStats = url.searchParams.get('includeStats') === 'true';
    const format = url.searchParams.get('format') || 'json';

    // Parse dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return json({ error: 'Invalid start date format' }, { status: 400 });
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return json({ error: 'Invalid end date format' }, { status: 400 });
      }
    }

    // Validate parameters
    if (limit > 10000) {
      return json({ error: 'Limit cannot exceed 10000' }, { status: 400 });
    }

    if (startDate && endDate && startDate > endDate) {
      return json({ error: 'Start date cannot be after end date' }, { status: 400 });
    }

    // Handle export formats
    if (format === 'csv') {
      const csvData = await HistoricalDataService.exportToCSV(monitorId, {
        startDate,
        endDate,
        sortOrder
      });

      return new Response(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="monitor-${monitorId}-history.csv"`
        }
      });
    }

    if (format === 'json-export') {
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
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="monitor-${monitorId}-export.json"`
        }
      });
    }

    // Get historical data
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
    console.error('Historical data error:', error);
    return json(
      { error: 'Failed to retrieve historical data' },
      { status: 500 }
    );
  }
}