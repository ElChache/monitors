// MonitorHub Monitor Evaluation Cron Job
// Automated monitor evaluation for Vercel Cron

import { json } from '@sveltejs/kit';
import { BackgroundJobService } from '$lib/services/background.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	const startTime = Date.now();
	
	try {
		// Verify this is a cron request (Vercel adds special headers)
		const cronSecret = request.headers.get('authorization');
		const expectedSecret = process.env.CRON_SECRET;
		
		if (expectedSecret && cronSecret !== `Bearer ${expectedSecret}`) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		console.log('🔄 Cron job: Processing monitor evaluations...');
		
		// Process monitor evaluations using background service
		await BackgroundJobService.processQueueNow();
		
		// Get job statistics
		const stats = await BackgroundJobService.getJobStatistics();
		const queueStatus = BackgroundJobService.getQueueStatus();
		
		const executionTime = Date.now() - startTime;
		
		return json({
			success: true,
			timestamp: new Date().toISOString(),
			executionTimeMs: executionTime,
			statistics: stats,
			queue: queueStatus,
			message: 'Monitor evaluation cron job completed successfully'
		});
		
	} catch (error) {
		console.error('Cron job failed:', error);
		
		return json({
			success: false,
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : 'Unknown error',
			executionTimeMs: Date.now() - startTime
		}, { status: 500 });
	}
};