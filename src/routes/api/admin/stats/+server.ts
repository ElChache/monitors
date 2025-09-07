import { json } from '@sveltejs/kit';
import { AdminService } from '$lib/server/admin/service';
import { AuthService } from '$lib/server/auth/service';

export async function GET({ request }) {
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

    const stats = await AdminService.getSystemStats();

    return json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return json(
      { error: 'Failed to retrieve system statistics' },
      { status: 500 }
    );
  }
}