import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertGoldRateSchema, loanByAmountSchema, loanByWeightSchema, type LoanCalculation, insertUserSchema, users } from "@shared/schema";
import { ZodError } from "zod";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Admin-only middleware
function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.isAuthenticated() || req.user?.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized access. Admin privileges required." });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // setup auth routes
  setupAuth(app);

  // Gold rates routes
  app.get("/api/gold-rates", async (_req: Request, res: Response) => {
    try {
      const goldRates = await storage.getGoldRates();
      res.json(goldRates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gold rates" });
    }
  });

  app.post("/api/gold-rates", requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertGoldRateSchema.parse(req.body);
      const goldRate = await storage.updateGoldRate(validatedData);
      res.status(200).json(goldRate);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid gold rate data", errors: error.format() });
      }
      res.status(500).json({ message: "Failed to update gold rate" });
    }
  });

  // Loan calculation routes
  app.post("/api/calculate/by-amount", async (req: Request, res: Response) => {
    try {
      const validatedData = loanByAmountSchema.parse(req.body);
      const { loanAmount, purity, interestRate } = validatedData;
      
      // Get gold rate for the selected purity
      const goldRate = await storage.getGoldRateByPurity(purity);
      if (!goldRate) {
        return res.status(404).json({ message: `Gold rate for ${purity} not found` });
      }
      
      // Calculate loan details
      const interestAmount = loanAmount * (interestRate / 100);
      const eligibleAmount = loanAmount - interestAmount;
      
      // Adjust gold weight based on interest rate
      // Base calculation is loanAmount / goldRate.ratePerGram
      // Apply interest rate adjustment factor: higher interest rates need less gold
      let baseWeight = loanAmount / goldRate.ratePerGram;
      
      // Adjustment factor - For lower interest rates, increase required gold weight
      // If interest rate is 2%, multiplier is 1.0
      // If interest rate is 0.5%, multiplier is around 1.25
      const interestAdjustmentFactor = 1 + ((2 - interestRate) / 8);
      const goldWeight = baseWeight * interestAdjustmentFactor;
      
      const result: LoanCalculation = {
        purity,
        interestRate,
        principalAmount: loanAmount,
        interestAmount,
        eligibleAmount,
        goldWeight,
      };
      
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid calculation data", errors: error.format() });
      }
      res.status(500).json({ message: "Failed to calculate loan by amount" });
    }
  });

  app.post("/api/calculate/by-weight", async (req: Request, res: Response) => {
    try {
      const validatedData = loanByWeightSchema.parse(req.body);
      const { goldWeight, purity, interestRate } = validatedData;
      
      // Get gold rate for the selected purity
      const goldRate = await storage.getGoldRateByPurity(purity);
      if (!goldRate) {
        return res.status(404).json({ message: `Gold rate for ${purity} not found` });
      }
      
      // Calculate loan details
      // Adjust loan amount based on interest rate
      // Base calculation is goldWeight * goldRate.ratePerGram
      let baseLoanAmount = goldWeight * goldRate.ratePerGram;
      
      // Adjustment factor - For higher interest rates, decrease loan amount
      // If interest rate is 2%, multiplier is around 0.8
      // If interest rate is 0.5%, multiplier is 1.0
      const interestAdjustmentFactor = 1 - ((interestRate - 0.5) / 7.5);
      const loanAmount = baseLoanAmount * interestAdjustmentFactor;
      
      const interestAmount = loanAmount * (interestRate / 100);
      const eligibleAmount = loanAmount - interestAmount;
      
      const result: LoanCalculation = {
        purity,
        interestRate,
        principalAmount: loanAmount,
        interestAmount,
        eligibleAmount,
        loanAmount,
      };
      
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid calculation data", errors: error.format() });
      }
      res.status(500).json({ message: "Failed to calculate loan by weight" });
    }
  });

  // User Management Routes (Admin Only)
  app.get("/api/users", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Never send passwords to frontend
      const usersWithoutPasswords = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create the user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.format() });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate only the fields that are being updated
      const validatedData = req.body;
      
      // If username is being changed, check if it already exists
      if (validatedData.username && validatedData.username !== existingUser.username) {
        const userWithSameUsername = await storage.getUserByUsername(validatedData.username);
        if (userWithSameUsername) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // If password is being updated, hash it
      if (validatedData.password) {
        validatedData.password = await hashPassword(validatedData.password);
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Don't allow deleting current user (admin who is logged in)
      if (userId === req.user?.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(userId);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
