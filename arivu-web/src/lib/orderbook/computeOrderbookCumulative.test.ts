import { describe, expect, test } from "vitest";

import { computeOrderbookCumulativeLevels } from "./computeOrderbookCumulativeLevels";

describe("computeOrderbookCumulativeLevels", () => {
  describe("Positive cases", () => {
    test("computes running totals in order", () => {
      const out = computeOrderbookCumulativeLevels([
        { px: 0.4, qty: 2 },
        { px: 0.45, qty: 3 },
        { px: 0.5, qty: 5 },
      ]);

      expect(out).toEqual([
        { px: 0.4, qty: 2, cumulative: 2 },
        { px: 0.45, qty: 3, cumulative: 5 },
        { px: 0.5, qty: 5, cumulative: 10 },
      ]);
    });
  });

  describe("Negative cases", () => {
    test("returns empty array for empty input", () => {
      const out = computeOrderbookCumulativeLevels([]);
      expect(out).toEqual([]);
    });
  });
});

