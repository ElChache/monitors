// MonitorHub Performance Monitoring Middleware
// Automatic performance tracking for API endpoints and database operations

import { MonitoringService } from '$lib/services/monitoring.service';
import type { Handle } from '@sveltejs/kit';

export interface PerformanceContext {
	startTime: number;
	endpoint: string;
	userId?: string;
}

/**
 * SvelteKit handle function for automatic API performance monitoring
 */
export const performanceHandle: Handle = async ({ event, resolve }) => {
	const startTime = Date.now();
	const endpoint = `${event.request.method} ${event.url.pathname}`;
	
	// Skip monitoring for static assets and non-API routes
	if (event.url.pathname.startsWith('/api/')) {
		try {
			const response = await resolve(event);
			const responseTime = Date.now() - startTime;
			
			// Get user ID from session if available
			const session = await event.locals.auth?.();
			const userId = session?.user?.id;
			
			// Record performance metric
			MonitoringService.recordMetric({
				metricType: 'api_response_time',
				value: responseTime,
				unit: 'milliseconds',
				endpoint,
				userId,
				metadata: {
					method: event.request.method,
					pathname: event.url.pathname,
					status: response.status,
					success: response.status < 400
				}
			});

			// Track user events for analytics
			if (userId) {
				let eventType: string | undefined;
				
				// Determine event type based on endpoint
				if (endpoint.includes('/monitors') && event.request.method === 'POST') {
					eventType = 'monitor_created';
				} else if (endpoint.includes('/monitors') && event.request.method === 'GET') {
					eventType = 'dashboard_view';
				} else if (endpoint.includes('/auth/login')) {
					eventType = 'login';
				} else if (endpoint.includes('/templates')) {
					eventType = 'template_used';
				}

				if (eventType) {
					MonitoringService.trackUserEvent({
						userId,
						eventType: eventType as any,
						eventData: {
							endpoint,
							method: event.request.method,
							responseTime,
							status: response.status
						}
					});
				}
			}

			return response;
		} catch (error) {
			const responseTime = Date.now() - startTime;
			
			// Record error metric
			MonitoringService.recordMetric({
				metricType: 'api_response_time',
				value: responseTime,
				unit: 'milliseconds',
				endpoint,
				metadata: {
					method: event.request.method,
					pathname: event.url.pathname,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error'
				}
			});

			// Create error alert for critical endpoints
			if (endpoint.includes('/monitors') || endpoint.includes('/admin')) {
				MonitoringService.createAlert({
					alertType: 'error',
					severity: 'high',
					title: `API Error on ${endpoint}`,
					description: `Error occurred on ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`,
					metadata: {
						endpoint,
						error: error instanceof Error ? error.message : 'Unknown error',
						responseTime
					}
				});
			}

			throw error;
		}
	}

	return resolve(event);
};

/**
 * Database operation wrapper for performance monitoring
 */
export function withDatabaseMonitoring<T>(
	operation: () => Promise<T>,
	queryType: string,
	metadata: Record<string, any> = {}
): Promise<T> {
	const startTime = Date.now();
	
	return operation().then(
		(result) => {
			const queryTime = Date.now() - startTime;
			
			MonitoringService.recordDatabaseMetric(queryTime, queryType, {
				...metadata,
				success: true
			});
			
			return result;
		},
		(error) => {
			const queryTime = Date.now() - startTime;
			
			MonitoringService.recordDatabaseMetric(queryTime, queryType, {
				...metadata,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			// Create alert for slow or failed database operations
			if (queryTime > 5000 || error) {
				MonitoringService.createAlert({
					alertType: 'performance',
					severity: queryTime > 10000 ? 'critical' : 'high',
					title: `Database Performance Issue`,
					description: `${queryType} query took ${queryTime}ms${error ? ` and failed: ${error instanceof Error ? error.message : 'Unknown error'}` : ''}`,
					metadata: {
						queryType,
						queryTime,
						error: error instanceof Error ? error.message : undefined,
						...metadata
					}
				});
			}
			
			throw error;
		}
	);
}

/**
 * Monitor evaluation wrapper for performance tracking
 */
export function withEvaluationMonitoring<T>(
	operation: () => Promise<T>,
	monitorId: string,
	metadata: Record<string, any> = {}
): Promise<T> {
	const startTime = Date.now();
	
	return operation().then(
		(result) => {
			const evaluationTime = Date.now() - startTime;
			
			MonitoringService.recordEvaluationMetric(
				evaluationTime,
				monitorId,
				true,
				{
					...metadata,
					result
				}
			);

			// Track evaluation event for analytics
			MonitoringService.trackUserEvent({
				userId: metadata.userId || 'system',
				eventType: 'monitor_evaluated',
				eventData: {
					monitorId,
					evaluationTime,
					success: true,
					...metadata
				}
			});
			
			return result;
		},
		(error) => {
			const evaluationTime = Date.now() - startTime;
			
			MonitoringService.recordEvaluationMetric(
				evaluationTime,
				monitorId,
				false,
				{
					...metadata,
					error: error instanceof Error ? error.message : 'Unknown error'
				}
			);

			// Create alert for failed evaluations
			MonitoringService.createAlert({
				alertType: 'error',
				severity: 'high',
				title: `Monitor Evaluation Failed`,
				description: `Monitor ${monitorId} evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				metadata: {
					monitorId,
					evaluationTime,
					error: error instanceof Error ? error.message : undefined,
					...metadata
				}
			});
			
			throw error;
		}
	);
}

/**
 * Error tracking and alerting for critical system errors
 */
export function trackError(
	error: Error,
	context: {
		component: string;
		operation: string;
		userId?: string;
		metadata?: Record<string, any>;
	}
): void {
	// Create error alert
	MonitoringService.createAlert({
		alertType: 'error',
		severity: 'high',
		title: `Error in ${context.component}`,
		description: `${context.operation} failed: ${error.message}`,
		metadata: {
			component: context.component,
			operation: context.operation,
			userId: context.userId,
			error: error.message,
			stack: error.stack,
			...context.metadata
		}
	});

	// Track error event for analytics
	if (context.userId) {
		MonitoringService.trackUserEvent({
			userId: context.userId,
			eventType: 'error' as any,
			eventData: {
				component: context.component,
				operation: context.operation,
				error: error.message,
				...context.metadata
			}
		});
	}
}

/**
 * Cleanup old monitoring data periodically
 */
export function startMonitoringCleanup(): void {
	// Clean up every hour
	setInterval(() => {
		MonitoringService.cleanup();
		console.log('Monitoring data cleanup completed');
	}, 60 * 60 * 1000);
}