import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt.js';
import { db } from '$lib/db/connection.js';
import { monitorDrafts } from '$lib/db/schemas/monitors.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // Authentication check
    const accessToken = cookies.get('access_token');
    if (!accessToken) {
      throw error(401, 'Authentication required');
    }

    const payload = JWTService.verifyAccessToken(accessToken);
    const userId = payload.userId;

    // Get user's current draft
    const drafts = await db
      .select()
      .from(monitorDrafts)
      .where(eq(monitorDrafts.userId, userId))
      .limit(1);

    if (drafts.length === 0) {
      return json({
        success: true,
        draft: null
      });
    }

    const draft = drafts[0];
    
    return json({
      success: true,
      draft: {
        id: draft.id,
        prompt: draft.prompt,
        name: draft.name,
        monitorType: draft.monitorType,
        extractedFact: draft.extractedFact,
        triggerCondition: draft.triggerCondition,
        factType: draft.factType,
        aiSuggestions: draft.aiSuggestions ? JSON.parse(draft.aiSuggestions) : null,
        updatedAt: draft.updatedAt,
        createdAt: draft.createdAt
      }
    });

  } catch (err) {
    console.error('Draft retrieval endpoint error:', err);
    
    if (err?.status) {
      throw err;
    }

    return json(
      {
        success: false,
        error: 'Failed to retrieve draft'
      },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ cookies }) => {
  try {
    // Authentication check
    const accessToken = cookies.get('access_token');
    if (!accessToken) {
      throw error(401, 'Authentication required');
    }

    const payload = JWTService.verifyAccessToken(accessToken);
    const userId = payload.userId;

    // Delete user's draft
    await db
      .delete(monitorDrafts)
      .where(eq(monitorDrafts.userId, userId));

    return json({
      success: true,
      message: 'Draft deleted successfully'
    });

  } catch (err) {
    console.error('Draft delete endpoint error:', err);
    
    if (err?.status) {
      throw err;
    }

    return json(
      {
        success: false,
        error: 'Failed to delete draft'
      },
      { status: 500 }
    );
  }
};