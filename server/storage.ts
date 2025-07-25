import {
  users,
  partnerships,
  memories,
  photos,
  comments,
  type User,
  type UpsertUser,
  type Partnership,
  type InsertPartnership,
  type Memory,
  type InsertMemory,
  type Photo,
  type InsertPhoto,
  type Comment,
  type InsertComment,
  type MemoryWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Partnership operations
  createPartnership(partnership: InsertPartnership): Promise<Partnership>;
  getPartnership(userId1: string, userId2: string): Promise<Partnership | undefined>;
  getActivePartnership(userId: string): Promise<Partnership | undefined>;
  updatePartnershipStatus(id: string, status: string): Promise<Partnership>;
  
  // Memory operations
  createMemory(memory: InsertMemory): Promise<Memory>;
  getMemoriesForPartnership(partnershipId: string, limit?: number, offset?: number): Promise<MemoryWithDetails[]>;
  getMemoryById(id: string): Promise<MemoryWithDetails | undefined>;
  updateMemoryStatus(id: string, status: string, approvedById?: string): Promise<Memory>;
  searchMemories(partnershipId: string, query: string): Promise<MemoryWithDetails[]>;
  filterMemories(partnershipId: string, filters: { location?: string; rating?: number; dateFrom?: Date; dateTo?: Date }): Promise<MemoryWithDetails[]>;
  
  // Photo operations
  addPhotosToMemory(memoryId: string, photoUrls: { url: string; caption?: string }[]): Promise<Photo[]>;
  
  // Comment operations
  addComment(comment: InsertComment): Promise<Comment>;
  getCommentsForMemory(memoryId: string): Promise<(Comment & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Partnership operations
  async createPartnership(partnership: InsertPartnership): Promise<Partnership> {
    const [newPartnership] = await db
      .insert(partnerships)
      .values(partnership)
      .returning();
    return newPartnership;
  }

  async getPartnership(userId1: string, userId2: string): Promise<Partnership | undefined> {
    const [partnership] = await db
      .select()
      .from(partnerships)
      .where(
        or(
          and(eq(partnerships.user1Id, userId1), eq(partnerships.user2Id, userId2)),
          and(eq(partnerships.user1Id, userId2), eq(partnerships.user2Id, userId1))
        )
      );
    return partnership;
  }

  async getActivePartnership(userId: string): Promise<Partnership | undefined> {
    const [partnership] = await db
      .select()
      .from(partnerships)
      .where(
        and(
          or(eq(partnerships.user1Id, userId), eq(partnerships.user2Id, userId)),
          eq(partnerships.status, "active")
        )
      );
    return partnership;
  }

  async updatePartnershipStatus(id: string, status: string): Promise<Partnership> {
    const [partnership] = await db
      .update(partnerships)
      .set({ status, updatedAt: new Date() })
      .where(eq(partnerships.id, id))
      .returning();
    return partnership;
  }

  // Memory operations
  async createMemory(memory: InsertMemory): Promise<Memory> {
    const { photos: photoData, ...memoryData } = memory;
    
    const [newMemory] = await db
      .insert(memories)
      .values(memoryData)
      .returning();

    if (photoData && photoData.length > 0) {
      await this.addPhotosToMemory(newMemory.id, photoData);
    }

    return newMemory;
  }

  async getMemoriesForPartnership(partnershipId: string, limit = 10, offset = 0): Promise<MemoryWithDetails[]> {
    const memoriesData = await db
      .select()
      .from(memories)
      .where(eq(memories.partnershipId, partnershipId))
      .orderBy(desc(memories.dateOfMemory))
      .limit(limit)
      .offset(offset);

    const memoriesWithDetails = await Promise.all(
      memoriesData.map(async (memory) => {
        const [memoryPhotos, memoryComments, creator, approver] = await Promise.all([
          db.select().from(photos).where(eq(photos.memoryId, memory.id)).orderBy(asc(photos.orderIndex)),
          this.getCommentsForMemory(memory.id),
          db.select().from(users).where(eq(users.id, memory.createdById)).then(res => res[0]),
          memory.approvedById 
            ? db.select().from(users).where(eq(users.id, memory.approvedById)).then(res => res[0])
            : undefined
        ]);

        return {
          ...memory,
          photos: memoryPhotos,
          comments: memoryComments,
          createdBy: creator,
          approvedBy: approver,
        };
      })
    );

    return memoriesWithDetails;
  }

  async getMemoryById(id: string): Promise<MemoryWithDetails | undefined> {
    const [memory] = await db.select().from(memories).where(eq(memories.id, id));
    if (!memory) return undefined;

    const [memoryPhotos, memoryComments, creator, approver] = await Promise.all([
      db.select().from(photos).where(eq(photos.memoryId, memory.id)).orderBy(asc(photos.orderIndex)),
      this.getCommentsForMemory(memory.id),
      db.select().from(users).where(eq(users.id, memory.createdById)).then(res => res[0]),
      memory.approvedById 
        ? db.select().from(users).where(eq(users.id, memory.approvedById)).then(res => res[0])
        : undefined
    ]);

    return {
      ...memory,
      photos: memoryPhotos,
      comments: memoryComments,
      createdBy: creator,
      approvedBy: approver,
    };
  }

  async updateMemoryStatus(id: string, status: string, approvedById?: string): Promise<Memory> {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === "approved" && approvedById) {
      updateData.approvedById = approvedById;
      updateData.approvedAt = new Date();
    }

    const [memory] = await db
      .update(memories)
      .set(updateData)
      .where(eq(memories.id, id))
      .returning();
    return memory;
  }

  async searchMemories(partnershipId: string, query: string): Promise<MemoryWithDetails[]> {
    const memoriesData = await db
      .select()
      .from(memories)
      .where(
        and(
          eq(memories.partnershipId, partnershipId),
          or(
            ilike(memories.title, `%${query}%`),
            ilike(memories.description, `%${query}%`),
            ilike(memories.location, `%${query}%`)
          )
        )
      )
      .orderBy(desc(memories.dateOfMemory));

    return this.enrichMemoriesWithDetails(memoriesData);
  }

  async filterMemories(partnershipId: string, filters: { location?: string; rating?: number; dateFrom?: Date; dateTo?: Date }): Promise<MemoryWithDetails[]> {
    let query = db
      .select()
      .from(memories)
      .where(eq(memories.partnershipId, partnershipId));

    const conditions = [eq(memories.partnershipId, partnershipId)];

    if (filters.location) {
      conditions.push(ilike(memories.location, `%${filters.location}%`));
    }

    if (filters.rating) {
      conditions.push(eq(memories.overallRating, filters.rating));
    }

    if (filters.dateFrom) {
      conditions.push(sql`${memories.dateOfMemory} >= ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      conditions.push(sql`${memories.dateOfMemory} <= ${filters.dateTo}`);
    }

    const memoriesData = await db
      .select()
      .from(memories)
      .where(and(...conditions))
      .orderBy(desc(memories.dateOfMemory));

    return this.enrichMemoriesWithDetails(memoriesData);
  }

  private async enrichMemoriesWithDetails(memoriesData: Memory[]): Promise<MemoryWithDetails[]> {
    return Promise.all(
      memoriesData.map(async (memory) => {
        const [memoryPhotos, memoryComments, creator, approver] = await Promise.all([
          db.select().from(photos).where(eq(photos.memoryId, memory.id)).orderBy(asc(photos.orderIndex)),
          this.getCommentsForMemory(memory.id),
          db.select().from(users).where(eq(users.id, memory.createdById)).then(res => res[0]),
          memory.approvedById 
            ? db.select().from(users).where(eq(users.id, memory.approvedById)).then(res => res[0])
            : undefined
        ]);

        return {
          ...memory,
          photos: memoryPhotos,
          comments: memoryComments,
          createdBy: creator,
          approvedBy: approver,
        };
      })
    );
  }

  // Photo operations
  async addPhotosToMemory(memoryId: string, photoUrls: { url: string; caption?: string }[]): Promise<Photo[]> {
    const photoData = photoUrls.map((photo, index) => ({
      memoryId,
      url: photo.url,
      caption: photo.caption,
      orderIndex: index,
    }));

    return await db.insert(photos).values(photoData).returning();
  }

  // Comment operations
  async addComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getCommentsForMemory(memoryId: string): Promise<(Comment & { user: User })[]> {
    const commentsWithUsers = await db
      .select({
        id: comments.id,
        memoryId: comments.memoryId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.memoryId, memoryId))
      .orderBy(asc(comments.createdAt));

    return commentsWithUsers;
  }
}

export const storage = new DatabaseStorage();
