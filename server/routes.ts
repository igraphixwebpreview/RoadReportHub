import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertIncidentSchema, insertVerificationSchema, insertSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Incidents Routes
  
  // Get all active incidents
  app.get("/api/incidents", async (req, res, next) => {
    try {
      const incidents = await storage.getActiveIncidents();
      res.status(200).json(incidents);
    } catch (error) {
      next(error);
    }
  });
  
  // Get incidents near coordinates
  app.get("/api/incidents/nearby", async (req, res, next) => {
    try {
      const latString = req.query.lat as string;
      const lonString = req.query.lon as string;
      const radiusString = req.query.radius as string || "5000";
      
      if (!latString || !lonString) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const incidents = await storage.getNearbyIncidents(
        latString,
        lonString,
        parseInt(radiusString, 10)
      );
      
      res.status(200).json(incidents);
    } catch (error) {
      next(error);
    }
  });
  
  // Get a specific incident
  app.get("/api/incidents/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid incident ID" });
      }
      
      const incident = await storage.getIncident(id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      res.status(200).json(incident);
    } catch (error) {
      next(error);
    }
  });
  
  // Get incidents reported by the authenticated user
  app.get("/api/user/incidents", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const incidents = await storage.getUserIncidents(req.user.id);
      res.status(200).json(incidents);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new incident
  app.post("/api/incidents", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Validate request body
      const validatedData = insertIncidentSchema.parse({
        ...req.body,
        userId: req.user.id,
        reportedAt: new Date(),
      });
      
      const incident = await storage.createIncident(validatedData);
      res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  });
  
  // Verification Routes
  
  // Verify (confirm or dismiss) an incident
  app.post("/api/incidents/:id/verify", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const incidentId = parseInt(req.params.id, 10);
      if (isNaN(incidentId)) {
        return res.status(400).json({ message: "Invalid incident ID" });
      }
      
      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      // Check if user already verified this incident
      const existingVerification = await storage.getUserVerificationForIncident(req.user.id, incidentId);
      if (existingVerification) {
        return res.status(400).json({ message: "You have already verified this incident" });
      }
      
      // Validate action
      const action = req.body.action;
      if (action !== 'confirm' && action !== 'dismiss') {
        return res.status(400).json({ message: "Action must be 'confirm' or 'dismiss'" });
      }
      
      // Create verification record
      const verification = await storage.createVerification({
        incidentId,
        userId: req.user.id,
        action,
        timestamp: new Date(),
      });
      
      // Update incident verification counters
      const updatedIncident = await storage.updateIncidentVerifications(incidentId, action);
      
      res.status(200).json({ verification, incident: updatedIncident });
    } catch (error) {
      next(error);
    }
  });
  
  // Settings Routes
  
  // Get user settings
  app.get("/api/settings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let settings = await storage.getUserSettings(req.user.id);
      
      // If no settings exist, create default settings
      if (!settings) {
        settings = await storage.createOrUpdateUserSettings({
          userId: req.user.id,
          sirenEnabled: true,
          vibrationEnabled: true,
          popupAlertsEnabled: true,
          alertDistanceMeters: 500,
        });
      }
      
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  // Update user settings
  app.put("/api/settings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Validate request body
      const validatedData = insertSettingsSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const settings = await storage.createOrUpdateUserSettings(validatedData);
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
