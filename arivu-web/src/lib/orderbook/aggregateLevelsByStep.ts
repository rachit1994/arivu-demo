/**
 * Merges raw depth into **tick buckets** (e.g. 0.01) so the UI can show wider spreads
 * without one row per micro-price. Quantities at prices that map to the same bucket add.
 *
 * - Invalid step (non-finite or ≤0): passthrough copy — avoids throwing from toolbar mistakes.
 * - Skips non-finite px/qty and zero/negative qty (defensive against bad API/mock data).
 * - Bucket key uses `round(px / step) * step` with `toFixed(10)` to reduce float jitter.
 * - Sort: bids high→low, asks low→high (canonical for downstream cumulative + display).
 */
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
