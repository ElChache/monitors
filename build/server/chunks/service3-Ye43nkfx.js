import { z } from 'zod';
import { eq, or, ilike, count, and, asc, desc } from 'drizzle-orm';
import { d as db } from './db-DnzjOtfS.js';
import { f as monitors } from './users-4TgmiNes.js';

const createMonitorSchema = z.object({
  name: z.string().min(1, "Monitor name is required").max(100, "Monitor name must be 100 characters or less"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(1e3, "Prompt must be 1000 characters or less"),
  type: z.enum(["state", "change"], {
    errorMap: () => ({ message: 'Type must be either "state" or "change"' })
  }),
  extractedFact: z.string().min(1, "Extracted fact is required"),
  triggerCondition: z.string().min(1, "Trigger condition is required"),
  factType: z.enum(["number", "string", "boolean", "object"], {
    errorMap: () => ({ message: "Fact type must be number, string, boolean, or object" })
  })
});
const updateMonitorSchema = z.object({
  name: z.string().min(1, "Monitor name is required").max(100, "Monitor name must be 100 characters or less").optional(),
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(1e3, "Prompt must be 1000 characters or less").optional(),
  type: z.enum(["state", "change"], {
    errorMap: () => ({ message: 'Type must be either "state" or "change"' })
  }).optional(),
  extractedFact: z.string().min(1, "Extracted fact is required").optional(),
  triggerCondition: z.string().min(1, "Trigger condition is required").optional(),
  factType: z.enum(["number", "string", "boolean", "object"], {
    errorMap: () => ({ message: "Fact type must be number, string, boolean, or object" })
  }).optional(),
  isActive: z.boolean().optional()
});
const listMonitorsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional().default("20"),
  type: z.enum(["state", "change"]).optional(),
  isActive: z.enum(["true", "false"]).transform((val) => val === "true").optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(["name", "createdAt", "lastChecked", "triggerCount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
});
const monitorIdSchema = z.object({
  id: z.string().uuid("Invalid monitor ID format")
});
class MonitorService {
  /**
   * Create a new monitor for a user
   */
  static async createMonitor(userId, data) {
    const result = await db.insert(monitors).values({
      userId,
      name: data.name,
      prompt: data.prompt,
      type: data.type,
      extractedFact: data.extractedFact,
      triggerCondition: data.triggerCondition,
      factType: data.factType,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  /**
   * Get monitors for a user with filtering and pagination
   */
  static async getMonitors(userId, query) {
    const { page, limit, type, isActive, search, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;
    const whereConditions = [eq(monitors.userId, userId)];
    if (type) {
      whereConditions.push(eq(monitors.type, type));
    }
    if (isActive !== void 0) {
      whereConditions.push(eq(monitors.isActive, isActive));
    }
    if (search) {
      whereConditions.push(
        or(
          ilike(monitors.name, `%${search}%`),
          ilike(monitors.prompt, `%${search}%`)
        )
      );
    }
    const sortColumn = {
      name: monitors.name,
      createdAt: monitors.createdAt,
      lastChecked: monitors.lastChecked,
      triggerCount: monitors.triggerCount
    }[sortBy];
    const sortFunction = sortOrder === "asc" ? asc : desc;
    const [totalResult] = await db.select({ count: count() }).from(monitors).where(and(...whereConditions));
    const total = totalResult.count;
    const result = await db.select().from(monitors).where(and(...whereConditions)).orderBy(sortFunction(sortColumn)).limit(limit).offset(offset);
    return {
      monitors: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  /**
   * Get a specific monitor by ID (with user ownership check)
   */
  static async getMonitorById(userId, monitorId) {
    const result = await db.select().from(monitors).where(and(
      eq(monitors.id, monitorId),
      eq(monitors.userId, userId)
    )).limit(1);
    return result.length > 0 ? result[0] : null;
  }
  /**
   * Update a monitor (with user ownership check)
   */
  static async updateMonitor(userId, monitorId, data) {
    const existingMonitor = await this.getMonitorById(userId, monitorId);
    if (!existingMonitor) {
      return null;
    }
    const result = await db.update(monitors).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(
      eq(monitors.id, monitorId),
      eq(monitors.userId, userId)
    )).returning();
    return result.length > 0 ? result[0] : null;
  }
  /**
   * Delete a monitor (with user ownership check)
   */
  static async deleteMonitor(userId, monitorId) {
    const result = await db.delete(monitors).where(and(
      eq(monitors.id, monitorId),
      eq(monitors.userId, userId)
    )).returning({ id: monitors.id });
    return result.length > 0;
  }
  /**
   * Check if user has reached monitor creation limits
   * (This could be expanded for different user tiers)
   */
  static async getUserMonitorCount(userId) {
    const result = await db.select({ count: count() }).from(monitors).where(eq(monitors.userId, userId));
    return result[0].count;
  }
  /**
   * Toggle monitor active status
   */
  static async toggleMonitorActive(userId, monitorId) {
    const existingMonitor = await this.getMonitorById(userId, monitorId);
    if (!existingMonitor) {
      return null;
    }
    return this.updateMonitor(userId, monitorId, {
      isActive: !existingMonitor.isActive
    });
  }
}

export { MonitorService as M, createMonitorSchema as c, listMonitorsSchema as l, monitorIdSchema as m, updateMonitorSchema as u };
//# sourceMappingURL=service3-Ye43nkfx.js.map
