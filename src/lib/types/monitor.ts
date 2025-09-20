// Monitor Types for Frontend Components
// Based on Prisma schema and system architecture

export interface Monitor {
	id: string;
	userId: string;
	name: string;
	description?: string;
	naturalLanguagePrompt: string;
	monitorType: 'CURRENT_STATE' | 'HISTORICAL_CHANGE';
	isActive: boolean;
	evaluationFrequencyMins: number;
	createdAt: Date;
	updatedAt: Date;
	
	// Relations (when populated)
	facts?: MonitorFact[];
	logic?: MonitorLogic[];
	evaluations?: MonitorEvaluation[];
	lastEvaluation?: MonitorEvaluation;
}

export interface MonitorFact {
	id: string;
	monitorId: string;
	factName: string;
	factPrompt: string;
	dataSourceType?: string;
	dataSourceConfig?: Record<string, any>;
	createdAt: Date;
	
	// Recent fact values (when populated)
	latestValue?: FactValue;
	factValues?: FactValue[];
}

export interface FactValue {
	id: string;
	monitorFactId: string;
	valueText?: string;
	valueNumeric?: number;
	valueBoolean?: boolean;
	valueJson?: Record<string, any>;
	extractedAt: Date;
	aiProvider?: string;
	processingTimeMs?: number;
	createdAt: Date;
}

export interface MonitorLogic {
	id: string;
	monitorId: string;
	logicExpression: string;
	evaluationType: string;
	changeCondition?: string;
	createdAt: Date;
}

export interface MonitorEvaluation {
	id: string;
	monitorId: string;
	evaluationResult: boolean;
	previousResult?: boolean;
	stateChanged: boolean;
	factSnapshot?: Record<string, any>;
	evaluatedAt: Date;
	processingTimeMs?: number;
	aiProvider?: string;
	createdAt: Date;
}

// UI State interfaces
export interface MonitorCardProps {
	monitor: Monitor;
	onEdit?: (monitor: Monitor) => void;
	onDelete?: (monitor: Monitor) => void;
	onToggleActive?: (monitor: Monitor) => void;
	onEvaluateNow?: (monitor: Monitor) => void;
	compact?: boolean;
}

export interface DashboardFilters {
	search: string;
	monitorType: 'ALL' | 'CURRENT_STATE' | 'HISTORICAL_CHANGE';
	status: 'ALL' | 'ACTIVE' | 'INACTIVE';
	category?: string;
}

export interface MonitorStats {
	totalMonitors: number;
	activeMonitors: number;
	recentAlerts: number;
	templates: number;
}