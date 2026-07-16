import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const paymentAddressesTable = pgTable("payment_addresses", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().unique(), // "btc" | "usdt" | "eth"
  address: text("address").notNull(),
  label: text("label"), // optional human-readable label
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PaymentAddress = typeof paymentAddressesTable.$inferSelect;
