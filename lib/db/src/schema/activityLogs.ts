import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "login" | "signup" | "balance_increase" | "balance_decrease" | "balance_set"
  metadata: jsonb("metadata"), // { amount, previousBalance, newBalance, ip, etc. }
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
