import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    repositoryUrl: varchar('repository_url', { length: 2048 }).notNull(),
    port: integer('port')
        .generatedByDefaultAsIdentity({ startWith: 30000 })
        .notNull()
        .unique(),
    envVars: text('env_vars').notNull().default(''),
    installCommand: varchar('install_command', { length: 512 })
        .notNull()
        .default('npm install'),
    buildCommand: varchar('build_command', { length: 512 })
        .notNull()
        .default('npm run build'),
    startCommand: varchar('start_command', { length: 512 })
        .notNull()
        .default('npm start'),
});

export const builds = pgTable('builds', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    codeBuildBuildId: varchar('codebuild_build_id', { length: 255 }).notNull().unique(),
    status: varchar('status', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Build = typeof builds.$inferSelect;
export type NewBuild = typeof builds.$inferInsert;
