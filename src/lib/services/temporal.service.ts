// MonitorHub Temporal Logic Engine
// Core innovation: Current State vs Historical Change monitoring

import { db } from '$lib/database';
import { aiService } from '$lib/ai/index.js';
import type { Monitor, MonitorFact, FactValue } from '@prisma/client';

export interface Fact {
	id: string;
	name: string;
	value: string | number | boolean | null;
	timestamp: Date;
	source: string;
}

export interface TemporalEvaluationResult {
	result: boolean;
	confidence: number;
	explanation: string;
	factsUsed: Fact[];
	timestamp: Date;
}

export interface FactCollectionResult {
	factId: string;
	value: string | number | boolean | null;
	confidence: number;
	source: string;
	timestamp: Date;
	metadata?: Record<string, unknown>;
}

export interface HistoricalDataQuery {
	factId: string;
	timeRange: {
		start: Date;
		end: Date;
	};
	limit?: number;
}

export class TemporalStateManager {
	/**
	 * Evaluate a monitor based on its type (current_state vs historical_change)
	 */
	static async evaluateMonitor(monitorId: string): Promise<TemporalEvaluationResult> {
		// Get monitor with facts
		const monitor = await db.monitor.findUniqueOrThrow({
			where: { id: monitorId },
			include: {
				facts: true,
				logic: true
			}
		});

		if (!monitor.isActive) {
			throw new Error('Cannot evaluate inactive monitor');
		}

		// Collect current fact values
		const currentFacts = await this.collectCurrentFacts(monitor.facts);

		let result: TemporalEvaluationResult;

		if (monitor.monitorType === 'current_state') {
			result = await this.evaluateCurrentState(monitor, currentFacts);
		} else {
			// historical_change evaluation requires historical data
			const historicalFacts = await this.getHistoricalFacts(monitor.facts, monitor.evaluationFrequencyMins);
			result = await this.evaluateHistoricalChange(monitor, currentFacts, historicalFacts);
		}

		// Store evaluation result
		await this.storeEvaluationResult(monitorId, result);

		return result;
	}

	/**
	 * Collect current fact values from external sources
	 */
	static async collectCurrentFacts(monitorFacts: MonitorFact[]): Promise<Fact[]> {
		const facts: Fact[] = [];

		for (const monitorFact of monitorFacts) {
			try {
				const value = await this.collectFactValue(monitorFact);
				
				// Store in database for historical tracking
				await db.factValue.create({
					data: {
						monitorFactId: monitorFact.id,
						valueText: typeof value.value === 'string' ? value.value : null,
						valueNumeric: typeof value.value === 'number' ? value.value : null,
						valueBoolean: typeof value.value === 'boolean' ? value.value : null,
						valueJson: typeof value.value === 'object' ? value.value : null,
						extractedAt: value.timestamp,
						processingTimeMs: 100 // Default processing time
					}
				});

				facts.push({
					id: monitorFact.id,
					name: monitorFact.factName,
					value: value.value,
					timestamp: value.timestamp,
					source: value.source
				});

			} catch (error) {
				console.error(`Failed to collect fact ${monitorFact.factName}:`, error);
				// Use last known value if available
				const lastValue = await this.getLastKnownValue(monitorFact.id);
				if (lastValue) {
					facts.push(lastValue);
				}
			}
		}

		return facts;
	}

	/**
	 * Collect a single fact value from external source
	 */
	static async collectFactValue(monitorFact: MonitorFact): Promise<FactCollectionResult> {
		// This is a mock implementation - in production, this would integrate with various APIs
		// based on the fact's source (stock APIs, weather APIs, news APIs, etc.)
		
		const timestamp = new Date();
		let value: string | number | boolean | null;
		let confidence = 0.95;
		
		// Mock data generation based on fact source  
		const dataSourceType = monitorFact.dataSourceType || 'web_search';
		switch (dataSourceType) {
			case 'stock_api':
				// Mock stock price (Tesla example)
				value = 95 + (Math.random() * 20); // $95-115 range
				break;
				
			case 'weather_api':
				// Mock weather data
				if (monitorFact.factName.includes('temperature')) {
					value = 20 + (Math.random() * 15); // 20-35°C
				} else if (monitorFact.factName.includes('weather')) {
					value = Math.random() > 0.5 ? 'sunny' : 'cloudy';
				}
				break;
				
			case 'news_api':
				// Mock news sentiment
				value = Math.random() > 0.5 ? 'positive' : 'negative';
				confidence = 0.8;
				break;
				
			default:
				// Default random value
				value = Math.random() * 100;
		}

		return {
			factId: monitorFact.id,
			value,
			confidence,
			source: dataSourceType,
			timestamp,
			metadata: {
				collectionMethod: 'mock',
				sourceApi: dataSourceType
			}
		};
	}

	/**
	 * Evaluate current state monitor using Boolean logic
	 */
	static async evaluateCurrentState(
		monitor: Monitor & { facts: MonitorFact[], logic: unknown },
		currentFacts: Fact[]
	): Promise<TemporalEvaluationResult> {
		try {
			// Convert facts to the format expected by AI service
			const factsRecord: Record<string, string | number | boolean> = {};
			currentFacts.forEach(fact => {
				if (fact.value !== null) {
					factsRecord[fact.name] = fact.value;
				}
			});

			// Use AI service to evaluate current state
			const aiResult = await aiService.evaluateState(factsRecord, monitor.naturalLanguagePrompt);
			
			return {
				result: aiResult.result,
				confidence: aiResult.confidence,
				explanation: aiResult.reasoning,
				factsUsed: currentFacts,
				timestamp: new Date()
			};

		} catch (error) {
			console.error('Current state evaluation failed:', error);
			throw new Error('Failed to evaluate current state');
		}
	}

	/**
	 * Evaluate historical change monitor using temporal comparison
	 */
	static async evaluateHistoricalChange(
		monitor: Monitor & { facts: MonitorFact[], logic: unknown },
		currentFacts: Fact[],
		historicalFacts: Fact[]
	): Promise<TemporalEvaluationResult> {
		try {
			// Convert facts to the format expected by AI service
			const currentFactsRecord: Record<string, string | number | boolean> = {};
			const historicalFactsRecord: Record<string, string | number | boolean> = {};
			
			currentFacts.forEach(fact => {
				if (fact.value !== null) {
					currentFactsRecord[fact.name] = fact.value;
				}
			});
			
			historicalFacts.forEach(fact => {
				if (fact.value !== null) {
					historicalFactsRecord[fact.name] = fact.value;
				}
			});

			// Use AI service to evaluate historical change
			const aiResult = await aiService.evaluateChange(
				currentFactsRecord, 
				historicalFactsRecord, 
				monitor.naturalLanguagePrompt
			);
			
			return {
				result: aiResult.hasChanged,
				confidence: aiResult.confidence,
				explanation: aiResult.reasoning,
				factsUsed: [...currentFacts, ...historicalFacts],
				timestamp: new Date()
			};

		} catch (error) {
			console.error('Historical change evaluation failed:', error);
			throw new Error('Failed to evaluate historical change');
		}
	}

	/**
	 * Get historical fact values for comparison
	 */
	static async getHistoricalFacts(monitorFacts: MonitorFact[], frequencyMinutes: number): Promise<Fact[]> {
		const lookbackTime = new Date(Date.now() - (frequencyMinutes * 60 * 1000));
		const historicalFacts: Fact[] = [];

		for (const monitorFact of monitorFacts) {
			const historicalValue = await db.factValue.findFirst({
				where: {
					monitorFactId: monitorFact.id,
					extractedAt: {
						gte: lookbackTime
					}
				},
				orderBy: {
					extractedAt: 'desc'
				}
			});

			if (historicalValue) {
				// Extract the actual value from the appropriate field
				let value: string | number | boolean | null;
				if (historicalValue.valueText !== null) value = historicalValue.valueText;
				else if (historicalValue.valueNumeric !== null) value = Number(historicalValue.valueNumeric);
				else if (historicalValue.valueBoolean !== null) value = historicalValue.valueBoolean;
				else if (historicalValue.valueJson !== null) value = historicalValue.valueJson as string | number | boolean;
				else value = null;

				historicalFacts.push({
					id: monitorFact.id,
					name: monitorFact.factName,
					value: value,
					timestamp: historicalValue.extractedAt,
					source: 'historical_db'
				});
			}
		}

		return historicalFacts;
	}

	/**
	 * Get last known value for a fact
	 */
	static async getLastKnownValue(factId: string): Promise<Fact | null> {
		const lastValue = await db.factValue.findFirst({
			where: { monitorFactId: factId },
			orderBy: { extractedAt: 'desc' },
			include: {
				monitorFact: true
			}
		});

		if (!lastValue) return null;

		// Extract the actual value from the appropriate field
		let value: string | number | boolean | null;
		if (lastValue.valueText !== null) value = lastValue.valueText;
		else if (lastValue.valueNumeric !== null) value = Number(lastValue.valueNumeric);
		else if (lastValue.valueBoolean !== null) value = lastValue.valueBoolean;
		else if (lastValue.valueJson !== null) value = lastValue.valueJson as string | number | boolean;
		else value = null;

		return {
			id: factId,
			name: lastValue.monitorFact.factName,
			value: value,
			timestamp: lastValue.extractedAt,
			source: 'historical_db'
		};
	}

	/**
	 * Store evaluation result in database
	 */
	static async storeEvaluationResult(
		monitorId: string,
		result: TemporalEvaluationResult
	): Promise<void> {
		await db.monitorEvaluation.create({
			data: {
				monitorId,
				evaluationResult: result.result,
				factValues: JSON.parse(JSON.stringify(result.factsUsed)),
				aiReasoning: result.explanation,
				evaluatedAt: result.timestamp
			}
		});
	}

	/**
	 * Get historical data for a specific fact within a time range
	 */
	static async getHistoricalData(query: HistoricalDataQuery): Promise<FactValue[]> {
		return await db.factValue.findMany({
			where: {
				monitorFactId: query.factId,
				extractedAt: {
					gte: query.timeRange.start,
					lte: query.timeRange.end
				}
			},
			orderBy: {
				extractedAt: 'desc'
			},
			take: query.limit || 100
		});
	}

	/**
	 * Clean up old historical data based on retention policy
	 */
	static async cleanupHistoricalData(retentionDays: number = 90): Promise<number> {
		const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
		
		const result = await db.factValue.deleteMany({
			where: {
				extractedAt: {
					lt: cutoffDate
				}
			}
		});

		console.log(`Cleaned up ${result.count} old fact values older than ${retentionDays} days`);
		return result.count;
	}

	/**
	 * Get monitor evaluation history
	 */
	static async getEvaluationHistory(
		monitorId: string,
		limit: number = 50
	): Promise<unknown[]> {
		return await db.monitorEvaluation.findMany({
			where: { monitorId },
			orderBy: { evaluatedAt: 'desc' },
			take: limit
		});
	}

	/**
	 * Calculate change percentage between two values
	 */
	static calculateChangePercentage(currentValue: number, previousValue: number): number {
		if (previousValue === 0) return 0;
		return ((currentValue - previousValue) / previousValue) * 100;
	}

	/**
	 * Detect significant changes using AI-powered analysis
	 */
	static async detectSignificantChange(
		_factName: string,
		currentValue: string | number | boolean | null,
		historicalValues: (string | number | boolean | null)[],
		threshold: number = 5
	): Promise<{ isSignificant: boolean; confidence: number; explanation: string }> {
		try {
			// For numeric values, use statistical analysis
			if (typeof currentValue === 'number' && historicalValues.every(v => typeof v === 'number')) {
				const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
				const changePercentage = Math.abs(this.calculateChangePercentage(currentValue, mean));
				
				const isSignificant = changePercentage > threshold;
				
				return {
					isSignificant,
					confidence: 0.95,
					explanation: `${changePercentage.toFixed(2)}% change from average (threshold: ${threshold}%)`
				};
			}

			// For non-numeric values, use AI analysis
			// This would typically involve more sophisticated AI reasoning
			return {
				isSignificant: false,
				confidence: 0.5,
				explanation: 'Non-numeric change detection not fully implemented'
			};

		} catch (error) {
			console.error('Change detection failed:', error);
			return {
				isSignificant: false,
				confidence: 0,
				explanation: 'Change detection error'
			};
		}
	}
}