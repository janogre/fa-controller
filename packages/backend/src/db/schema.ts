import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Teams
export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Employees
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  title: text("title"),
  teamId: integer("team_id").references(() => teams.id),
  imageUrl: text("image_url"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Responsibilities per employee
export const responsibilities = sqliteTable("responsibilities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Competency areas (dynamic, CRUD)
export const competencyAreas = sqliteTable("competency_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Competency ratings (employee <-> competency area, level 1-5)
export const competencyRatings = sqliteTable("competency_ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  competencyAreaId: integer("competency_area_id").notNull().references(() => competencyAreas.id, { onDelete: "cascade" }),
  level: integer("level").notNull(), // 1-5
  notes: text("notes"),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Users (auth)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Activity log
export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(), // "created", "updated", "deleted"
  entityType: text("entity_type").notNull(), // "employee", "team", "competency_area", etc.
  entityId: integer("entity_id"),
  entityName: text("entity_name"),
  details: text("details"),
  userId: integer("user_id").references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// News sources (RSS feeds and sitemaps)
export const newsSources = sqliteTable("news_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull().default("rss"), // "rss" or "sitemap"
  category: text("category"), // "Teknisk", "Regulatorisk", "Marked"
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  lastFetchedAt: text("last_fetched_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// News articles
export const newsArticles = sqliteTable("news_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").references(() => newsSources.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  link: text("link"),
  description: text("description"),
  content: text("content"),
  author: text("author"),
  category: text("category"),
  publishedAt: text("published_at"),
  guid: text("guid"),
  bookmarked: integer("bookmarked", { mode: "boolean" }).notNull().default(false),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Radar blips (technologies on the radar)
export const radarBlips = sqliteTable("radar_blips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  quadrant: text("quadrant").notNull(), // "Nettverksteknologi", "Plattformer/systemer", "Verktøy", "Metoder/prosesser"
  ring: text("ring").notNull(), // "adopt", "trial", "assess", "hold"
  description: text("description"),
  rationale: text("rationale"), // Why this ring?
  competencyAreaId: integer("competency_area_id").references(() => competencyAreas.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Radar blip history (movement between rings)
export const radarBlipHistory = sqliteTable("radar_blip_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  blipId: integer("blip_id").notNull().references(() => radarBlips.id, { onDelete: "cascade" }),
  fromRing: text("from_ring"),
  toRing: text("to_ring").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  team: one(teams, { fields: [employees.teamId], references: [teams.id] }),
  responsibilities: many(responsibilities),
  competencyRatings: many(competencyRatings),
}));

export const responsibilitiesRelations = relations(responsibilities, ({ one }) => ({
  employee: one(employees, { fields: [responsibilities.employeeId], references: [employees.id] }),
}));

export const competencyAreasRelations = relations(competencyAreas, ({ many }) => ({
  ratings: many(competencyRatings),
  radarBlips: many(radarBlips),
}));

export const competencyRatingsRelations = relations(competencyRatings, ({ one }) => ({
  employee: one(employees, { fields: [competencyRatings.employeeId], references: [employees.id] }),
  competencyArea: one(competencyAreas, { fields: [competencyRatings.competencyAreaId], references: [competencyAreas.id] }),
}));

export const newsSourcesRelations = relations(newsSources, ({ many }) => ({
  articles: many(newsArticles),
}));

export const newsArticlesRelations = relations(newsArticles, ({ one }) => ({
  source: one(newsSources, { fields: [newsArticles.sourceId], references: [newsSources.id] }),
}));

export const radarBlipsRelations = relations(radarBlips, ({ one, many }) => ({
  competencyArea: one(competencyAreas, { fields: [radarBlips.competencyAreaId], references: [competencyAreas.id] }),
  history: many(radarBlipHistory),
}));

export const radarBlipHistoryRelations = relations(radarBlipHistory, ({ one }) => ({
  blip: one(radarBlips, { fields: [radarBlipHistory.blipId], references: [radarBlips.id] }),
}));
