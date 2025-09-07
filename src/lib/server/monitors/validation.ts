import { z } from 'zod';

// Create monitor schema
export const createMonitorSchema = z.object({
  name: z.string().min(1, 'Monitor name is required').max(100, 'Monitor name must be 100 characters or less'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(1000, 'Prompt must be 1000 characters or less'),
  type: z.enum(['state', 'change'], {
    errorMap: () => ({ message: 'Type must be either "state" or "change"' })
  }),
  extractedFact: z.string().min(1, 'Extracted fact is required'),
  triggerCondition: z.string().min(1, 'Trigger condition is required'),
  factType: z.enum(['number', 'string', 'boolean', 'object'], {
    errorMap: () => ({ message: 'Fact type must be number, string, boolean, or object' })
  })
});

// Update monitor schema  
export const updateMonitorSchema = z.object({
  name: z.string().min(1, 'Monitor name is required').max(100, 'Monitor name must be 100 characters or less').optional(),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(1000, 'Prompt must be 1000 characters or less').optional(),
  type: z.enum(['state', 'change'], {
    errorMap: () => ({ message: 'Type must be either "state" or "change"' })
  }).optional(),
  extractedFact: z.string().min(1, 'Extracted fact is required').optional(),
  triggerCondition: z.string().min(1, 'Trigger condition is required').optional(),
  factType: z.enum(['number', 'string', 'boolean', 'object'], {
    errorMap: () => ({ message: 'Fact type must be number, string, boolean, or object' })
  }).optional(),
  isActive: z.boolean().optional()
});

// Query parameters for listing monitors
export const listMonitorsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
  type: z.enum(['state', 'change']).optional(),
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'lastChecked', 'triggerCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Monitor ID parameter validation
export const monitorIdSchema = z.object({
  id: z.string().uuid('Invalid monitor ID format')
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
export type ListMonitorsQuery = z.infer<typeof listMonitorsSchema>;
export type MonitorIdParams = z.infer<typeof monitorIdSchema>;