// MonitorHub Monitor Templates API
// Template gallery for Combination Intelligence examples

import { json } from '@sveltejs/kit';
import { db } from '$lib/database';
import type { RequestHandler } from './$types';

// GET /api/monitors/templates - Get monitor templates for template gallery
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Query parameters
		const category = url.searchParams.get('category');
		const complexity = url.searchParams.get('complexity');
		const isCombination = url.searchParams.get('combination');

		// Build where clause
		const where: any = {};
		
		if (category) {
			where.category = category;
		}
		
		if (complexity && ['beginner', 'intermediate', 'advanced'].includes(complexity)) {
			where.complexityLevel = complexity;
		}
		
		if (isCombination !== null) {
			where.isCombination = isCombination === 'true';
		}

		// Get templates
		const templates = await db.monitorTemplate.findMany({
			where,
			orderBy: [
				{ isCombination: 'desc' }, // Combination templates first
				{ complexityLevel: 'asc' }, // Beginner first
				{ name: 'asc' }
			]
		});

		// Group by category for frontend display
		const groupedTemplates = templates.reduce((acc: any, template) => {
			if (!acc[template.category]) {
				acc[template.category] = [];
			}
			acc[template.category].push(template);
			return acc;
		}, {});

		return json({
			templates,
			grouped: groupedTemplates,
			categories: [...new Set(templates.map(t => t.category))],
			stats: {
				total: templates.length,
				combination: templates.filter(t => t.isCombination).length,
				single: templates.filter(t => !t.isCombination).length,
				byComplexity: {
					beginner: templates.filter(t => t.complexityLevel === 'beginner').length,
					intermediate: templates.filter(t => t.complexityLevel === 'intermediate').length,
					advanced: templates.filter(t => t.complexityLevel === 'advanced').length
				}
			}
		});

	} catch (error) {
		console.error('Failed to fetch templates:', error);
		return json(
			{ error: 'Failed to fetch templates' },
			{ status: 500 }
		);
	}
};