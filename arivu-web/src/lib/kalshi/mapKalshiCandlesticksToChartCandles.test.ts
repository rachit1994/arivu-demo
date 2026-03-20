import { describe, expect, test } from "vitest";

import {
  mapKalshiCandlesticksToChartCandles,
} from "./mapKalshiCandlesticksToChartCandles";

describe("mapKalshiCandlesticksToChartCandles", () => {
  test("fills missing open/high/low/close using last close", () => {
    const resp = {
      ticker: "ev_1",
      candlesticks: [
        {
          price: {
            open_dollars: "0.50",
            high_dollars: "0.55",
            low_dollars: "0.45",
            close_dollars: "0.52",
          },
          volume_fp: "10.00",
        },
        {
          price: {
            open_dollars: null,
            high_dollars: null,
            low_dollars: null,
            close_dollars: null,
          },
          volume_fp: "0.00",
        },
      ],
    };

    const candles = mapKalshiCandlesticksToChartCandles(resp);
    expect(candles.length).toBe(2);
    expect(candles[0]!.open).toBe(0.5);
    expect(candles[0]!.close).toBe(0.52);
    // Second candle should fall back to lastClose=0.52.
    expect(candles[1]!.open).toBe(0.52);
    expect(candles[1]!.close).toBe(0.52);
    expect(candles[1]!.high).toBe(0.52);
    expect(candles[1]!.low).toBe(0.52);
  });
});

