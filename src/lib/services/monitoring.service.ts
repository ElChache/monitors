// MonitorHub System Monitoring Service
// Application performance monitoring, metrics collection, and analytics

// Database and AI service imports available when needed
// import { db } from '$lib/database';
// import { aiService } from '$lib/ai/ai.service';

export interface PerformanceMetric {
	id: string;
	metricType: 'api_response_time' | 'monitor_evaluation' | 'database_query' | 'ai_processing';
	value: number;
	unit: 'milliseconds' | 'seconds' | 'count' | 'percent';
	metadata: Record<string, unknown>;
	timestamp: Date;
	endpoint?: string;
	userId?: string;
}

export interface SystemAlert {
	id: string;
	alertType: 'performance' | 'cost' | 'error' | 'health';
	severity: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	description: string;
	metadata: Record<string, unknown>;
	timestamp: Date;
	resolved: boolean;
	resolvedAt?: Date;
}

export interface UserAnalyticsEvent {
	id: string;
	userId: string;
	eventType: 'monitor_created' | 'monitor_evaluated' | 'dashboard_view' | 'login' | 'template_used';
	eventData: Record<string, any>;
	timestamp: Date;
	sessionId?: string;
	userAgent?: string;
}

export interface CostTrackingData {
	provider: 'claude' | 'openai';
	operation: 'fact_extraction' | 'monitor_classification' | 'evaluation';
	tokensUsed: number;
	cost: number;
	timestamp: Date;
	userId?: string;
	monitorId?: string;
}

export class MonitoringService {
	private static metrics: PerformanceMetric[] = [];
	private static alerts: SystemAlert[] = [];
	private static userEvents: UserAnalyticsEvent[] = [];
	private static costData: CostTrackingData[] = [];

	// Performance Monitoring
	
	/**
	 * Record performance metric
	 */
	static recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
		const performanceMetric: PerformanceMetric = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			...metric
		};

		this.metrics.push(performanceMetric);

		// Keep only last 10000 metrics to prevent memory issues
		if (this.metrics.length > 10000) {
			this.metrics = this.metrics.slice(-10000);
		}

		// Check for performance alerts
		this.checkPerformanceThresholds(performanceMetric);
	}

	/**
	 * Middleware for automatic API response time tracking
	 */
	static createPerformanceMiddleware() {
		return (endpoint: string) => {
			const startTime = Date.now();
			
			return {
				start: startTime,
				end: (userId?: string, metadata?: Record<string, any>) => {
					const responseTime = Date.now() - startTime;
					
					this.recordMetric({
						metricType: 'api_response_time',
						value: responseTime,
						unit: 'milliseconds',
						endpoint,
						userId,
						metadata: metadata || {}
					});

					return responseTime;
				}
			};
		};
	}

	/**
	 * Record monitor evaluation performance
	 */
	static recordEvaluationMetric(
		evaluationTime: number, 
		monitorId: string, 
		success: boolean,
		metadata: Record<string, any> = {}
	): void {
		this.recordMetric({
			metricType: 'monitor_evaluation',
			value: evaluationTime,
			unit: 'milliseconds',
			metadata: {
				monitorId,
				success,
				...metadata
			}
		});
	}

	/**
	 * Record database query performance
	 */
	static recordDatabaseMetric(
		queryTime: number,
		queryType: string,
		metadata: Record<string, any> = {}
	): void {
		this.recordMetric({
			metricType: 'database_query',
			value: queryTime,
			unit: 'milliseconds',
			metadata: {
				queryType,
				...metadata
			}
		});
	}

	/**
	 * Record AI processing performance
	 */
	static recordAIMetric(
		processingTime: number,
		provider: string,
		operation: string,
		metadata: Record<string, any> = {}
	): void {
		this.recordMetric({
			metricType: 'ai_processing',
			value: processingTime,
			unit: 'milliseconds',
			metadata: {
				provider,
				operation,
				...metadata
			}
		});
	}

	// Alert Management

	/**
	 * Check performance thresholds and create alerts
	 */
	private static checkPerformanceThresholds(metric: PerformanceMetric): void {
		const thresholds = {
			api_response_time: 2000, // 2 seconds
			monitor_evaluation: 30000, // 30 seconds
			database_query: 1000, // 1 second
			ai_processing: 15000 // 15 seconds
		};

		const threshold = thresholds[metric.metricType];
		if (threshold && metric.value > threshold) {
			this.createAlert({
				alertType: 'performance',
				severity: metric.value > threshold * 2 ? 'critical' : 'high',
				title: `${metric.metricType} performance threshold exceeded`,
				description: `${metric.metricType} took ${metric.value}${metric.unit}, exceeding threshold of ${threshold}ms`,
				metadata: {
					metric: metric,
					threshold: threshold
				}
			});
		}
	}

	/**
	 * Create system alert
	 */
	static createAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'resolved'>): void {
		const systemAlert: SystemAlert = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			resolved: false,
			...alert
		};

		this.alerts.push(systemAlert);

		// Keep only last 1000 alerts
		if (this.alerts.length > 1000) {
			this.alerts = this.alerts.slice(-1000);
		}

		// Log critical alerts
		if (systemAlert.severity === 'critical') {
			console.error(`CRITICAL ALERT: ${systemAlert.title} - ${systemAlert.description}`);
		}
	}

	/**
	 * Resolve alert
	 */
	static resolveAlert(alertId: string): boolean {
		const alert = this.alerts.find(a => a.id === alertId);
		if (alert && !alert.resolved) {
			alert.resolved = true;
			alert.resolvedAt = new Date();
			return true;
		}
		return false;
	}

	// User Analytics

	/**
	 * Track user event
	 */
	static trackUserEvent(event: Omit<UserAnalyticsEvent, 'id' | 'timestamp'>): void {
		const userEvent: UserAnalyticsEvent = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			...event
		};

		this.userEvents.push(userEvent);

		// Keep only last 50000 events
		if (this.userEvents.length > 50000) {
			this.userEvents = this.userEvents.slice(-50000);
		}
	}

	// Cost Tracking

	/**
	 * Track AI provider costs
	 */
	static trackCost(cost: Omit<CostTrackingData, 'timestamp'>): void {
		const costEntry: CostTrackingData = {
			timestamp: new Date(),
			...cost
		};

		this.costData.push(costEntry);

		// Keep only last 10000 cost entries
		if (this.costData.length > 10000) {
			this.costData = this.costData.slice(-10000);
		}

		// Check cost alerts
		this.checkCostThresholds();
	}

	/**
	 * Check cost thresholds and create alerts
	 */
	private static checkCostThresholds(): void {
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		// Calculate daily and monthly costs
		const dailyCost = this.costData
			.filter(c => c.timestamp >= startOfDay)
			.reduce((sum, c) => sum + c.cost, 0);

		const monthlyCost = this.costData
			.filter(c => c.timestamp >= startOfMonth)
			.reduce((sum, c) => sum + c.cost, 0);

		// Daily cost alert threshold: $50
		if (dailyCost > 50) {
			this.createAlert({
				alertType: 'cost',
				severity: dailyCost > 75 ? 'critical' : 'high',
				title: 'Daily AI cost threshold exceeded',
				description: `Daily AI costs have reached $${dailyCost.toFixed(2)}`,
				metadata: { dailyCost, threshold: 50 }
			});
		}

		// Monthly cost alert threshold: $1000
		if (monthlyCost > 1000) {
			this.createAlert({
				alertType: 'cost',
				severity: monthlyCost > 1500 ? 'critical' : 'high',
				title: 'Monthly AI cost threshold exceeded',
				description: `Monthly AI costs have reached $${monthlyCost.toFixed(2)}`,
				metadata: { monthlyCost, threshold: 1000 }
			});
		}
	}

	// Analytics Queries

	/**
	 * Get performance analytics for a time period
	 */
	static getPerformanceAnalytics(hours: number = 24): {
		averageResponseTime: number;
		averageEvaluationTime: number;
		averageDatabaseQueryTime: number;
		totalRequests: number;
		errorRate: number;
		throughput: number;
	} {
		const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
		const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

		const apiMetrics = recentMetrics.filter(m => m.metricType === 'api_response_time');
		const evaluationMetrics = recentMetrics.filter(m => m.metricType === 'monitor_evaluation');
		const dbMetrics = recentMetrics.filter(m => m.metricType === 'database_query');

		const averageResponseTime = apiMetrics.length > 0 
			? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
			: 0;

		const averageEvaluationTime = evaluationMetrics.length > 0
			? evaluationMetrics.reduce((sum, m) => sum + m.value, 0) / evaluationMetrics.length
			: 0;

		const averageDatabaseQueryTime = dbMetrics.length > 0
			? dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length
			: 0;

		const errors = recentMetrics.filter(m => m.metadata.success === false).length;
		const errorRate = recentMetrics.length > 0 ? (errors / recentMetrics.length) * 100 : 0;

		const throughput = apiMetrics.length / hours; // requests per hour

		return {
			averageResponseTime,
			averageEvaluationTime,
			averageDatabaseQueryTime,
			totalRequests: apiMetrics.length,
			errorRate,
			throughput
		};
	}

	/**
	 * Get cost analytics
	 */
	static getCostAnalytics(): {
		dailyCost: number;
		monthlyCost: number;
		costByProvider: Record<string, number>;
		costByOperation: Record<string, number>;
		projectedMonthlyCost: number;
	} {
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const dailyCosts = this.costData.filter(c => c.timestamp >= startOfDay);
		const monthlyCosts = this.costData.filter(c => c.timestamp >= startOfMonth);

		const dailyCost = dailyCosts.reduce((sum, c) => sum + c.cost, 0);
		const monthlyCost = monthlyCosts.reduce((sum, c) => sum + c.cost, 0);

		// Cost by provider
		const costByProvider = monthlyCosts.reduce((acc, c) => {
			acc[c.provider] = (acc[c.provider] || 0) + c.cost;
			return acc;
		}, {} as Record<string, number>);

		// Cost by operation
		const costByOperation = monthlyCosts.reduce((acc, c) => {
			acc[c.operation] = (acc[c.operation] || 0) + c.cost;
			return acc;
		}, {} as Record<string, number>);

		// Project monthly cost based on daily average
		const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
		const daysPassed = now.getDate();
		const projectedMonthlyCost = daysPassed > 0 ? (monthlyCost / daysPassed) * daysInMonth : 0;

		return {
			dailyCost,
			monthlyCost,
			costByProvider,
			costByOperation,
			projectedMonthlyCost
		};
	}

	/**
	 * Get user behavior analytics
	 */
	static getUserAnalytics(days: number = 7): {
		activeUsers: number;
		newUsers: number;
		monitorCreations: number;
		evaluations: number;
		featureAdoption: Record<string, number>;
		userEngagement: {
			dailyActiveUsers: number;
			averageSessionDuration: number;
			bounceRate: number;
		};
	} {
		const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
		const recentEvents = this.userEvents.filter(e => e.timestamp >= cutoff);

		const uniqueUsers = new Set(recentEvents.map(e => e.userId));
		const activeUsers = uniqueUsers.size;

		const newUsers = recentEvents.filter(e => e.eventType === 'login').length;
		const monitorCreations = recentEvents.filter(e => e.eventType === 'monitor_created').length;
		const evaluations = recentEvents.filter(e => e.eventType === 'monitor_evaluated').length;

		// Feature adoption (count of different event types)
		const featureAdoption = recentEvents.reduce((acc, e) => {
			acc[e.eventType] = (acc[e.eventType] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		// Calculate daily active users (unique users per day)
		const dailyActiveUsers = activeUsers / days;

		return {
			activeUsers,
			newUsers,
			monitorCreations,
			evaluations,
			featureAdoption,
			userEngagement: {
				dailyActiveUsers,
				averageSessionDuration: 0, // Would need session tracking
				bounceRate: 0 // Would need page view tracking
			}
		};
	}

	/**
	 * Get active alerts
	 */
	static getActiveAlerts(): SystemAlert[] {
		return this.alerts.filter(a => !a.resolved).sort((a, b) => {
			const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			return severityOrder[b.severity] - severityOrder[a.severity];
		});
	}

	/**
	 * Get system health summary
	 */
	static getSystemHealth(): {
		status: 'healthy' | 'degraded' | 'unhealthy';
		score: number;
		components: {
			performance: boolean;
			costs: boolean;
			errors: boolean;
		};
		summary: string;
	} {
		const analytics = this.getPerformanceAnalytics(1); // Last hour
		const costAnalytics = this.getCostAnalytics();
		const activeAlerts = this.getActiveAlerts();

		const components = {
			performance: analytics.averageResponseTime < 2000 && analytics.errorRate < 5,
			costs: costAnalytics.dailyCost < 50,
			errors: activeAlerts.filter(a => a.severity === 'critical').length === 0
		};

		const healthyComponents = Object.values(components).filter(Boolean).length;
		const score = Math.round((healthyComponents / 3) * 100);

		let status: 'healthy' | 'degraded' | 'unhealthy';
		if (score >= 100) status = 'healthy';
		else if (score >= 67) status = 'degraded';
		else status = 'unhealthy';

		const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
		const summary = criticalAlerts > 0 
			? `${criticalAlerts} critical alerts requiring attention`
			: 'All systems operating normally';

		return {
			status,
			score,
			components,
			summary
		};
	}

	/**
	 * Clear old data to prevent memory buildup
	 */
	static cleanup(): void {
		const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
		
		this.metrics = this.metrics.filter(m => m.timestamp >= oneWeekAgo);
		this.alerts = this.alerts.filter(a => a.timestamp >= oneWeekAgo);
		this.userEvents = this.userEvents.filter(e => e.timestamp >= oneWeekAgo);
		this.costData = this.costData.filter(c => c.timestamp >= oneWeekAgo);
	}
}