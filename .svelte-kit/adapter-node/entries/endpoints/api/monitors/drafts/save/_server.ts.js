import { error, json } from "@sveltejs/kit";
import { J as JWTService } from "../../../../../../chunks/jwt.js";
import { db } from "../../../../../../chunks/connection.js";
import { a as monitorDrafts } from "../../../../../../chunks/users.js";
import { eq } from "drizzle-orm";
const POST = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      throw error(401, "Authentication required");
    }
    const payload = JWTService.verifyAccessToken(accessToken);
    const userId = payload.userId;
    const body = await request.json();
    const { prompt, name, monitorType, extractedFact, triggerCondition, factType, aiSuggestions } = body;
    if (!prompt || typeof prompt !== "string") {
      throw error(400, "Prompt is required");
    }
    if (prompt.length > 500) {
      throw error(400, "Prompt must be 500 characters or less");
    }
    const existingDraft = await db.select().from(monitorDrafts).where(eq(monitorDrafts.userId, userId)).limit(1);
    const draftData = {
      userId,
      prompt: prompt.trim(),
      name: name?.trim() || null,
      monitorType: monitorType || null,
      extractedFact: extractedFact || null,
      triggerCondition: triggerCondition || null,
      factType: factType || null,
      aiSuggestions: aiSuggestions ? JSON.stringify(aiSuggestions) : null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    let draft;
    if (existingDraft.length > 0) {
      [draft] = await db.update(monitorDrafts).set(draftData).where(eq(monitorDrafts.id, existingDraft[0].id)).returning();
    } else {
      [draft] = await db.insert(monitorDrafts).values({
        ...draftData,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
    }
    return json({
      success: true,
      message: "Draft saved successfully",
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
    console.error("Draft save endpoint error:", err);
    if (err?.status) {
      throw err;
    }
    return json(
      {
        success: false,
        error: "Failed to save draft"
      },
      { status: 500 }
    );
  }
};
export {
  POST
};
