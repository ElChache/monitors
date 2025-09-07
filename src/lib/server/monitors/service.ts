import { eq, and, desc, asc, count, ilike, or } from 'drizzle-orm';
import { db } from '../db';
import { monitors } from '../../db/schemas/monitors';
import type { CreateMonitorInput, UpdateMonitorInput, ListMonitorsQuery } from './validation';

export interface Monitor {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  type: 'state' | 'change';
  isActive: boolean;
  extractedFact: string;
  triggerCondition: string;
  factType: 'number' | 'string' | 'boolean' | 'object';
  lastChecked: Date | null;
  currentValue: any;
  previousValue: any;
  triggerCount: number;
  evaluationCount: number;
  lastManualRefresh: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonitorListResponse {
  monitors: Monitor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class MonitorService {
  
  /**
   * Create a new monitor for a user
   */
  static async createMonitor(userId: string, data: CreateMonitorInput): Promise<Monitor> {
    const result = await db.insert(monitors).values({
      userId,
      name: data.name,
      prompt: data.prompt,
      type: data.type,
      extractedFact: data.extractedFact,
      triggerCondition: data.triggerCondition,
      factType: data.factType,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0] as Monitor;
  }

  /**
   * Get monitors for a user with filtering and pagination
   */
  static async getMonitors(userId: string, query: ListMonitorsQuery): Promise<MonitorListResponse> {
    const { page, limit, type, isActive, search, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(monitors.userId, userId)];
    
    if (type) {
      whereConditions.push(eq(monitors.type, type));
    }
    
    if (isActive !== undefined) {
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

    // Build sort condition
    const sortColumn = {
      name: monitors.name,
      createdAt: monitors.createdAt,
      lastChecked: monitors.lastChecked,
      triggerCount: monitors.triggerCount
    }[sortBy];
    
    const sortFunction = sortOrder === 'asc' ? asc : desc;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(monitors)
      .where(and(...whereConditions));
    
    const total = totalResult.count;

    // Get monitors
    const result = await db
      .select()
      .from(monitors)
      .where(and(...whereConditions))
      .orderBy(sortFunction(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      monitors: result as Monitor[],
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
  static async getMonitorById(userId: string, monitorId: string): Promise<Monitor | null> {
    const result = await db
      .select()
      .from(monitors)
      .where(and(
        eq(monitors.id, monitorId),
        eq(monitors.userId, userId)
      ))
      .limit(1);

    return result.length > 0 ? result[0] as Monitor : null;
  }

  /**
   * Update a monitor (with user ownership check)
   */
  static async updateMonitor(
    userId: string, 
    monitorId: string, 
    data: UpdateMonitorInput
  ): Promise<Monitor | null> {
    // First check if monitor exists and belongs to user
    const existingMonitor = await this.getMonitorById(userId, monitorId);
    if (!existingMonitor) {
      return null;
    }

    const result = await db
      .update(monitors)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(monitors.id, monitorId),
        eq(monitors.userId, userId)
      ))
      .returning();

    return result.length > 0 ? result[0] as Monitor : null;
  }

  /**
   * Delete a monitor (with user ownership check)
   */
  static async deleteMonitor(userId: string, monitorId: string): Promise<boolean> {
    const result = await db
      .delete(monitors)
      .where(and(
        eq(monitors.id, monitorId),
        eq(monitors.userId, userId)
      ))
      .returning({ id: monitors.id });

    return result.length > 0;
  }

  /**
   * Check if user has reached monitor creation limits
   * (This could be expanded for different user tiers)
   */
  static async getUserMonitorCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(monitors)
      .where(eq(monitors.userId, userId));

    return result[0].count;
  }

  /**
   * Toggle monitor active status
   */
  static async toggleMonitorActive(
    userId: string, 
    monitorId: string
  ): Promise<Monitor | null> {
    // Get current status
    const existingMonitor = await this.getMonitorById(userId, monitorId);
    if (!existingMonitor) {
      return null;
    }

    return this.updateMonitor(userId, monitorId, {
      isActive: !existingMonitor.isActive
    });
  }
}