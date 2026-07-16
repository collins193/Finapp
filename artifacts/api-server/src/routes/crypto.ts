import { Router } from "express";

const router = Router();

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const SUPPORTED_COINS = [
  "bitcoin",
  "ethereum",
  "tether",
  "binancecoin",
  "solana",
  "ripple",
  "cardano",
  "dogecoin",
  "polkadot",
  "avalanche-2",
  "chainlink",
  "litecoin",
];

// GET /crypto/prices — live prices for all supported coins
router.get("/crypto/prices", async (_req, res) => {
  try {
    const ids = SUPPORTED_COINS.join(",");
    const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch prices from CoinGecko" });
    }
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(502).json({ error: "Crypto price fetch failed" });
  }
});

// GET /crypto/:coinId/chart?days=7 — historical OHLC data for chart
router.get("/crypto/:coinId/chart", async (req, res) => {
  const { coinId } = req.params;
  const days = req.query["days"] || "7";

  if (!SUPPORTED_COINS.includes(coinId)) {
    return res.status(400).json({ error: "Unsupported coin" });
  }

  try {
    const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch chart data" });
    }
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(502).json({ error: "Chart data fetch failed" });
  }
});

// GET /crypto/coins — list of supported coins with metadata
router.get("/crypto/coins", async (_req, res) => {
  try {
    const ids = SUPPORTED_COINS.join(",");
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=false`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch coin list" });
    }
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(502).json({ error: "Coin list fetch failed" });
  }
});

export default router;
