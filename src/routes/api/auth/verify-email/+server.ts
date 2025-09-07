import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/server/auth/service.js';
import { z } from 'zod';

const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const validation = VerifyEmailSchema.safeParse(body);
    
    if (!validation.success) {
      return json(
        {
          success: false,
          error: 'Invalid verification token'
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;
    const result = await AuthService.verifyEmail(token);

    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    return json(
      {
        success: true,
        message: 'Email verified successfully!'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification endpoint error:', error);
    return json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
};