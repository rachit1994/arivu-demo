export type OrderbookLevel = {
  px: number;
  qty: number;
};

export type CumulativeOrderbookLevel = OrderbookLevel & {
  cumulative: number;
};

export const computeOrderbookCumulativeLevels = (
  levels: ReadonlyArray<OrderbookLevel>,
): CumulativeOrderbookLevel[] => {
  let running = 0;
  const out: CumulativeOrderbookLevel[] = [];

  for (const lv of levels) {
    running += lv.qty;
    out.push({ px: lv.px, qty: lv.qty, cumulative: running });
  }

  return out;
};

