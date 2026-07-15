import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, portfoliosTable, holdingsTable } from "@workspace/db";
import {
  CreatePortfolioBody,
  GetPortfolioParams,
  UpdatePortfolioParams,
  UpdatePortfolioBody,
  DeletePortfolioParams,
  ListPortfoliosResponse,
  GetPortfolioResponse,
  CreatePortfolioResponse,
  UpdatePortfolioResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computePortfolioStats(holdings: { avgCostBasis: string; currentPrice: string; quantity: string }[]) {
  let totalValue = 0;
  let totalCost = 0;
  for (const h of holdings) {
    const qty = parseFloat(h.quantity);
    const price = parseFloat(h.currentPrice);
    const cost = parseFloat(h.avgCostBasis);
    totalValue += qty * price;
    totalCost += qty * cost;
  }
  const gainLoss = totalValue - totalCost;
  const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
  return { totalValue, gainLoss, gainLossPercent };
}

router.get("/portfolios", async (req, res): Promise<void> => {
  const portfolios = await db.select().from(portfoliosTable).orderBy(portfoliosTable.createdAt);
  const result = await Promise.all(
    portfolios.map(async (p) => {
      const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.portfolioId, p.id));
      const stats = computePortfolioStats(holdings);
      return {
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        currency: p.currency,
        createdAt: p.createdAt.toISOString(),
        ...stats,
      };
    }),
  );
  res.json(ListPortfoliosResponse.parse(result));
});

router.post("/portfolios", async (req, res): Promise<void> => {
  const parsed = CreatePortfolioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db.insert(portfoliosTable).values(parsed.data).returning();
  res.status(201).json(
    CreatePortfolioResponse.parse({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      currency: p.currency,
      totalValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      createdAt: p.createdAt.toISOString(),
    }),
  );
});

router.get("/portfolios/:id", async (req, res): Promise<void> => {
  const params = GetPortfolioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [p] = await db.select().from(portfoliosTable).where(eq(portfoliosTable.id, params.data.id));
  if (!p) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }
  const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.portfolioId, p.id));
  const stats = computePortfolioStats(holdings);
  res.json(
    GetPortfolioResponse.parse({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      currency: p.currency,
      createdAt: p.createdAt.toISOString(),
      ...stats,
    }),
  );
});

router.patch("/portfolios/:id", async (req, res): Promise<void> => {
  const params = UpdatePortfolioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePortfolioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db
    .update(portfoliosTable)
    .set(parsed.data)
    .where(eq(portfoliosTable.id, params.data.id))
    .returning();
  if (!p) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }
  const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.portfolioId, p.id));
  const stats = computePortfolioStats(holdings);
  res.json(
    UpdatePortfolioResponse.parse({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      currency: p.currency,
      createdAt: p.createdAt.toISOString(),
      ...stats,
    }),
  );
});

router.delete("/portfolios/:id", async (req, res): Promise<void> => {
  const params = DeletePortfolioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [p] = await db.delete(portfoliosTable).where(eq(portfoliosTable.id, params.data.id)).returning();
  if (!p) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
