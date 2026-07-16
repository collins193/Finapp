import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const pendingPaymentsTable = pgTable("pending_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  method: text("method").notNull(), // "btc" | "usdt" | "eth"
  status: text("status").notNull().default("pending"), // "pending" | "confirmed" | "rejected"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PendingPayment = typeof pendingPaymentsTable.$inferSelect;
