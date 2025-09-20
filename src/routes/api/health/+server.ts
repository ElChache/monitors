// MonitorHub Health Check Endpoint
// Vercel deployment validation and monitoring

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import { config, validateConfig } from '$lib/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const startTime = Date.now();
	
	try {
		// Check configuration
		const configValidation = validateConfig();
		
		// Check database connection
		let dbStatus = 'disconnected';
		let dbLatency = 0;
		
		try {
			const dbStart = Date.now();
			await db.$queryRaw`SELECT 1 as test`;
			dbLatency = Date.now() - dbStart;
			dbStatus = 'connected';
		} catch (error) {
			console.error('Database health check failed:', error);
			dbStatus = 'error';
		}
		
		// Check AI service configuration
		const aiStatus = {
			anthropic: !!config.ai.anthropic.apiKey,
			openai: !!config.ai.openai.apiKey
		};
		
		const totalLatency = Date.now() - startTime;
		const isHealthy = dbStatus === 'connected' && configValidation.isValid;
		
		const healthData = {
			status: isHealthy ? 'healthy' : 'unhealthy',
			timestamp: new Date().toISOString(),
			version: '1.0.0-beta',
			environment: config.app.nodeEnv,
			latency: {
				total: totalLatency,
				database: dbLatency
			},
			services: {
				database: {
					status: dbStatus,
					latency: dbLatency
				},
				ai: aiStatus,
				config: {
					valid: configValidation.isValid,
					missing: configValidation.missingVars
				}
			}
		};
		
		return json(healthData, {
			status: isHealthy ? 200 : 503,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate'
			}
		});
		
	} catch (error) {
		console.error('Health check failed:', error);
		
		return json({
			status: 'error',
			timestamp: new Date().toISOString(),
			error: 'Internal health check failure',
			latency: Date.now() - startTime
		}, {
			status: 500,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate'
			}
		});
	}
};