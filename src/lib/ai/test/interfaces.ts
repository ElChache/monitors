// AI Service Testing Interfaces

import { z } from 'zod';

// Monitor Classification Input Schema
export const ClassificationInputSchema = z.object({
  userInput: z.string().min(1, "Prompt must not be empty"),
  userContext: z.record(z.string(), z.unknown()).optional()
});

// Monitor Classification Output Schema
export const ClassificationOutputSchema = z.object({
  monitorType: z.enum(['state', 'change', 'complex']),
  extractedFact: z.string(),
  triggerCondition: z.string(),
  factType: z.string(),
  recommendedFrequency: z.number().min(1).max(1440), // minutes
  confidence: z.number().min(0).max(1)
});

// Template Suggestion Input Schema
export const TemplateSuggestionInputSchema = z.object({
  userInput: z.string().min(1, "Prompt must not be empty"),
  userContext: z.record(z.string(), z.unknown()).optional()
});

// Template Suggestion Output Schema
export const TemplateSuggestionOutputSchema = z.array(z.object({
  template: z.string(),
  confidence: z.number().min(0).max(1),
  category: z.string().optional()
}));

// Fact Extraction Input Schema
export const FactExtractionInputSchema = z.object({
  content: z.string(),
  contentType: z.enum(['HTML', 'JSON', 'TEXT', 'XML']),
  sourceUrl: z.string().url().optional()
});

// Fact Extraction Output Schema
export const FactExtractionOutputSchema = z.object({
  extractedFacts: z.array(z.object({
    fact: z.string(),
    confidence: z.number().min(0).max(1),
    category: z.string().optional()
  })),
  metadata: z.object({
    processingTime: z.number(),
    sourceQuality: z.number().min(0).max(1)
  }).optional()
});

// Notification Generation Input Schema
export const NotificationGenerationInputSchema = z.object({
  monitorData: z.object({
    id: z.string(),
    type: z.string(),
    currentValue: z.string(),
    previousValue: z.string().optional(),
    change: z.number().optional()
  }),
  userContext: z.record(z.string(), z.unknown()).optional()
});

// Notification Generation Output Schema
export const NotificationGenerationOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  urgency: z.enum(['low', 'medium', 'high']),
  recommendedActions: z.array(z.string()).optional()
});

// Error Handling Schema
export const AIServiceErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional()
});

// Test Configuration Schema
export const AITestConfigSchema = z.object({
  mockResponses: z.boolean().default(false),
  debugMode: z.boolean().default(false),
  performanceThresholds: z.object({
    classificationMaxTime: z.number().default(200),
    factExtractionMaxTime: z.number().default(500),
    notificationGenerationMaxTime: z.number().default(250)
  })
});

// Export types for TypeScript usage
export type ClassificationInput = z.infer<typeof ClassificationInputSchema>;
export type ClassificationOutput = z.infer<typeof ClassificationOutputSchema>;
export type TemplateSuggestionInput = z.infer<typeof TemplateSuggestionInputSchema>;
export type TemplateSuggestionOutput = z.infer<typeof TemplateSuggestionOutputSchema>;
export type FactExtractionInput = z.infer<typeof FactExtractionInputSchema>;
export type FactExtractionOutput = z.infer<typeof FactExtractionOutputSchema>;
export type NotificationGenerationInput = z.infer<typeof NotificationGenerationInputSchema>;
export type NotificationGenerationOutput = z.infer<typeof NotificationGenerationOutputSchema>;
export type AIServiceError = z.infer<typeof AIServiceErrorSchema>;
export type AITestConfig = z.infer<typeof AITestConfigSchema>;