import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partnerships/relationships between couples
export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, active, ended
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  endedBy: varchar("ended_by").references(() => users.id),
});

// Date memories/timeline entries
export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnershipId: varchar("partnership_id").notNull().references(() => partnerships.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  detailedDescription: text("detailed_description"),
  dateOfMemory: timestamp("date_of_memory").notNull(),
  location: varchar("location"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  foodRating: integer("food_rating"), // 1-5
  placeRating: integer("place_rating"), // 1-5
  overallRating: integer("overall_rating"), // 1-5
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  approvedById: varchar("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Photos for memories
export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memoryId: varchar("memory_id").notNull().references(() => memories.id, { onDelete: 'cascade' }),
  url: varchar("url").notNull(),
  caption: varchar("caption"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments on memories
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memoryId: varchar("memory_id").notNull().references(() => memories.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  partnershipsAsUser1: many(partnerships, { relationName: "user1" }),
  partnershipsAsUser2: many(partnerships, { relationName: "user2" }),
  memoriesCreated: many(memories, { relationName: "creator" }),
  memoriesApproved: many(memories, { relationName: "approver" }),
  comments: many(comments),
}));

export const partnershipsRelations = relations(partnerships, ({ one, many }) => ({
  user1: one(users, {
    fields: [partnerships.user1Id],
    references: [users.id],
    relationName: "user1"
  }),
  user2: one(users, {
    fields: [partnerships.user2Id],
    references: [users.id],
    relationName: "user2"
  }),
  memories: many(memories),
}));

export const memoriesRelations = relations(memories, ({ one, many }) => ({
  partnership: one(partnerships, {
    fields: [memories.partnershipId],
    references: [partnerships.id],
  }),
  createdBy: one(users, {
    fields: [memories.createdById],
    references: [users.id],
    relationName: "creator"
  }),
  approvedBy: one(users, {
    fields: [memories.approvedById],
    references: [users.id],
    relationName: "approver"
  }),
  photos: many(photos),
  comments: many(comments),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  memory: one(memories, {
    fields: [photos.memoryId],
    references: [memories.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  memory: one(memories, {
    fields: [comments.memoryId],
    references: [memories.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertPartnershipSchema = createInsertSchema(partnerships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  photos: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
  })).optional(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Memory = typeof memories.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Full memory with relations
export type MemoryWithDetails = Memory & {
  photos: Photo[];
  comments: (Comment & { user: User })[];
  createdBy: User;
  approvedBy?: User;
};
