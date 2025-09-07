import { json } from '@sveltejs/kit';
import { AdminService } from '$lib/server/admin/service';
import { AuthService } from '$lib/server/auth/service';

export async function GET({ request, url }) {
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

    // Check admin privileges
    const isAdmin = await AdminService.isAdmin(user.id);
    if (!isAdmin) {
      return json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const limit = parseInt(url.searchParams.get('limit') || '50');
    const activity = await AdminService.getActivityFeed(limit);

    return json({
      success: true,
      data: {
        activity,
        total: activity.length
      }
    });

  } catch (error) {
    console.error('Admin activity feed error:', error);
    return json(
      { error: 'Failed to retrieve activity feed' },
      { status: 500 }
    );
  }
}