import {
  users, type User, type InsertUser,
  goldRates, type GoldRate, type InsertGoldRate,
  interestSchemes, type InterestScheme, type InsertInterestScheme
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Gold rate methods
  getGoldRates(): Promise<GoldRate[]>;
  getGoldRate(purity: string, interestSchemeId: number): Promise<GoldRate | undefined>;
  updateGoldRate(goldRate: InsertGoldRate): Promise<GoldRate>;
  deleteGoldRate(id: number): Promise<void>;

  // Interest scheme methods
  getInterestSchemes(): Promise<InterestScheme[]>;
  getInterestScheme(id: number): Promise<InterestScheme | undefined>;
  createInterestScheme(scheme: InsertInterestScheme): Promise<InterestScheme>;
  updateInterestScheme(id: number, scheme: Partial<InsertInterestScheme>): Promise<InterestScheme>;
  deleteInterestScheme(id: number): Promise<void>;

  // Session store
  sessionStore: any; // Use any type to avoid LSP issues
  // Initialize default gold rates if needed
  initDefaultGoldRates(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Use any type to avoid LSP issues

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async initDefaultGoldRates(): Promise<void> {
    // No-op for now, as gold rates are now per scheme
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

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getGoldRates(): Promise<GoldRate[]> {
    return await db.select().from(goldRates);
  }

  async getGoldRate(purity: string, interestSchemeId: number): Promise<GoldRate | undefined> {
    const [goldRate] = await db.select().from(goldRates).where(and(eq(goldRates.purity, purity), eq(goldRates.interestSchemeId, interestSchemeId)));
    return goldRate;
  }

  async updateGoldRate(insertGoldRate: InsertGoldRate): Promise<GoldRate> {
    // Find if rate already exists for this purity and scheme
    const existingRate = await this.getGoldRate(insertGoldRate.purity, insertGoldRate.interestSchemeId);

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

  async deleteGoldRate(id: number): Promise<void> {
    await db.delete(goldRates).where(eq(goldRates.id, id));
  }

  async getInterestSchemes(): Promise<InterestScheme[]> {
    return await db.select().from(interestSchemes);
  }

  async getInterestScheme(id: number): Promise<InterestScheme | undefined> {
    const [scheme] = await db.select().from(interestSchemes).where(eq(interestSchemes.id, id));
    return scheme;
  }

  async createInterestScheme(scheme: InsertInterestScheme): Promise<InterestScheme> {
    const [created] = await db.insert(interestSchemes).values(scheme).returning();
    return created;
  }

  async updateInterestScheme(id: number, scheme: Partial<InsertInterestScheme>): Promise<InterestScheme> {
    const [updated] = await db.update(interestSchemes).set(scheme).where(eq(interestSchemes.id, id)).returning();
    return updated;
  }

  async deleteInterestScheme(id: number): Promise<void> {
    await db.delete(interestSchemes).where(eq(interestSchemes.id, id));
  }
}

export const storage = new DatabaseStorage();
