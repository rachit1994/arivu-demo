import { describe, expect, test } from "vitest";

import { mapKalshiMarketToBookAndPrice } from "./mapKalshiMarketToBookAndPrice";

describe("mapKalshiMarketToBookAndPrice", () => {
  test("maps yes_bid_dollars/yes_ask_dollars into mid + spread + orderbook", () => {
    const out = mapKalshiMarketToBookAndPrice({
      previousPrices: [],
      market: {
        yes_bid_dollars: "0.48",
        yes_ask_dollars: "0.52",
        yes_bid_size_fp: "1000",
        tick_size: "0.01",
      },
      nowMs: 1703123456789,
      historySize: 240,
      levelCount: 5,
    });

    expect(out.prices).toHaveLength(1);
    expect(out.prices[0]!.v).toBeCloseTo(0.5, 6);
    expect(out.spread).toBe("0.040");
    expect(out.orderbook).toHaveLength(5);
    expect(out.orderbook[0]?.px).toBe("0.48");
    expect(out.orderbook[4]?.px).toBe("0.44");
    expect(out.orderbook[0]?.qty).toBe("1000");
  });

  test("falls back when bid/ask are missing", () => {
    const out = mapKalshiMarketToBookAndPrice({
      previousPrices: [{ t: 1, v: 0.6 }],
      market: { yes_bid_dollars: undefined, yes_ask_dollars: undefined },
      nowMs: 2,
      historySize: 240,
      levelCount: 5,
    });

    expect(out.prices).toEqual([{ t: 1, v: 0.6 }]);
    expect(out.orderbook).toEqual([]);
    expect(out.spread).toBe("0.000");
  });
});

