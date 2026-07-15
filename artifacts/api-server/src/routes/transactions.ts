import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  ListTransactionsParams,
  CreateTransactionParams,
  CreateTransactionBody,
  DeleteTransactionParams,
  ListTransactionsResponse,
  CreateTransactionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildTransaction(t: {
  id: number;
  portfolioId: number;
  ticker: string;
  type: string;
  quantity: string;
  price: string;
  total: string;
  notes: string | null;
  transactedAt: Date;
  createdAt: Date;
}) {
  return {
    id: t.id,
    portfolioId: t.portfolioId,
    ticker: t.ticker,
    type: t.type,
    quantity: parseFloat(t.quantity),
    price: parseFloat(t.price),
    total: parseFloat(t.total),
    notes: t.notes ?? null,
    transactedAt: t.transactedAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/portfolios/:portfolioId/transactions", async (req, res): Promise<void> => {
  const params = ListTransactionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const txns = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.portfolioId, params.data.portfolioId))
    .orderBy(transactionsTable.transactedAt);
  res.json(ListTransactionsResponse.parse(txns.map(buildTransaction)));
});

router.post("/portfolios/:portfolioId/transactions", async (req, res): Promise<void> => {
  const params = CreateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const total = parsed.data.quantity * parsed.data.price;
  const [t] = await db
    .insert(transactionsTable)
    .values({
      portfolioId: params.data.portfolioId,
      ticker: parsed.data.ticker,
      type: parsed.data.type,
      quantity: String(parsed.data.quantity),
      price: String(parsed.data.price),
      total: String(total),
      notes: parsed.data.notes ?? null,
      transactedAt: new Date(parsed.data.transactedAt),
    })
    .returning();
  res.status(201).json(CreateTransactionResponse.parse(buildTransaction(t)));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [t] = await db.delete(transactionsTable).where(eq(transactionsTable.id, params.data.id)).returning();
  if (!t) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
