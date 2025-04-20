import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatarUrl: true,
});

export type IncidentType = "roadblock" | "accident";

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'roadblock' or 'accident'
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  imageUrl: text("image_url").notNull(),
  notes: text("notes"),
  locationName: text("location_name"),
  reportedAt: timestamp("reported_at").notNull(),
  active: boolean("active").notNull().default(true),
  verifiedCount: integer("verified_count").notNull().default(0),
  dismissedCount: integer("dismissed_count").notNull().default(0),
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
});

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // 'confirm' or 'dismiss'
  timestamp: timestamp("timestamp").notNull(),
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  sirenEnabled: boolean("siren_enabled").notNull().default(true),
  vibrationEnabled: boolean("vibration_enabled").notNull().default(true),
  popupAlertsEnabled: boolean("popup_alerts_enabled").notNull().default(true),
  alertDistanceMeters: integer("alert_distance_meters").notNull().default(500),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;

export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verifications.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  incidents: many(incidents),
  verifications: many(verifications),
  settings: one(settings, {
    fields: [users.id],
    references: [settings.userId],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  user: one(users, {
    fields: [incidents.userId],
    references: [users.id],
  }),
  verifications: many(verifications),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.userId],
    references: [users.id],
  }),
  incident: one(incidents, {
    fields: [verifications.incidentId],
    references: [incidents.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));
