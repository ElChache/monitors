// MonitorHub User Registration API
// Handles new user registration with email/password

import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/services/auth.service';
import { EmailService } from '$lib/services/email.service';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const RegisterSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	name: z.string().min(1, 'Name is required').max(255, 'Name too long')
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		
		// Validate input
		const { email, password, name } = RegisterSchema.parse(body);

		// Register user
		const user = await AuthService.registerUser({
			email,
			password,
			name
		});

		// Send welcome email (async, don't wait for completion)
		EmailService.sendAuthenticationEmail('welcome', user).catch(error => {
			console.error('Failed to send welcome email:', error);
			// Don't fail registration if email fails
		});

		// Return success (don't return sensitive data)
		return json({
			success: true,
			data: {
				id: user.id,
				email: user.email,
				name: user.name,
				createdAt: user.createdAt
			}
		}, { status: 201 });

	} catch (error) {
		console.error('Registration error:', error);

		if (error instanceof z.ZodError) {
			return json({
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Invalid input data',
					details: error.issues
				}
			}, { status: 400 });
		}

		if (error instanceof Error) {
			return json({
				success: false,
				error: {
					code: 'REGISTRATION_FAILED',
					message: error.message
				}
			}, { status: 400 });
		}

		return json({
			success: false,
			error: {
				code: 'INTERNAL_ERROR',
				message: 'Registration failed'
			}
		}, { status: 500 });
	}
};