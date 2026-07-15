import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, holdingsTable } from "@workspace/db";
import {
  ListHoldingsParams,
  CreateHoldingParams,
  CreateHoldingBody,
  UpdateHoldingParams,
  UpdateHoldingBody,
  DeleteHoldingParams,
  ListHoldingsResponse,
  CreateHoldingResponse,
  UpdateHoldingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildHolding(h: {
  id: number;
  portfolioId: number;
  ticker: string;
  name: string;
  assetType: string;
  quantity: string;
  avgCostBasis: string;
  currentPrice: string;
  createdAt: Date;
}) {
  const qty = parseFloat(h.quantity);
  const price = parseFloat(h.currentPrice);
  const cost = parseFloat(h.avgCostBasis);
  const marketValue = qty * price;
  const gainLoss = marketValue - qty * cost;
  const gainLossPercent = qty * cost > 0 ? (gainLoss / (qty * cost)) * 100 : 0;
  return {
    id: h.id,
    portfolioId: h.portfolioId,
    ticker: h.ticker,
    name: h.name,
    assetType: h.assetType,
    quantity: qty,
    avgCostBasis: cost,
    currentPrice: price,
    marketValue,
    gainLoss,
    gainLossPercent,
    createdAt: h.createdAt.toISOString(),
  };
}

router.get("/portfolios/:portfolioId/holdings", async (req, res): Promise<void> => {
  const params = ListHoldingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const holdings = await db
    .select()
    .from(holdingsTable)
    .where(eq(holdingsTable.portfolioId, params.data.portfolioId));
  res.json(ListHoldingsResponse.parse(holdings.map(buildHolding)));
});

router.post("/portfolios/:portfolioId/holdings", async (req, res): Promise<void> => {
  const params = CreateHoldingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateHoldingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [h] = await db
    .insert(holdingsTable)
    .values({
      portfolioId: params.data.portfolioId,
      ticker: parsed.data.ticker,
      name: parsed.data.name,
      assetType: parsed.data.assetType,
      quantity: String(parsed.data.quantity),
      avgCostBasis: String(parsed.data.avgCostBasis),
      currentPrice: String(parsed.data.currentPrice),
    })
    .returning();
  res.status(201).json(CreateHoldingResponse.parse(buildHolding(h)));
});

router.patch("/holdings/:id", async (req, res): Promise<void> => {
  const params = UpdateHoldingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateHoldingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, string> = {};
  if (parsed.data.quantity !== undefined) updateData.quantity = String(parsed.data.quantity);
  if (parsed.data.avgCostBasis !== undefined) updateData.avgCostBasis = String(parsed.data.avgCostBasis);
  if (parsed.data.currentPrice !== undefined) updateData.currentPrice = String(parsed.data.currentPrice);

  const [h] = await db
    .update(holdingsTable)
    .set(updateData)
    .where(eq(holdingsTable.id, params.data.id))
    .returning();
  if (!h) {
    res.status(404).json({ error: "Holding not found" });
    return;
  }
  res.json(UpdateHoldingResponse.parse(buildHolding(h)));
});

router.delete("/holdings/:id", async (req, res): Promise<void> => {
  const params = DeleteHoldingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [h] = await db.delete(holdingsTable).where(eq(holdingsTable.id, params.data.id)).returning();
  if (!h) {
    res.status(404).json({ error: "Holding not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
