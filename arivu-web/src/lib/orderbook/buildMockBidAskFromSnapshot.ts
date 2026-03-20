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
