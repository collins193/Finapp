import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const holdingsTable = pgTable("holdings", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull().default("stock"),
  quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
  avgCostBasis: numeric("avg_cost_basis", { precision: 18, scale: 8 }).notNull(),
  currentPrice: numeric("current_price", { precision: 18, scale: 8 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHoldingSchema = createInsertSchema(holdingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdingsTable.$inferSelect;
