// MonitorHub Database Connection
// Singleton Prisma client for database access

import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

// Global singleton for database connection
declare global {
	var __prisma: PrismaClient | undefined;
}

// Create Prisma client with appropriate configuration
export const db = globalThis.__prisma || new PrismaClient({
	log: dev ? ['query', 'error', 'warn'] : ['error'],
	errorFormat: 'pretty'
});

// In development, store client globally to prevent multiple instances
if (dev) {
	globalThis.__prisma = db;
}

// Helper function to disconnect from database (useful for cleanup)
export async function disconnectDatabase(): Promise<void> {
	await db.$disconnect();
}

// Export types for use in other modules
export type {
	User,
	Monitor,
	MonitorFact,
	MonitorLogic,
	MonitorEvaluation,
	MonitorAction,
	ActionExecution,
	MonitorTemplate,
	FactValue
} from '@prisma/client';