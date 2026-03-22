/**
 * Converts the **string-based** mock snapshot ladder (`MockSnapshot.orderbook`) into
 * numeric `OrderbookLevel[]` for both sides so `aggregateOrderbookLevelsByStep` can run.
 *
 * Mock snapshot only stores **bid-style** levels (see `computeTick`). This helper:
 * - Parses bid px/qty (qty strings may contain thousands separators).
 * - Infers **tick** from the gap between first and second bid, else 0.01.
 * - Builds a synthetic **ask** ladder starting at `bestBid + spread` (spread from snapshot string),
 *   stepping up by `tick`. Sizes mirror bids in reverse index so depth is not flat.
 *
 * Edge case: non-finite `spread` → treats spread as 0 (asks stack on best bid — odd but bounded).
 */
import type { OrderbookLevel } from "./computeOrderbookCumulativeLevels";

const parseQty = (raw: string): number => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return 0;
  return Number(trimmed.replaceAll(",", ""));
};

export const buildMockBidAskFromSnapshot = (args: {
  orderbook: ReadonlyArray<{ px: string; qty: string }>;
  spread: string;
}): { bids: OrderbookLevel[]; asks: OrderbookLevel[] } => {
  const bids = args.orderbook.map((l) => ({
    px: Number(l.px),
    qty: parseQty(l.qty),
  }));

  const bestBid = bids.at(0)?.px ?? 0;
  const tick =
    bids.length >= 2
      ? Math.abs((bids.at(0)?.px ?? 0) - (bids.at(1)?.px ?? 0))
      : 0.01;
  const spreadNum = Number(args.spread);
  const bestAsk = bestBid + (Number.isFinite(spreadNum) ? spreadNum : 0);
  const asks = bids.map((b, i) => ({
    px: bestAsk + i * tick,
    qty: bids.at(bids.length - 1 - i)?.qty ?? b.qty,
  }));

  return { bids, asks };
};
