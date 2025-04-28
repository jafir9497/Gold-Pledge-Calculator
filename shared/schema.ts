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

export const interestSchemes = [
  { id: 1, rate: 0.5, label: "0.5% Interest" },
  { id: 2, rate: 1.0, label: "1.0% Interest" },
  { id: 3, rate: 1.5, label: "1.5% Interest" },
  { id: 4, rate: 2.0, label: "2.0% Interest" },
];

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
