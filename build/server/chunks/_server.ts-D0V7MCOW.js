import { e as error, j as json } from './index-Djsj11qr.js';
import { J as JWTService } from './jwt-alvM1AqS.js';
import { db } from './connection-D27Xdyu3.js';
import { a as monitorDrafts } from './users-CCLvGjXf.js';
import { eq } from 'drizzle-orm';
import 'jsonwebtoken';
import 'dotenv';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'drizzle-orm/pg-core';

const GET = async ({ cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(accessToken);
    const userId = payload.userId;
    const drafts = await db.select().from(monitorDrafts).where(eq(monitorDrafts.userId, userId)).limit(1);
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
    console.error("Draft retrieval endpoint error:", err);
    if (err?.status) {
      throw err;
    }
    return json(
      {
        success: false,
        error: "Failed to retrieve draft"
      },
      { status: 500 }
    );
  }
};
const DELETE = async ({ cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(accessToken);
    const userId = payload.userId;
    await db.delete(monitorDrafts).where(eq(monitorDrafts.userId, userId));
    return json({
      success: true,
      message: "Draft deleted successfully"
    });
  } catch (err) {
    console.error("Draft delete endpoint error:", err);
    if (err?.status) {
      throw err;
    }
    return json(
      {
        success: false,
        error: "Failed to delete draft"
      },
      { status: 500 }
    );
  }
};

export { DELETE, GET };
//# sourceMappingURL=_server.ts-D0V7MCOW.js.map
