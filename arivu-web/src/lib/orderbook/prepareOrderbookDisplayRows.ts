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
