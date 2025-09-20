// MonitorHub Admin User Management API
// GET /api/admin/users - List all users with filters and pagination
// POST /api/admin/users - Create admin user

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import { AuthService } from '$lib/services/auth.service';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';

const createAdminUserSchema = z.object({
	email: z.string().email('Invalid email address'),
	name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	isAdmin: z.boolean().default(true)
});

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Check admin privileges
		const isAdmin = await AuthService.isAdmin(session.user.id);
		if (!isAdmin) {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Parse query parameters
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const search = url.searchParams.get('search') || '';
		const status = url.searchParams.get('status'); // 'active', 'inactive', 'all'
		const role = url.searchParams.get('role'); // 'admin', 'user', 'all'
		const sortBy = url.searchParams.get('sortBy') || 'createdAt';
		const sortOrder = url.searchParams.get('sortOrder') || 'desc';

		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {};

		if (search) {
			where.OR = [
				{ email: { contains: search, mode: 'insensitive' } },
				{ name: { contains: search, mode: 'insensitive' } }
			];
		}

		if (status === 'active') {
			where.isActive = true;
		} else if (status === 'inactive') {
			where.isActive = false;
		}

		if (role === 'admin') {
			where.isAdmin = true;
		} else if (role === 'user') {
			where.isAdmin = false;
		}

		// Get users with pagination
		const [users, totalCount] = await Promise.all([
			db.user.findMany({
				where,
				select: {
					id: true,
					email: true,
					name: true,
					isActive: true,
					isAdmin: true,
					createdAt: true,
					updatedAt: true,
					_count: {
						select: {
							monitors: true
						}
					}
				},
				orderBy: { [sortBy]: sortOrder },
				skip,
				take: limit
			}),
			db.user.count({ where })
		]);

		const totalPages = Math.ceil(totalCount / limit);

		return json({
			success: true,
			data: {
				users,
				pagination: {
					page,
					limit,
					totalCount,
					totalPages,
					hasNext: page < totalPages,
					hasPrev: page > 1
				}
			}
		});

	} catch (error) {
		console.error('Admin users list error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Check admin privileges
		const isAdmin = await AuthService.isAdmin(session.user.id);
		if (!isAdmin) {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = createAdminUserSchema.parse(body);

		// Create admin user (bypass whitelist check for admin creation)
		const user = await db.user.create({
			data: {
				email: validatedData.email,
				name: validatedData.name,
				passwordHash: await bcrypt.hash(validatedData.password, 12),
				isAdmin: validatedData.isAdmin,
				isActive: true
			},
			select: {
				id: true,
				email: true,
				name: true,
				isActive: true,
				isAdmin: true,
				createdAt: true
			}
		});

		return json({
			success: true,
			data: user,
			message: 'Admin user created successfully'
		}, { status: 201 });

	} catch (error) {
		console.error('Create admin user error:', error);

		if (error instanceof z.ZodError) {
			return json({
				error: 'Validation failed',
				details: error.errors
			}, { status: 400 });
		}

		if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
			return json({
				error: 'User with this email already exists'
			}, { status: 409 });
		}

		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};