import { Router } from "express";
import { db } from "@workspace/db";
import { pendingPaymentsTable, usersTable, activityLogsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Middleware: require auth
async function requireAuth(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  req.currentUser = user;
  next();
}

// Middleware: require admin
async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  req.currentUser = user;
  next();
}

// POST /payments/submit — user submits a payment
router.post("/payments/submit", requireAuth, async (req: any, res) => {
  const { amount, method } = req.body;
  if (!amount || !method || isNaN(parseFloat(amount))) {
    return res.status(400).json({ error: "amount and method are required" });
  }
  if (!["btc", "usdt", "eth"].includes(method)) {
    return res.status(400).json({ error: "method must be btc, usdt, or eth" });
  }

  const user = req.currentUser;

  const [payment] = await db
    .insert(pendingPaymentsTable)
    .values({ userId: user.id, amount: parseFloat(amount).toFixed(2), method, status: "pending" })
    .returning();

  // Log for admin visibility
  await db.insert(activityLogsTable).values({
    userId: user.id,
    type: "payment_submitted",
    metadata: {
      paymentId: payment.id,
      amount: parseFloat(amount).toFixed(2),
      method: method.toUpperCase(),
      userName: user.name,
      userEmail: user.email,
    },
  });

  return res.status(201).json(payment);
});

// GET /dashboard/my-activity — current user's own activity
router.get("/dashboard/my-activity", requireAuth, async (req: any, res) => {
  const user = req.currentUser;

  const logs = await db
    .select()
    .from(activityLogsTable)
    .where(eq(activityLogsTable.userId, user.id))
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(20);

  const formatted = logs.map((l) => {
    const meta = l.metadata as Record<string, any> | null;
    let description = "";

    switch (l.type) {
      case "login":
        description = "You signed in to your account";
        break;
      case "signup":
        description = "You created your account";
        break;
      case "balance_increase":
        description = `Your balance was increased by $${meta?.amount ?? ""}`;
        break;
      case "balance_decrease":
        description = `Your balance was decreased by $${meta?.amount ?? ""}`;
        break;
      case "balance_set":
        description = `Your balance was set to $${meta?.newBalance ?? ""}`;
        break;
      case "payment_submitted":
        description = `You submitted a payment of $${meta?.amount ?? ""} via ${meta?.method ?? ""}`;
        break;
      default:
        description = l.type.replace(/_/g, " ");
    }

    return {
      id: l.id,
      type: l.type,
      description,
      timestamp: l.createdAt,
      meta: l.type,
      metadata: l.metadata,
    };
  });

  return res.json(formatted);
});

// GET /admin/payments — list all pending payments (admin only)
router.get("/admin/payments", requireAdmin, async (_req, res) => {
  const payments = await db
    .select({
      id: pendingPaymentsTable.id,
      amount: pendingPaymentsTable.amount,
      method: pendingPaymentsTable.method,
      status: pendingPaymentsTable.status,
      createdAt: pendingPaymentsTable.createdAt,
      userId: pendingPaymentsTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(pendingPaymentsTable)
    .leftJoin(usersTable, eq(pendingPaymentsTable.userId, usersTable.id))
    .orderBy(desc(pendingPaymentsTable.createdAt));

  return res.json(payments);
});

// PATCH /admin/payments/:id — admin confirms or rejects a payment
router.patch("/admin/payments/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!["confirmed", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be confirmed or rejected" });
  }

  const [payment] = await db
    .update(pendingPaymentsTable)
    .set({ status })
    .where(eq(pendingPaymentsTable.id, id))
    .returning();

  if (!payment) return res.status(404).json({ error: "Payment not found" });
  return res.json(payment);
});

export default router;
