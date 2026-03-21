import type { DisplayOrderbookRow } from "@/lib/orderbook/prepareOrderbookDisplayRows";

export type PaddedOrderbookRow = DisplayOrderbookRow & { disabled: boolean };

export const padOrderbookRows = (
  rows: DisplayOrderbookRow[],
  count: number,
): PaddedOrderbookRow[] => {
  const out: PaddedOrderbookRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const r = rows[i];
    if (r) {
      out.push({ ...r, disabled: false });
      continue;
    }
    out.push({
      px: -i - 1,
      qty: 0,
      cumulative: 0,
      disabled: true,
    });
  }
  return out;
};
