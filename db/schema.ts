import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name"),
  email: text("email").notNull().unique(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: serial("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const kanbanTaskComments = pgTable("kanban_task_comments", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull(),
  parentId: integer("parent_id"),
  message: text("message").notNull(),
  authorId: integer("author_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  authorImageUrl: text("author_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type KanbanTaskComment = typeof kanbanTaskComments.$inferSelect;
export type NewKanbanTaskComment = typeof kanbanTaskComments.$inferInsert;

export const kanbanBoardShares = pgTable("kanban_board_shares", {
  id: serial("id").primaryKey(),
  boardId: text("board_id").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KanbanBoardShare = typeof kanbanBoardShares.$inferSelect;
export type NewKanbanBoardShare = typeof kanbanBoardShares.$inferInsert;

export const kanbanBoards = pgTable("kanban_boards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  columns: jsonb("columns").$type<{ id: string; title: string }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KanbanBoardDb = typeof kanbanBoards.$inferSelect;
export type NewKanbanBoardDb = typeof kanbanBoards.$inferInsert;

export const kanbanTasks = pgTable("kanban_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  boardId: text("board_id"),
  columnId: text("column_id"),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  dueDate: text("due_date"),
  priority: text("priority").default("Medium").notNull(),
  label: text("label").default("Task").notNull(),
  labelColor: text("label_color").default("#6257f6").notNull(),
  syncCalendar: boolean("sync_calendar").default(false).notNull(),
  syncNotes: boolean("sync_notes").default(false).notNull(),
  
  // Calendar specific fields
  time: text("time").default("").notNull(),
  notes: text("notes").default("").notNull(),
  status: text("status").default("scheduled").notNull(), // scheduled, draft
  category: text("category").default("Work").notNull(), // Work, Personal, Focus, Meeting, Reminder
  taskType: text("task_type").default("Task").notNull(), // Task, Reminder
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KanbanTaskDb = typeof kanbanTasks.$inferSelect;
export type NewKanbanTaskDb = typeof kanbanTasks.$inferInsert;

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").default("Untitled").notNull(),
  content: text("content").default("").notNull(),
  icon: text("icon").default("📝").notNull(),
  color: text("color").default("#ff6b4a").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isTrash: boolean("is_trash").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type NoteDb = typeof notes.$inferSelect;
export type NewNoteDb = typeof notes.$inferInsert;

export const whiteboards = pgTable("whiteboards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").default("Untitled Whiteboard").notNull(),
  elements: jsonb("elements").default([]).notNull(), // Excalidraw canvas shapes
  appState: jsonb("app_state").default({}).notNull(),   // Canvas position and zoom
  color: text("color").default("#ff6b4a").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WhiteboardDb = typeof whiteboards.$inferSelect;
export type NewWhiteboardDb = typeof whiteboards.$inferInsert;

export const spaces = pgTable("spaces", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  color: text("color").default("#7c5dfa").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SpaceDb = typeof spaces.$inferSelect;
export type NewSpaceDb = typeof spaces.$inferInsert;

export const spacePages = pgTable("space_pages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  spaceId: text("space_id").references(() => spaces.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  content: text("content").default("").notNull(),
  template: text("template").default("Blank Page").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  updatedBy: text("updated_by").default("JD").notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  linkedTasksCount: integer("linked_tasks_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SpacePageDb = typeof spacePages.$inferSelect;
export type NewSpacePageDb = typeof spacePages.$inferInsert;

export const aiApps = pgTable("ai_apps", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  icon: text("icon").default("Flame").notNull(),
  color: text("color").default("#f97316").notNull(),
  layout: text("layout").default("single-page").notNull(),
  data: jsonb("data").default({}).notNull(),
  inSidebar: boolean("in_sidebar").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AiAppDb = typeof aiApps.$inferSelect;
export type NewAiAppDb = typeof aiApps.$inferInsert;
