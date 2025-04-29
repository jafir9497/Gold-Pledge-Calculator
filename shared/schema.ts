import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
});

export const interestSchemes = pgTable("interest_schemes", {
  id: serial("id").primaryKey(),
  rate: real("rate").notNull(), // e.g. 0.5, 1.0, 1.5, 2.0
  label: text("label").notNull(), // e.g. "0.5% Interest"
});

export const goldRates = pgTable("gold_rates", {
  id: serial("id").primaryKey(),
  purity: text("purity").notNull(), // "24k", "22k", "18k", "mixed"
  interestSchemeId: integer("interest_scheme_id").notNull().references(() => interestSchemes.id),
  ratePerGram: real("rate_per_gram").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertInterestSchemeSchema = createInsertSchema(interestSchemes).pick({
  rate: true,
  label: true,
});

export const insertGoldRateSchema = createInsertSchema(goldRates).pick({
  purity: true,
  interestSchemeId: true,
  ratePerGram: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInterestScheme = z.infer<typeof insertInterestSchemeSchema>;
export type InterestScheme = typeof interestSchemes.$inferSelect;
export type InsertGoldRate = z.infer<typeof insertGoldRateSchema>;
export type GoldRate = typeof goldRates.$inferSelect;

// Loan calculation schemas
export const loanByAmountSchema = z.object({
  loanAmount: z.number().positive("Loan amount must be positive"),
  purity: z.enum(["24k", "22k", "18k", "mixed"]),
  interestSchemeId: z.number().int().positive("Interest scheme must be selected"),
});

export const loanByWeightSchema = z.object({
  goldWeight: z.number().positive("Gold weight must be positive"),
  purity: z.enum(["24k", "22k", "18k", "mixed"]),
  interestSchemeId: z.number().int().positive("Interest scheme must be selected"),
});

export type LoanByAmount = z.infer<typeof loanByAmountSchema>;
export type LoanByWeight = z.infer<typeof loanByWeightSchema>;

export type LoanCalculation = {
  purity: string;
  interestScheme: InterestScheme;
  principalAmount: number;
  interestAmount: number;
  eligibleAmount: number;
  goldWeight?: number;
  loanAmount?: number;
};
