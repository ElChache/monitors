// MonitorHub Configuration
// Environment-based configuration management

import { env } from '$env/dynamic/private';

export const config = {
	database: {
		url: env.DATABASE_URL || ''
	},
	auth: {
		secret: env.AUTH_SECRET || 'development-secret',
		google: {
			clientId: env.GOOGLE_CLIENT_ID || '',
			clientSecret: env.GOOGLE_CLIENT_SECRET || ''
		}
	},
	ai: {
		anthropic: {
			apiKey: env.ANTHROPIC_API_KEY || '',
			model: 'claude-3-5-sonnet-20241022'
		},
		openai: {
			apiKey: env.OPENAI_API_KEY || '',
			model: 'gpt-4o'
		}
	},
	email: {
		from: env.EMAIL_FROM || 'noreply@monitorhub.com',
		apiKey: env.EMAIL_API_KEY || ''
	},
	app: {
		nodeEnv: env.NODE_ENV || 'development',
		logLevel: env.LOG_LEVEL || 'info',
		betaWhitelist: env.BETA_WHITELIST?.split(',').map(email => email.trim()) || []
	}
} as const;

// Validation function to check required environment variables
export function validateConfig(): { isValid: boolean; missingVars: string[] } {
	const requiredVars = [
		'DATABASE_URL',
		'AUTH_SECRET'
	];

	const missingVars = requiredVars.filter(varName => {
		const value = env[varName];
		return !value || value.trim() === '';
	});

	return {
		isValid: missingVars.length === 0,
		missingVars
	};
}

// Helper to check if we're in development mode
export const isDevelopment = config.app.nodeEnv === 'development';
export const isProduction = config.app.nodeEnv === 'production';

// Helper to check if user is in beta whitelist
export function isWhitelisted(email: string): boolean {
	if (isDevelopment) {
		return true; // Allow all users in development
	}
	return config.app.betaWhitelist.includes(email.toLowerCase());
}