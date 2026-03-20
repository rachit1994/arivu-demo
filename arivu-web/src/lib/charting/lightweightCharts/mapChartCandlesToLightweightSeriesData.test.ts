import { describe, expect, test } from "vitest";

import { mapChartCandlesToLightweightSeriesData } from "./mapChartCandlesToLightweightSeriesData";

describe("mapChartCandlesToLightweightSeriesData", () => {
  describe("Positive cases", () => {
    test("maps candles and volumes with deterministic timestamps", () => {
      const out = mapChartCandlesToLightweightSeriesData({
        startTimeSeconds: 1000,
        intervalSeconds: 60,
        candles: [
          { open: 0.5, high: 0.6, low: 0.45, close: 0.55, volume: 10 },
          { open: 0.55, high: 0.7, low: 0.52, close: 0.53, volume: 25 },
        ],
      });

      expect(out.candlesticks).toHaveLength(2);
      expect(out.volumes).toHaveLength(2);

      expect(out.candlesticks[0]?.time).toBe(1000);
      expect(out.candlesticks[1]?.time).toBe(1060);
      expect(out.volumes[0]?.time).toBe(1000);
      expect(out.volumes[1]?.time).toBe(1060);

      expect(out.candlesticks[0]).toMatchObject({
        open: 0.5,
        high: 0.6,
        low: 0.45,
        close: 0.55,
      });
      expect(out.volumes[0]).toMatchObject({ value: 10 });
    });
  });

  describe("Negative cases", () => {
    test("uses safe fallbacks when args contain non-finite numbers", () => {
      const out = mapChartCandlesToLightweightSeriesData({
        startTimeSeconds: Number.NaN,
        intervalSeconds: Number.POSITIVE_INFINITY,
        candles: [{ open: 1, high: 1, low: 1, close: 1, volume: 1 }],
      });

      expect(out.candlesticks[0]?.time).toBe(0);
    });
  });
});

