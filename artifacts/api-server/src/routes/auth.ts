import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, activityLogsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role: "user", balance: "0.00" }).returning();

  // Log signup
  await db.insert(activityLogsTable).values({
    userId: user.id,
    type: "signup",
    metadata: { name: user.name, email: user.email },
  });

  (req.session as any).userId = user.id;

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    balance: user.balance,
    createdAt: user.createdAt,
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Log login
  await db.insert(activityLogsTable).values({
    userId: user.id,
    type: "login",
    metadata: { name: user.name, email: user.email },
  });

  (req.session as any).userId = user.id;

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    balance: user.balance,
    createdAt: user.createdAt,
  });
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /auth/me
router.get("/auth/me", async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    balance: user.balance,
    createdAt: user.createdAt,
  });
});

export default router;
