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
    const timeRange = url.searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' | '90d' || '24h';
    const aggregation = url.searchParams.get('aggregation') as 'none' | 'hourly' | 'daily' || 'hourly';

    // Get chart data optimized for visualization
    const chartData = await HistoricalDataService.getChartData(monitorId, timeRange, aggregation);

    return json({
      success: true,
      monitorId,
      timeRange,
      aggregation,
      chartData
    });

  } catch (error) {
    console.error('Chart data error:', error);
    return json(
      { error: 'Failed to retrieve chart data' },
      { status: 500 }
    );
  }
}