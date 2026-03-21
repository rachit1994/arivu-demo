import type { CandlestickData, HistogramData, UTCTimestamp } from "lightweight-charts";

import type { ChartCandle } from "@/lib/trading/hooks";

const upWickColor = "rgb(0 210 148)";
const upBodyColor = "rgba(0, 210, 148, 0.85)";
const downWickColor = "rgb(255 35 87)";
const downBodyColor = "rgba(255, 35, 87, 0.78)";

export type LightweightSeriesMapped = {
  candlesticks: Array<CandlestickData<UTCTimestamp>>;
  volumes: Array<HistogramData<UTCTimestamp>>;
};

type Args = {
  candles: ReadonlyArray<ChartCandle>;
  startTimeSeconds: number;
  intervalSeconds: number;
};

const assertFinite = (n: number, fallback: number): number => {
  if (!Number.isFinite(n)) return fallback;
  return n;
};

export const mapChartCandlesToLightweightSeriesData = (
  args: Args,
): LightweightSeriesMapped => {
  const interval = assertFinite(args.intervalSeconds, 60);
  const start = assertFinite(args.startTimeSeconds, 0);

  const candlesticks: Array<CandlestickData<UTCTimestamp>> = [];
  const volumes: Array<HistogramData<UTCTimestamp>> = [];

  for (let i = 0; i < args.candles.length; i += 1) {
    const c = args.candles[i]!;
    const time = (start + i * interval) as UTCTimestamp;
    const up = c.close >= c.open;

    candlesticks.push({
      time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      color: up ? upBodyColor : downBodyColor,
      wickColor: up ? upWickColor : downWickColor,
      borderColor: up ? upWickColor : downWickColor,
    });

    volumes.push({
      time,
      value: c.volume,
      color: up ? "rgba(0,210,148,0.45)" : "rgba(255,35,87,0.38)",
    });
  }

  return { candlesticks, volumes };
};

