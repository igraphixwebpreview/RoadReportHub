import { z } from "zod";

// User Schema
export interface User {
  id: string;
  username: string;
  password: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface InsertUser {
  username: string;
  password: string;
  email?: string | null;
  avatarUrl?: string | null;
}

// Add insertUserSchema
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().optional().default(""),
  avatarUrl: z.string().nullable().optional(),
});

// Incident Schema
export type IncidentType = "roadblock" | "accident";

export interface Incident {
  id: string;
  type: string;
  userId: string;
  latitude: string;
  longitude: string;
  imageUrl: string;
  notes: string | null;
  locationName: string | null;
  reportedAt: Date;
  isActive: boolean;
  confirmations: number;
  dismissals: number;
}

export interface InsertIncident {
  type: string;
  userId: string;
  latitude: string;
  longitude: string;
  imageUrl: string;
  notes?: string | null;
  locationName?: string | null;
  reportedAt: Date;
  isActive?: boolean;
  confirmations?: number;
  dismissals?: number;
}

// Verification Schema
export interface Verification {
  id: string;
  userId: string;
  incidentId: string;
  action: string;
  timestamp: Date;
}

export interface InsertVerification {
  userId: string;
  incidentId: string;
  action: string;
  timestamp: Date;
}

// Settings Schema
export interface Settings {
  id: string;
  userId: string;
  sirenEnabled: boolean;
  vibrationEnabled: boolean;
  popupAlertsEnabled: boolean;
  alertDistanceMeters: number;
}

export interface InsertSettings {
  userId: string;
  sirenEnabled?: boolean;
  vibrationEnabled?: boolean;
  popupAlertsEnabled?: boolean;
  alertDistanceMeters?: number;
}

// Zod Schemas for validation
export const insertIncidentSchema = z.object({
  type: z.string(),
  userId: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  imageUrl: z.string(),
  notes: z.string().nullable().optional(),
  locationName: z.string().nullable().optional(),
  reportedAt: z.date(),
  isActive: z.boolean().optional(),
  confirmations: z.number().optional(),
  dismissals: z.number().optional(),
});

export const insertVerificationSchema = z.object({
  userId: z.string(),
  incidentId: z.string(),
  action: z.string(),
  timestamp: z.date(),
});

export const insertSettingsSchema = z.object({
  userId: z.string(),
  sirenEnabled: z.boolean().optional(),
  vibrationEnabled: z.boolean().optional(),
  popupAlertsEnabled: z.boolean().optional(),
  alertDistanceMeters: z.number().optional(),
}); 