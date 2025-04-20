import { 
  users, type User, type InsertUser,
  incidents, type Incident, type InsertIncident,
  verifications, type Verification, type InsertVerification,
  settings, type Settings, type InsertSettings,
  type IncidentType
} from "@shared/schema";
import * as session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Incident methods
  createIncident(incident: InsertIncident): Promise<Incident>;
  getIncident(id: number): Promise<Incident | undefined>;
  getActiveIncidents(): Promise<Incident[]>;
  getUserIncidents(userId: number): Promise<Incident[]>;
  getNearbyIncidents(lat: string, lon: string, radiusInMeters: number): Promise<Incident[]>;
  updateIncidentStatus(id: number, isActive: boolean): Promise<Incident | undefined>;
  updateIncidentVerifications(id: number, action: 'confirm' | 'dismiss'): Promise<Incident | undefined>;

  // Verification methods
  createVerification(verification: InsertVerification): Promise<Verification>;
  getUserVerificationForIncident(userId: number, incidentId: number): Promise<Verification | undefined>;

  // Settings methods
  getUserSettings(userId: number): Promise<Settings | undefined>;
  createOrUpdateUserSettings(settings: InsertSettings): Promise<Settings>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private incidents: Map<number, Incident>;
  private verifications: Map<number, Verification>;
  private userSettings: Map<number, Settings>;
  public sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentIncidentId: number;
  private currentVerificationId: number;
  private currentSettingsId: number;

  constructor() {
    this.users = new Map();
    this.incidents = new Map();
    this.verifications = new Map();
    this.userSettings = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.currentUserId = 1;
    this.currentIncidentId = 1;
    this.currentVerificationId = 1;
    this.currentSettingsId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Incident methods
  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const id = this.currentIncidentId++;
    const incident: Incident = { ...insertIncident, id };
    this.incidents.set(id, incident);
    return incident;
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    return this.incidents.get(id);
  }

  async getActiveIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values()).filter(incident => incident.active);
  }

  async getUserIncidents(userId: number): Promise<Incident[]> {
    return Array.from(this.incidents.values()).filter(
      (incident) => incident.userId === userId,
    );
  }

  async getNearbyIncidents(lat: string, lon: string, radiusInMeters: number): Promise<Incident[]> {
    // In a real app, this would use geospatial queries.
    // For now, return all active incidents as if they're nearby
    return Array.from(this.incidents.values()).filter(incident => incident.active);
  }

  async updateIncidentStatus(id: number, isActive: boolean): Promise<Incident | undefined> {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;
    
    const updatedIncident = { ...incident, active: isActive };
    this.incidents.set(id, updatedIncident);
    return updatedIncident;
  }

  async updateIncidentVerifications(id: number, action: 'confirm' | 'dismiss'): Promise<Incident | undefined> {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;
    
    const updatedIncident = { 
      ...incident,
      verifiedCount: action === 'confirm' ? incident.verifiedCount + 1 : incident.verifiedCount,
      dismissedCount: action === 'dismiss' ? incident.dismissedCount + 1 : incident.dismissedCount,
      active: action === 'dismiss' && incident.dismissedCount >= 3 ? false : incident.active
    };
    
    this.incidents.set(id, updatedIncident);
    return updatedIncident;
  }

  // Verification methods
  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const id = this.currentVerificationId++;
    const verification: Verification = { ...insertVerification, id };
    this.verifications.set(id, verification);
    return verification;
  }

  async getUserVerificationForIncident(userId: number, incidentId: number): Promise<Verification | undefined> {
    return Array.from(this.verifications.values()).find(
      (verification) => verification.userId === userId && verification.incidentId === incidentId,
    );
  }

  // Settings methods
  async getUserSettings(userId: number): Promise<Settings | undefined> {
    return Array.from(this.userSettings.values()).find(
      (settings) => settings.userId === userId,
    );
  }

  async createOrUpdateUserSettings(insertSettings: InsertSettings): Promise<Settings> {
    // Check if settings already exist for this user
    const existingSettings = await this.getUserSettings(insertSettings.userId);
    
    if (existingSettings) {
      // Update existing settings
      const updatedSettings = { ...existingSettings, ...insertSettings };
      this.userSettings.set(existingSettings.id, updatedSettings);
      return updatedSettings;
    } else {
      // Create new settings
      const id = this.currentSettingsId++;
      const settings: Settings = { ...insertSettings, id };
      this.userSettings.set(id, settings);
      return settings;
    }
  }
}

import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, // Using the pool exported from db.ts
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Incident methods
  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const [incident] = await db.insert(incidents).values(insertIncident).returning();
    return incident;
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async getActiveIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents).where(eq(incidents.active, true));
  }

  async getUserIncidents(userId: number): Promise<Incident[]> {
    return await db.select().from(incidents).where(eq(incidents.userId, userId));
  }

  async getNearbyIncidents(lat: string, lon: string, radiusInMeters: number): Promise<Incident[]> {
    // In a real app with PostGIS extension, we would use ST_Distance
    // For now, return all active incidents as if they're nearby
    return await db.select().from(incidents).where(eq(incidents.active, true));
  }

  async updateIncidentStatus(id: number, isActive: boolean): Promise<Incident | undefined> {
    const [incident] = await db
      .update(incidents)
      .set({ active: isActive })
      .where(eq(incidents.id, id))
      .returning();
    return incident;
  }

  async updateIncidentVerifications(id: number, action: 'confirm' | 'dismiss'): Promise<Incident | undefined> {
    // First get the current incident to check counts
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    if (!incident) return undefined;
    
    const updates: Partial<Incident> = {};
    
    if (action === 'confirm') {
      updates.verifiedCount = incident.verifiedCount + 1;
    } else if (action === 'dismiss') {
      updates.dismissedCount = incident.dismissedCount + 1;
      // If dismissed count is 3 or more, set active to false
      if (incident.dismissedCount + 1 >= 3) {
        updates.active = false;
      }
    }
    
    const [updatedIncident] = await db
      .update(incidents)
      .set(updates)
      .where(eq(incidents.id, id))
      .returning();
    
    return updatedIncident;
  }

  // Verification methods
  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const [verification] = await db
      .insert(verifications)
      .values(insertVerification)
      .returning();
    return verification;
  }

  async getUserVerificationForIncident(userId: number, incidentId: number): Promise<Verification | undefined> {
    const [verification] = await db
      .select()
      .from(verifications)
      .where(
        and(
          eq(verifications.userId, userId),
          eq(verifications.incidentId, incidentId)
        )
      );
    return verification;
  }

  // Settings methods
  async getUserSettings(userId: number): Promise<Settings | undefined> {
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));
    return userSettings;
  }

  async createOrUpdateUserSettings(insertSettings: InsertSettings): Promise<Settings> {
    // Check if settings already exist for this user
    const existingSettings = await this.getUserSettings(insertSettings.userId);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(settings)
        .set(insertSettings)
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(settings)
        .values(insertSettings)
        .returning();
      return newSettings;
    }
  }
}

// Import pool from db.ts
import { pool } from "./db";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
