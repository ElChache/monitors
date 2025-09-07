import { json, type RequestHandler } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt';
import { MonitorService } from '$lib/server/monitoring';
import { z } from 'zod';

const TestMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  prompt: z.string().min(10).max(1000),
  type: z.enum(['state', 'change']),
  extractedFact: z.string().min(1).max(500),
  triggerCondition: z.string().min(1).max(500),
  factType: z.enum(['number', 'string', 'boolean', 'object']),
  checkFrequency: z.number().min(5).max(1440).optional().default(60), // 5 minutes to 24 hours
});

/**
 * POST /api/monitors/test - Test monitor configuration without saving
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = JWTService.verifyAccessToken(sessionToken);
    if (!payload.userId) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = TestMonitorSchema.parse(data);

    console.log(`Testing monitor configuration for user ${payload.userId}`);

    // Test the monitor configuration
    const testResult = await MonitorService.testMonitor(payload.userId, validatedData);

    return json({
      success: true,
      message: 'Monitor configuration tested successfully',
      data: {
        testResult: testResult.success,
        extractedValue: testResult.extractedValue,
        processingTime: testResult.processingTime,
        error: testResult.error,
        configuration: {
          name: validatedData.name,
          type: validatedData.type,
          factType: validatedData.factType,
          triggerCondition: validatedData.triggerCondition,
        },
      },
    });

  } catch (error: any) {
    console.error('Monitor test endpoint error:', error);
    
    if (error.message?.includes('expired')) {
      return json({ error: 'Session expired' }, { status: 401 });
    }

    if (error.name === 'ZodError') {
      return json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};