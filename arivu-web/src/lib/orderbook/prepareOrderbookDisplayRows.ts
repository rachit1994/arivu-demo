/**
 * Turns aggregated numeric levels into **display rows** with running cumulative size.
 *
 * Convention:
 * - **Bids** arrive best-first (high→low). Cumulative walks away from touch in that order.
 * - **Asks** are processed **low→high** (near touch first) for cumulative math, then
 *   **reversed** to high→low for rendering so the touch sits next to the middle strip
 *   (standard depth chart stacking).
 */
import {
  computeOrderbookCumulativeLevels,
  type CumulativeOrderbookLevel,
  type OrderbookLevel,
} from "./computeOrderbookCumulativeLevels";

export type DisplayOrderbookRow = CumulativeOrderbookLevel;

export const prepareAskRowsHighToLow = (
  asksAscending: ReadonlyArray<OrderbookLevel>,
): DisplayOrderbookRow[] => {
  const cum = computeOrderbookCumulativeLevels(asksAscending);
  const rows: DisplayOrderbookRow[] = asksAscending.map((l, i) => ({
    px: l.px,
    qty: l.qty,
    cumulative: cum[i]?.cumulative ?? 0,
  }));
  return rows.slice().reverse();
};

export const prepareBidRowsHighToLow = (
  bidsDescending: ReadonlyArray<OrderbookLevel>,
): DisplayOrderbookRow[] => {
  return computeOrderbookCumulativeLevels(bidsDescending);
};
