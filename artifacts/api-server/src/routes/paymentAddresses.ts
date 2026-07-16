import { Router } from "express";
import { db } from "@workspace/db";
import { paymentAddressesTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Middleware: require admin
async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
}

// GET /payment-addresses — public, returns all three payment methods
router.get("/payment-addresses", async (_req, res) => {
  const addresses = await db.select().from(paymentAddressesTable).orderBy(paymentAddressesTable.type);
  return res.json(addresses);
});

// PUT /admin/payment-addresses — admin sets all three at once
// Body: { btc?: { address, label }, usdt?: { address, label }, eth?: { address, label } }
router.put("/admin/payment-addresses", requireAdmin, async (req, res) => {
  const { btc, usdt, eth } = req.body;
  const updates: { type: string; address: string; label?: string }[] = [];
  if (btc?.address) updates.push({ type: "btc", address: btc.address, label: btc.label || "Bitcoin (BTC)" });
  if (usdt?.address) updates.push({ type: "usdt", address: usdt.address, label: usdt.label || "Tether (USDT - TRC20)" });
  if (eth?.address) updates.push({ type: "eth", address: eth.address, label: eth.label || "Ethereum (ETH)" });

  if (updates.length === 0) {
    return res.status(400).json({ error: "No addresses provided" });
  }

  const results = await Promise.all(
    updates.map((u) =>
      db
        .insert(paymentAddressesTable)
        .values({ type: u.type, address: u.address, label: u.label })
        .onConflictDoUpdate({
          target: paymentAddressesTable.type,
          set: { address: u.address, label: u.label },
        })
        .returning()
    )
  );

  return res.json(results.flat());
});

export default router;
