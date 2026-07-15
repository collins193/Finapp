import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, activityLogsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Middleware: require admin
async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  req.adminUser = user;
  next();
}

// GET /admin/users — list all users
router.get("/admin/users", requireAdmin, async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      balance: usersTable.balance,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  return res.json(users);
});

// PATCH /admin/users/:id/balance — set, increase, or decrease balance
router.patch("/admin/users/:id/balance", requireAdmin, async (req: any, res) => {
  const id = Number(req.params.id);
  const { action, amount } = req.body; // action: "set" | "increase" | "decrease"

  if (!action || amount === undefined || isNaN(Number(amount))) {
    return res.status(400).json({ error: "action and amount are required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const prev = parseFloat(user.balance);
  let next: number;

  if (action === "set") next = parseFloat(amount);
  else if (action === "increase") next = prev + parseFloat(amount);
  else if (action === "decrease") next = Math.max(0, prev - parseFloat(amount));
  else return res.status(400).json({ error: "action must be set | increase | decrease" });

  const [updated] = await db
    .update(usersTable)
    .set({ balance: next.toFixed(2) })
    .where(eq(usersTable.id, id))
    .returning();

  // Log the balance change
  await db.insert(activityLogsTable).values({
    userId: id,
    type: action === "increase" ? "balance_increase" : action === "decrease" ? "balance_decrease" : "balance_set",
    metadata: {
      previousBalance: prev.toFixed(2),
      newBalance: next.toFixed(2),
      amount: parseFloat(amount).toFixed(2),
      adminId: req.adminUser.id,
      adminName: req.adminUser.name,
    },
  });

  return res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    balance: updated.balance,
  });
});

// GET /admin/activity — all activity logs with user info
router.get("/admin/activity", requireAdmin, async (_req, res) => {
  const logs = await db
    .select({
      id: activityLogsTable.id,
      type: activityLogsTable.type,
      metadata: activityLogsTable.metadata,
      createdAt: activityLogsTable.createdAt,
      userId: activityLogsTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(activityLogsTable)
    .leftJoin(usersTable, eq(activityLogsTable.userId, usersTable.id))
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(200);

  return res.json(logs);
});

export default router;
