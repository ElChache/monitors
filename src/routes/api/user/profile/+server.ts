import { json } from '@sveltejs/kit';
import { UserAccountService } from '$lib/server/user/service';
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

    const profile = await UserAccountService.getUserProfile(user.id);

    return json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return json(
      { error: 'Failed to retrieve user profile' },
      { status: 500 }
    );
  }
}

export async function PUT({ request }) {
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

    const updates = await request.json();

    // Validate updates
    const allowedFields = ['name', 'email'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Validate email format if provided
    if (filteredUpdates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(filteredUpdates.email)) {
        return json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    // Validate name if provided
    if (filteredUpdates.name) {
      if (typeof filteredUpdates.name !== 'string' || filteredUpdates.name.trim().length < 1) {
        return json({ error: 'Name must be a non-empty string' }, { status: 400 });
      }
      filteredUpdates.name = filteredUpdates.name.trim();
    }

    await UserAccountService.updateUserProfile(user.id, filteredUpdates);

    return json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}