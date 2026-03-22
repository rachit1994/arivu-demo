/**
 * Pads order book display rows to a fixed count so the panel height does not jump when
 * depth is thin. Placeholder rows use **negative sentinel** `px` values (-1, -2, …)
 * that sort away from real prices and are not clickable (`disabled: true`).
 */
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
