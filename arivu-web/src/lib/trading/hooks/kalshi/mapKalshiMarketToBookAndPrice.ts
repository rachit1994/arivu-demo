import type { BookLevel, PricePoint } from "@/lib/mockRealtime/types";

export type KalshiMarketTopOfBook = {
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  yes_bid_size_fp?: string;
  tick_size?: string;
};

type Result = {
  prices: PricePoint[];
  orderbook: BookLevel[];
  spread: string;
};

const parseFiniteNumber = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
};

const formatPx = (n: number): string => n.toFixed(2);

const formatSpread = (n: number): string => n.toFixed(3);

const buildOrderbook = (opts: {
  bestBid: number;
  tickSize: number;
  levelCount: number;
  bidQty: string;
}): BookLevel[] => {
  const { bestBid, tickSize, levelCount, bidQty } = opts;

  const out: BookLevel[] = [];
  for (let i = 0; i < levelCount; i += 1) {
    const px = Math.max(0, bestBid - i * tickSize);
    out.push({ px: formatPx(px), qty: bidQty });
  }
  return out;
};

export const mapKalshiMarketToBookAndPrice = (args: {
  previousPrices: PricePoint[];
  market: KalshiMarketTopOfBook;
  nowMs: number;
  historySize: number;
  levelCount: number;
}): Result => {
  const {
    previousPrices,
    market,
    nowMs,
    historySize,
    levelCount,
  } = args;

  const bestBid = parseFiniteNumber(market.yes_bid_dollars);
  const bestAsk = parseFiniteNumber(market.yes_ask_dollars);
  if (bestBid === null || bestAsk === null) {
    return {
      prices: previousPrices,
      orderbook: [],
      spread: "0.000",
    };
  }

  const tickSizeRaw = parseFiniteNumber(market.tick_size);
  const tickSize = tickSizeRaw && tickSizeRaw > 0 ? tickSizeRaw : 0.01;

  const mid = (bestBid + bestAsk) / 2;
  const spreadNum = Math.max(0, bestAsk - bestBid);

  const bidQty = market.yes_bid_size_fp ?? "0";
  const orderbook = buildOrderbook({
    bestBid,
    tickSize,
    levelCount,
    bidQty,
  });

  const nextPrices: PricePoint[] = [
    ...previousPrices,
    { t: nowMs, v: mid },
  ].slice(-historySize);

  return {
    prices: nextPrices,
    orderbook,
    spread: formatSpread(spreadNum),
  };
};

