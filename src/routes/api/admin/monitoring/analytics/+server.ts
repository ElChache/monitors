// MonitorHub Admin User Analytics API
// GET /api/admin/monitoring/analytics - Get user behavior analytics

import { json } from '@sveltejs/kit';
import { AuthService } from '$lib/services/auth.service';
import { MonitoringService } from '$lib/services/monitoring.service';
import type { RequestHandler } from './$types';

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
		const days = parseInt(url.searchParams.get('days') || '7');
		const includeDetails = url.searchParams.get('details') === 'true';

		// Get user analytics
		const userAnalytics = MonitoringService.getUserAnalytics(days);

		// Get additional details if requested
		let additionalData = {};
		
		if (includeDetails) {
			// Get cost analytics
			const costAnalytics = MonitoringService.getCostAnalytics();
			
			// Get performance analytics
			const performanceAnalytics = MonitoringService.getPerformanceAnalytics(days * 24);

			additionalData = {
				costs: costAnalytics,
				performance: {
					averageResponseTime: performanceAnalytics.averageResponseTime,
					throughput: performanceAnalytics.throughput,
					errorRate: performanceAnalytics.errorRate
				}
			};
		}

		return json({
			success: true,
			data: {
				timeWindow: {
					days,
					from: new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString(),
					to: new Date().toISOString()
				},
				userBehavior: userAnalytics,
				...additionalData,
				insights: generateInsights(userAnalytics)
			}
		});

	} catch (error) {
		console.error('User analytics error:', error);
		return json({
			error: 'Internal server error'
		}, { status: 500 });
	}
};

function generateInsights(analytics: ReturnType<typeof MonitoringService.getUserAnalytics>) {
	const insights = [];

	// User engagement insights
	if (analytics.userEngagement.dailyActiveUsers > 0) {
		const avgMonitorsPerUser = analytics.monitorCreations / Math.max(analytics.activeUsers, 1);
		
		if (avgMonitorsPerUser > 3) {
			insights.push({
				type: 'positive',
				title: 'High User Engagement',
				description: `Users are creating an average of ${avgMonitorsPerUser.toFixed(1)} monitors each, indicating strong product adoption.`
			});
		} else if (avgMonitorsPerUser < 1) {
			insights.push({
				type: 'warning',
				title: 'Low Monitor Creation',
				description: 'Users are creating fewer monitors than expected. Consider improving onboarding or simplifying the creation process.'
			});
		}
	}

	// Feature adoption insights
	const templateUsage = analytics.featureAdoption.template_used || 0;
	const monitorCreations = analytics.featureAdoption.monitor_created || 0;
	
	if (templateUsage > 0 && monitorCreations > 0) {
		const templateAdoptionRate = (templateUsage / monitorCreations) * 100;
		
		if (templateAdoptionRate > 50) {
			insights.push({
				type: 'positive',
				title: 'Strong Template Adoption',
				description: `${templateAdoptionRate.toFixed(1)}% of monitors are created using templates, showing users find value in pre-built options.`
			});
		} else if (templateAdoptionRate < 20) {
			insights.push({
				type: 'suggestion',
				title: 'Template Underutilization',
				description: 'Consider promoting templates more prominently or creating more relevant template options.'
			});
		}
	}

	// Activity insights
	const evaluations = analytics.featureAdoption.monitor_evaluated || 0;
	if (evaluations > 0 && monitorCreations > 0) {
		const evaluationRate = evaluations / monitorCreations;
		
		if (evaluationRate < 0.5) {
			insights.push({
				type: 'warning',
				title: 'Low Monitor Activity',
				description: 'Many monitors are not being evaluated frequently. Check if users understand how monitoring works or if there are technical issues.'
			});
		}
	}

	// Growth insights
	if (analytics.newUsers > 0) {
		const growthRate = (analytics.newUsers / Math.max(analytics.activeUsers, 1)) * 100;
		
		if (growthRate > 20) {
			insights.push({
				type: 'positive',
				title: 'Rapid User Growth',
				description: `${growthRate.toFixed(1)}% of current users are new, indicating strong growth momentum.`
			});
		}
	}

	return insights;
}