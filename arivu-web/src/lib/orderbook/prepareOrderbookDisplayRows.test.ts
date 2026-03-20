import { describe, expect, test } from "vitest";

import {
  prepareAskRowsHighToLow,
  prepareBidRowsHighToLow,
} from "./prepareOrderbookDisplayRows";

describe("prepareOrderbookDisplayRows", () => {
  test("asks: highest price row first with full cumulative", () => {
    const rows = prepareAskRowsHighToLow([
      { px: 0.5, qty: 2 },
      { px: 0.51, qty: 3 },
      { px: 0.52, qty: 1 },
    ]);

    expect(rows[0]?.px).toBe(0.52);
    expect(rows[0]?.cumulative).toBe(6);
    expect(rows.at(-1)?.px).toBe(0.5);
    expect(rows.at(-1)?.cumulative).toBe(2);
  });

  test("bids: best bid first, cumulative grows away from spread", () => {
    const rows = prepareBidRowsHighToLow([
      { px: 0.49, qty: 4 },
      { px: 0.48, qty: 2 },
    ]);

    expect(rows[0]?.cumulative).toBe(4);
    expect(rows[1]?.cumulative).toBe(6);
  });
});
