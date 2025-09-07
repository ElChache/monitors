import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { JWTService } from '$lib/server/auth/jwt.js';
import { db } from '$lib/db/connection.js';
import { monitorDrafts } from '$lib/db/schemas/monitors.js';
import { eq, and } from 'drizzle-orm';

interface DraftSaveRequest {
  prompt: string;
  name?: string;
  monitorType?: string;
  extractedFact?: string;
  triggerCondition?: string;
  factType?: string;
  aiSuggestions?: {
    improved_prompt?: string;
    clarity_suggestions?: string[];
    estimated_accuracy?: number;
  };
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Authentication check
    const accessToken = cookies.get('access_token');
    if (!accessToken) {
      throw error(401, 'Authentication required');
    }

    const payload = JWTService.verifyAccessToken(accessToken);
    const userId = payload.userId;

    const body: DraftSaveRequest = await request.json();
    const { prompt, name, monitorType, extractedFact, triggerCondition, factType, aiSuggestions } = body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      throw error(400, 'Prompt is required');
    }

    if (prompt.length > 500) {
      throw error(400, 'Prompt must be 500 characters or less');
    }

    // Check for existing draft for this user
    const existingDraft = await db
      .select()
      .from(monitorDrafts)
      .where(eq(monitorDrafts.userId, userId))
      .limit(1);

    const draftData = {
      userId,
      prompt: prompt.trim(),
      name: name?.trim() || null,
      monitorType: monitorType || null,
      extractedFact: extractedFact || null,
      triggerCondition: triggerCondition || null,
      factType: factType || null,
      aiSuggestions: aiSuggestions ? JSON.stringify(aiSuggestions) : null,
      updatedAt: new Date()
    };

    let draft;
    
    if (existingDraft.length > 0) {
      // Update existing draft
      [draft] = await db
        .update(monitorDrafts)
        .set(draftData)
        .where(eq(monitorDrafts.id, existingDraft[0].id))
        .returning();
    } else {
      // Create new draft
      [draft] = await db
        .insert(monitorDrafts)
        .values({
          ...draftData,
          createdAt: new Date()
        })
        .returning();
    }

    return json({
      success: true,
      message: 'Draft saved successfully',
      draft: {
        id: draft.id,
        prompt: draft.prompt,
        name: draft.name,
        monitorType: draft.monitorType,
        extractedFact: draft.extractedFact,
        triggerCondition: draft.triggerCondition,
        factType: draft.factType,
        aiSuggestions: draft.aiSuggestions ? JSON.parse(draft.aiSuggestions) : null,
        updatedAt: draft.updatedAt
      }
    });

  } catch (err) {
    console.error('Draft save endpoint error:', err);
    
    if (err?.status) {
      throw err;
    }

    return json(
      {
        success: false,
        error: 'Failed to save draft'
      },
      { status: 500 }
    );
  }
};