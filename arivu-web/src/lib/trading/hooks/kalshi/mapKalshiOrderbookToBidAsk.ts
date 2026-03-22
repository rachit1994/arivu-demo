/**
 * Normalizes Kalshi `orderbook_fp` into numeric YES-space **bids** and **asks**.
 *
 * - `yes_dollars`: YES bids at price p (probability dollars 0–1).
 * - `no_dollars`: NO bids at price p_no; equivalent YES **ask** sits at `1 - p_no` with
 *   the same size (complementarity of binary contracts).
 *
 * Sorting: bids descending (best first), asks ascending (best ask lowest YES price).
 * Mid/spread from top of book; null if either side missing (caller shows mock fallback).
 */
import { parseKalshiFixedPointNumber } from "./formatKalshiFixedPoints";

export type BidAskLevel = {
  px: number;
  qty: number;
};

export type KalshiPriceLevel = [string, string];

export type KalshiOrderbookFp = {
  yes_dollars: KalshiPriceLevel[];
  no_dollars: KalshiPriceLevel[];
};

export const mapKalshiOrderbookToBidAsk = (
  orderbook_fp: KalshiOrderbookFp,
): {
  bids: BidAskLevel[];
  asks: BidAskLevel[];
  mid: number | null;
  spread: number | null;
} => {
  const yesLevels: BidAskLevel[] = orderbook_fp.yes_dollars
    .map((l) => {
      const px = Number(l[0] ?? "");
      const qty = parseKalshiFixedPointNumber(l[1] ?? null);
      if (!Number.isFinite(px) || qty < 0) return null;
      return { px, qty };
    })
    .filter((x): x is BidAskLevel => x !== null);

  const yesAskLevels: BidAskLevel[] = orderbook_fp.no_dollars
    .map((l) => {
      const noPx = Number(l[0] ?? "");
      const qty = parseKalshiFixedPointNumber(l[1] ?? null);
      if (!Number.isFinite(noPx) || qty < 0) return null;
      const yesAskPx = 1 - noPx;
      return { px: yesAskPx, qty };
    })
    .filter((x): x is BidAskLevel => x !== null);

  const bids = [...yesLevels].sort((a, b) => b.px - a.px);
  const asks = [...yesAskLevels].sort((a, b) => a.px - b.px);

  const bestBidPx = bids[0]?.px ?? null;
  const bestAskPx = asks[0]?.px ?? null;

  if (bestBidPx === null || bestAskPx === null) {
    return { bids, asks, mid: null, spread: null };
  }

  const spreadNumRaw = bestAskPx - bestBidPx;
  // Crossed book can happen briefly with stale snapshots — clamp for display math.
  const spreadNum = spreadNumRaw < 0 ? 0 : spreadNumRaw;

  return {
    bids,
    asks,
    mid: bestBidPx + spreadNum / 2,
    spread: spreadNum,
  };
};

