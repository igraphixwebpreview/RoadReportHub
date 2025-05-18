import { db } from './firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  type User, type InsertUser,
  type Incident, type InsertIncident,
  type Verification, type InsertVerification,
  type Settings, type InsertSettings,
} from '@shared/schema';
import session from 'express-session';
import { Store } from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export class FirebaseStorage {
  public sessionStore: Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: doc.id,
      username: data?.username || '',
      password: data?.password || '',
      email: data?.email || null,
      avatarUrl: data?.avatarUrl || null
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      username: data.username,
      password: data.password,
      email: data.email || null,
      avatarUrl: data.avatarUrl || null
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const docRef = db.collection('users').doc();
    const newUser = {
      ...user,
      id: docRef.id
    };
    await docRef.set(newUser);
    return {
      id: docRef.id,
      username: user.username,
      password: user.password,
      email: user.email || null,
      avatarUrl: user.avatarUrl || null
    };
  }

  // Incident methods
  async createIncident(incident: InsertIncident): Promise<Incident> {
    const docRef = db.collection('incidents').doc();
    const newIncident = {
      ...incident,
      id: docRef.id,
      createdAt: FieldValue.serverTimestamp()
    };
    await docRef.set(newIncident);
    return {
      ...newIncident,
      createdAt: new Date()
    } as Incident;
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const doc = await db.collection('incidents').doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      reportedAt: data?.reportedAt?.toDate() || new Date()
    } as Incident;
  }

  async getActiveIncidents(): Promise<Incident[]> {
    const snapshot = await db.collection('incidents')
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        reportedAt: data?.reportedAt?.toDate() || new Date()
      } as Incident;
    });
  }

  async getUserIncidents(userId: string): Promise<Incident[]> {
    const snapshot = await db.collection('incidents')
      .where('userId', '==', userId)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        reportedAt: data?.reportedAt?.toDate() || new Date()
      } as Incident;
    });
  }

  async getNearbyIncidents(lat: string, lon: string, radiusInMeters: number): Promise<Incident[]> {
    // TODO: Implement geospatial query
    const snapshot = await db.collection('incidents')
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Incident[];
  }

  async updateIncidentStatus(id: string, isActive: boolean): Promise<Incident | undefined> {
    const docRef = db.collection('incidents').doc(id);
    await docRef.update({ isActive });
    return this.getIncident(id);
  }

  async updateIncidentVerifications(id: string, action: 'confirm' | 'dismiss'): Promise<Incident | undefined> {
    const docRef = db.collection('incidents').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const data = doc.data();
    const updates: any = {};
    
    if (action === 'confirm') {
      updates.confirmations = (data?.confirmations || 0) + 1;
    } else {
      updates.dismissals = (data?.dismissals || 0) + 1;
    }

    await docRef.update(updates);
    return this.getIncident(id);
  }

  // Verification methods
  async createVerification(verification: InsertVerification): Promise<Verification> {
    const docRef = db.collection('verifications').doc();
    const newVerification = {
      ...verification,
      id: docRef.id,
      timestamp: FieldValue.serverTimestamp()
    };
    await docRef.set(newVerification);
    return {
      ...newVerification,
      timestamp: new Date()
    } as Verification;
  }

  async getUserVerificationForIncident(userId: string, incidentId: string): Promise<Verification | undefined> {
    const snapshot = await db.collection('verifications')
      .where('userId', '==', userId)
      .where('incidentId', '==', incidentId)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data
    } as Verification;
  }

  // Settings methods
  async getUserSettings(userId: string): Promise<Settings | undefined> {
    const doc = await db.collection('settings').doc(userId).get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: doc.id,
      ...data
    } as Settings;
  }

  async createOrUpdateUserSettings(settings: InsertSettings): Promise<Settings> {
    const docRef = db.collection('settings').doc(settings.userId);
    await docRef.set(settings, { merge: true });
    return this.getUserSettings(settings.userId) as Promise<Settings>;
  }
} 