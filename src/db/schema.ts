import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'google_assets' table to save/favorite Workspace resources.
export const googleAssets = pgTable('google_assets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  assetId: text('asset_id').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'DRIVE', 'SHEET', 'COURSE'
  createdAt: timestamp('created_at').defaultNow(),
});

// Define a 'workspace_notes' table for adding notes to sheets/files.
export const workspaceNotes = pgTable('workspace_notes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  associatedId: text('associated_id').notNull(), // ID of drive file, sheet, or course
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for 'users'
export const usersRelations = relations(users, ({ many }) => ({
  googleAssets: many(googleAssets),
  workspaceNotes: many(workspaceNotes),
}));

// Define relationships for 'googleAssets'
export const googleAssetsRelations = relations(googleAssets, ({ one }) => ({
  user: one(users, {
    fields: [googleAssets.userId],
    references: [users.id],
  }),
}));

// Define relationships for 'workspaceNotes'
export const workspaceNotesRelations = relations(workspaceNotes, ({ one }) => ({
  user: one(users, {
    fields: [workspaceNotes.userId],
    references: [users.id],
  }),
}));
