import { json } from '@sveltejs/kit';
import { UserAccountService } from '$lib/server/user/service';
import { AuthService } from '$lib/server/auth/service';

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

    const body = await request.json();
    const { confirmationText, password } = body;

    // Require explicit confirmation
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return json({ 
        error: 'Account deletion requires exact confirmation text: "DELETE MY ACCOUNT"' 
      }, { status: 400 });
    }

    // Verify password for security (if user has password auth)
    if (password) {
      try {
        // Get user password hash
        const { db } = await import('$lib/server/db');
        const { users } = await import('$lib/db/schemas/users');
        const { eq } = await import('drizzle-orm');

        const [userRecord] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id));

        if (userRecord?.passwordHash) {
          const { PasswordService } = await import('$lib/server/auth/password');
          const isPasswordValid = await PasswordService.verifyPassword(
            password,
            userRecord.passwordHash
          );

          if (!isPasswordValid) {
            return json({ error: 'Invalid password' }, { status: 401 });
          }
        }
      } catch (error) {
        console.error('Password verification error:', error);
        return json({ error: 'Password verification failed' }, { status: 500 });
      }
    }

    // Delete user account and all associated data
    await UserAccountService.deleteUserAccount(user.id);

    // Log account deletion for audit purposes
    console.log(`User account deleted: ${user.id} (${user.email}) at ${new Date().toISOString()}`);

    return json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete user account error:', error);
    return json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}