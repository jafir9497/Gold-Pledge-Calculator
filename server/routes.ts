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

  // Interest Schemes CRUD
  app.get("/api/interest-schemes", async (_req: Request, res: Response) => {
    try {
      const schemes = await storage.getInterestSchemes();
      res.json(schemes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interest schemes" });
    }
  });

  app.post("/api/interest-schemes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { rate, label } = req.body;
      if (typeof rate !== "number" || !label) {
        return res.status(400).json({ message: "Invalid interest scheme data" });
      }
      const scheme = await storage.createInterestScheme({ rate, label });
      res.status(201).json(scheme);
    } catch (error) {
      res.status(500).json({ message: "Failed to create interest scheme" });
    }
  });

  app.put("/api/interest-schemes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid scheme ID" });
      const scheme = await storage.updateInterestScheme(id, req.body);
      res.json(scheme);
    } catch (error) {
      res.status(500).json({ message: "Failed to update interest scheme" });
    }
  });

  app.delete("/api/interest-schemes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid scheme ID" });
      await storage.deleteInterestScheme(id);
      res.status(200).json({ message: "Interest scheme deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete interest scheme" });
    }
  });

  // Gold Rates CRUD
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

  app.delete("/api/gold-rates/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid gold rate ID" });
      await storage.deleteGoldRate(id);
      res.status(200).json({ message: "Gold rate deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gold rate" });
    }
  });

  // Loan calculation routes (updated)
  app.post("/api/calculate/by-amount", async (req: Request, res: Response) => {
    try {
      const validatedData = loanByAmountSchema.parse(req.body);
      const { loanAmount, purity, interestSchemeId } = validatedData;
      const goldRate = await storage.getGoldRate(purity, interestSchemeId);
      if (!goldRate) {
        return res.status(404).json({ message: `Gold rate for ${purity} and scheme not found` });
      }
      const interestScheme = await storage.getInterestScheme(interestSchemeId);
      if (!interestScheme) {
        return res.status(404).json({ message: `Interest scheme not found` });
      }
      // Calculate loan details
      const interestAmount = loanAmount * (interestScheme.rate / 100);
      const eligibleAmount = loanAmount - interestAmount;
      let baseWeight = loanAmount / goldRate.ratePerGram;
      const interestAdjustmentFactor = 1 + ((2 - interestScheme.rate) / 8);
      const goldWeight = baseWeight * interestAdjustmentFactor;
      const result = {
        purity,
        interestScheme,
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
      const { goldWeight, purity, interestSchemeId } = validatedData;
      const goldRate = await storage.getGoldRate(purity, interestSchemeId);
      if (!goldRate) {
        return res.status(404).json({ message: `Gold rate for ${purity} and scheme not found` });
      }
      const interestScheme = await storage.getInterestScheme(interestSchemeId);
      if (!interestScheme) {
        return res.status(404).json({ message: `Interest scheme not found` });
      }
      let baseLoanAmount = goldWeight * goldRate.ratePerGram;
      const interestAdjustmentFactor = 1 - ((interestScheme.rate - 0.5) / 7.5);
      const loanAmount = baseLoanAmount * interestAdjustmentFactor;
      const interestAmount = loanAmount * (interestScheme.rate / 100);
      const eligibleAmount = loanAmount - interestAmount;
      const result = {
        purity,
        interestScheme,
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
