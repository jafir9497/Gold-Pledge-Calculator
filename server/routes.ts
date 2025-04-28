import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertGoldRateSchema, loanByAmountSchema, loanByWeightSchema, type LoanCalculation } from "@shared/schema";
import { ZodError } from "zod";

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

  app.post("/api/gold-rates", async (req: Request, res: Response) => {
    try {
      // Ensure user is authenticated and is an admin
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized access" });
      }

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
      const goldWeight = loanAmount / goldRate.ratePerGram;
      
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
      const loanAmount = goldWeight * goldRate.ratePerGram;
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

  const httpServer = createServer(app);
  return httpServer;
}
