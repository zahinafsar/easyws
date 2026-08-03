import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
