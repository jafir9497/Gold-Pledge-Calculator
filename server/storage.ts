import { 
  users, type User, type InsertUser, 
  goldRates, type GoldRate, type InsertGoldRate 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Gold rate methods
  getGoldRates(): Promise<GoldRate[]>;
  getGoldRateByPurity(purity: string): Promise<GoldRate | undefined>;
  updateGoldRate(goldRate: InsertGoldRate): Promise<GoldRate>;
  
  // Session store
  sessionStore: session.SessionStore;
  // Initialize default gold rates if needed
  initDefaultGoldRates(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async initDefaultGoldRates(): Promise<void> {
    // Check if we already have gold rates
    const existingRates = await this.getGoldRates();
    if (existingRates.length > 0) {
      return;
    }
    
    // Initialize with default gold rates
    const defaultRates: InsertGoldRate[] = [
      { purity: "24k", ratePerGram: 6250 },
      { purity: "22k", ratePerGram: 5750 },
      { purity: "18k", ratePerGram: 4650 },
      { purity: "mixed", ratePerGram: 4200 },
    ];
    
    for (const rate of defaultRates) {
      await this.updateGoldRate(rate);
    }
  }

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
  
  async getGoldRates(): Promise<GoldRate[]> {
    return await db.select().from(goldRates);
  }
  
  async getGoldRateByPurity(purity: string): Promise<GoldRate | undefined> {
    const [goldRate] = await db.select().from(goldRates).where(eq(goldRates.purity, purity));
    return goldRate;
  }
  
  async updateGoldRate(insertGoldRate: InsertGoldRate): Promise<GoldRate> {
    // Find if rate already exists for this purity
    const existingRate = await this.getGoldRateByPurity(insertGoldRate.purity);
    
    if (existingRate) {
      // Update existing rate
      const [updatedRate] = await db.update(goldRates)
        .set({ 
          ratePerGram: insertGoldRate.ratePerGram,
          updatedAt: new Date(),
        })
        .where(eq(goldRates.id, existingRate.id))
        .returning();
      return updatedRate;
    } else {
      // Create new rate
      const [goldRate] = await db.insert(goldRates)
        .values({
          ...insertGoldRate,
          updatedAt: new Date(),
        })
        .returning();
      return goldRate;
    }
  }
}

export const storage = new DatabaseStorage();
