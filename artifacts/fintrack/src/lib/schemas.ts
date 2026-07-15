import { z } from "zod"

export const portfolioSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  currency: z.string().min(1, "Currency is required").default("USD"),
})

export const holdingSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  name: z.string().min(1, "Name is required"),
  assetType: z.enum(["stock", "etf", "crypto", "bond", "mutual_fund", "other"]),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  avgCostBasis: z.coerce.number().min(0, "Cost basis must be positive"),
  currentPrice: z.coerce.number().min(0, "Current price must be positive"),
})

export const transactionSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  type: z.enum(["buy", "sell", "dividend", "deposit", "withdrawal"]),
  quantity: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  notes: z.string().optional(),
  transactedAt: z.string(), // expects date string
})

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "on_hold", "completed", "archived"]).default("active"),
  color: z.string().optional(),
  dueDate: z.string().optional(),
})

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  ownerId: z.coerce.number().optional(),
  dueDate: z.string().optional(),
})

export const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
})
