import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	let databaseConnected = false;
	
	try {
		// Test database connection
		await db.query('SELECT 1');
		databaseConnected = true;
	} catch (error) {
		console.error('Database connection error:', error);
	}
	
	return json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		database: databaseConnected,
		version: '0.1.0'
	});
};