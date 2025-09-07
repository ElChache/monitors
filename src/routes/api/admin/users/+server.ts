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

    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || undefined;
    const role = url.searchParams.get('role') as 'user' | 'admin' | undefined;
    const status = url.searchParams.get('status') as 'active' | 'inactive' | undefined;
    const sortBy = url.searchParams.get('sortBy') as 'createdAt' | 'name' | 'email' | 'lastLoginAt' || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    const result = await AdminService.getUsers({
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder
    });

    return json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Admin users list error:', error);
    return json(
      { error: 'Failed to retrieve users' },
      { status: 500 }
    );
  }
}

export async function POST({ request }) {
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

    const { action, userId, ...data } = await request.json();

    switch (action) {
      case 'updateRole':
        await AdminService.updateUserRole(userId, data.isAdmin);
        return json({
          success: true,
          message: `User role updated to ${data.isAdmin ? 'admin' : 'user'}`
        });

      case 'updateStatus':
        await AdminService.updateUserStatus(userId, data.isActive);
        return json({
          success: true,
          message: `User ${data.isActive ? 'activated' : 'deactivated'}`
        });

      case 'deleteUser':
        await AdminService.deleteUser(userId);
        return json({
          success: true,
          message: 'User deleted successfully'
        });

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin user action error:', error);
    return json(
      { error: 'Failed to perform user action' },
      { status: 500 }
    );
  }
}