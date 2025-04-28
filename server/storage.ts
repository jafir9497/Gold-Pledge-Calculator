import { 
  users, type User, type InsertUser, 
  goldRates, type GoldRate, type InsertGoldRate 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private goldRates: Map<number, GoldRate>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentGoldRateId: number;

  constructor() {
    this.users = new Map();
    this.goldRates = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every day
    });
    this.currentUserId = 1;
    this.currentGoldRateId = 1;
    
    // Initialize with default gold rates
    this.initDefaultGoldRates();
  }

  private initDefaultGoldRates() {
    const defaultRates: InsertGoldRate[] = [
      { purity: "24k", ratePerGram: 6250 },
      { purity: "22k", ratePerGram: 5750 },
      { purity: "18k", ratePerGram: 4650 },
      { purity: "mixed", ratePerGram: 4200 },
    ];
    
    defaultRates.forEach(rate => {
      const id = this.currentGoldRateId++;
      const goldRate: GoldRate = {
        ...rate,
        id,
        updatedAt: new Date(),
      };
      this.goldRates.set(id, goldRate);
    });
  }

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
  
  async getGoldRates(): Promise<GoldRate[]> {
    return Array.from(this.goldRates.values());
  }
  
  async getGoldRateByPurity(purity: string): Promise<GoldRate | undefined> {
    return Array.from(this.goldRates.values()).find(
      (goldRate) => goldRate.purity === purity
    );
  }
  
  async updateGoldRate(insertGoldRate: InsertGoldRate): Promise<GoldRate> {
    // Find if rate already exists for this purity
    const existingRate = await this.getGoldRateByPurity(insertGoldRate.purity);
    
    if (existingRate) {
      // Update existing rate
      const updatedRate: GoldRate = {
        ...existingRate,
        ratePerGram: insertGoldRate.ratePerGram,
        updatedAt: new Date(),
      };
      this.goldRates.set(existingRate.id, updatedRate);
      return updatedRate;
    } else {
      // Create new rate
      const id = this.currentGoldRateId++;
      const goldRate: GoldRate = {
        ...insertGoldRate,
        id,
        updatedAt: new Date(),
      };
      this.goldRates.set(id, goldRate);
      return goldRate;
    }
  }
}

export const storage = new MemStorage();
