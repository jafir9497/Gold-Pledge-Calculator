import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
});

export const goldRates = pgTable("gold_rates", {
  id: serial("id").primaryKey(),
  purity: text("purity").notNull(), // "24k", "22k", "18k", "mixed"
  ratePerGram: real("rate_per_gram").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const interestSchemes = pgTable("interest_schemes", {
  id: serial("id").primaryKey(),
  rate: real("rate").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInterestSchemeSchema = z.object({
  rate: z.number().positive("Rate must be positive").step(0.1, "Rate can have up to 1 decimal place"),
  label: z.string().min(1, "Label is required").regex(/^[\w\s%.-]+$/, "Label can only contain letters, numbers, spaces, and . - %"),
});

export type InsertInterestScheme = z.infer<typeof insertInterestSchemeSchema>;
export type InterestScheme = typeof interestSchemes.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGoldRateSchema = createInsertSchema(goldRates).pick({
  purity: true,
  ratePerGram: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGoldRate = z.infer<typeof insertGoldRateSchema>;
export type GoldRate = typeof goldRates.$inferSelect;

// Loan calculation schemas
export const loanByAmountSchema = z.object({
  loanAmount: z.number().positive("Loan amount must be positive"),
  purity: z.enum(["24k", "22k", "18k", "mixed"]),
  interestRate: z.number().positive("Interest rate must be positive"),
});

export const loanByWeightSchema = z.object({
  goldWeight: z.number().positive("Gold weight must be positive"),
  purity: z.enum(["24k", "22k", "18k", "mixed"]),
  interestRate: z.number().positive("Interest rate must be positive"),
});

export type LoanByAmount = z.infer<typeof loanByAmountSchema>;
export type LoanByWeight = z.infer<typeof loanByWeightSchema>;

export type LoanCalculation = {
  purity: string;
  interestRate: number;
  principalAmount: number;
  interestAmount: number;
  eligibleAmount: number;
  goldWeight?: number;
  loanAmount?: number;
};
