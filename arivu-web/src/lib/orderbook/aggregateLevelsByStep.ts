import type { OrderbookLevel } from "./computeOrderbookCumulativeLevels";

export const aggregateOrderbookLevelsByStep = (
  levels: ReadonlyArray<OrderbookLevel>,
  step: number,
  side: "bid" | "ask",
): OrderbookLevel[] => {
  if (!Number.isFinite(step) || step <= 0) {
    return levels.map((l) => ({ px: l.px, qty: l.qty }));
  }

  const buckets = new Map<number, number>();

  for (const lv of levels) {
    if (!Number.isFinite(lv.px) || !Number.isFinite(lv.qty) || lv.qty <= 0) {
      continue;
    }
    const n = Math.round(lv.px / step);
    const pxKey = Number((n * step).toFixed(10));
    buckets.set(pxKey, (buckets.get(pxKey) ?? 0) + lv.qty);
  }

  const merged: OrderbookLevel[] = [...buckets.entries()].map(([px, qty]) => ({
    px,
    qty,
  }));

  switch (side) {
    case "bid":
      merged.sort((a, b) => b.px - a.px);
      return merged;
    case "ask":
      merged.sort((a, b) => a.px - b.px);
      return merged;
    default: {
      const _e: never = side;
      return _e;
    }
  }
};
