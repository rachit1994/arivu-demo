import { describe, expect, test } from "vitest";

import { aggregateOrderbookLevelsByStep } from "./aggregateLevelsByStep";

describe("aggregateOrderbookLevelsByStep", () => {
  test("merges bid levels that fall in the same step bucket", () => {
    const out = aggregateOrderbookLevelsByStep(
      [
        { px: 0.452, qty: 10 },
        { px: 0.451, qty: 5 },
        { px: 0.44, qty: 3 },
      ],
      0.01,
      "bid",
    );

    expect(out).toEqual([
      { px: 0.45, qty: 15 },
      { px: 0.44, qty: 3 },
    ]);
  });

  test("sorts asks ascending after merge", () => {
    const out = aggregateOrderbookLevelsByStep(
      [
        { px: 0.48, qty: 1 },
        { px: 0.46, qty: 2 },
      ],
      0.01,
      "ask",
    );

    expect(out.map((l) => l.px)).toEqual([0.46, 0.48]);
  });

  test("returns a copy when step is invalid", () => {
    const src = [{ px: 0.5, qty: 1 }];
    const out = aggregateOrderbookLevelsByStep(src, 0, "bid");
    expect(out).toEqual(src);
    expect(out).not.toBe(src);
  });
});
