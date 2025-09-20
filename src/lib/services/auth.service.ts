// MonitorHub Authentication Service
// User registration and authentication logic

import { db } from '$lib/database';
import { isWhitelisted } from '$lib/config';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';

export interface RegisterUserData {
	email: string;
	password: string;
	name: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export class AuthService {
	/**
	 * Register a new user with email and password
	 */
	static async registerUser(data: RegisterUserData): Promise<User> {
		const { email, password, name } = data;

		// Validate email is in beta whitelist
		if (!isWhitelisted(email)) {
			throw new Error('Registration is currently limited to beta users');
		}

		// Check if user already exists
		const existingUser = await db.user.findUnique({
			where: { email }
		});

		if (existingUser) {
			throw new Error('User with this email already exists');
		}

		// Hash password
		const saltRounds = 12;
		const passwordHash = await bcrypt.hash(password, saltRounds);

		// Create user
		const user = await db.user.create({
			data: {
				email,
				passwordHash,
				name,
				isActive: true
			}
		});

		return user;
	}

	/**
	 * Verify user credentials
	 */
	static async verifyCredentials(credentials: LoginCredentials): Promise<User | null> {
		const { email, password } = credentials;

		const user = await db.user.findUnique({
			where: { email }
		});

		if (!user || !user.passwordHash) {
			return null;
		}

		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			return null;
		}

		return user;
	}

	/**
	 * Get user by ID
	 */
	static async getUserById(id: string): Promise<User | null> {
		return await db.user.findUnique({
			where: { id }
		});
	}

	/**
	 * Update user password
	 */
	static async updatePassword(userId: string, newPassword: string): Promise<void> {
		const saltRounds = 12;
		const passwordHash = await bcrypt.hash(newPassword, saltRounds);

		await db.user.update({
			where: { id: userId },
			data: { passwordHash }
		});
	}

	/**
	 * Check if user is admin
	 */
	static async isAdmin(userId: string): Promise<boolean> {
		const user = await db.user.findUnique({
			where: { id: userId },
			select: { isAdmin: true }
		});

		return user?.isAdmin || false;
	}

	/**
	 * Get user monitor count
	 */
	static async getUserMonitorCount(userId: string): Promise<number> {
		return await db.monitor.count({
			where: { userId }
		});
	}

	/**
	 * Check if user can create more monitors (beta limit: 5)
	 */
	static async canCreateMonitor(userId: string): Promise<boolean> {
		const count = await this.getUserMonitorCount(userId);
		return count < 5; // Beta limit
	}
}