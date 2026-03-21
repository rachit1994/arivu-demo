import { parseKalshiFixedPointNumber } from "./formatKalshiFixedPoints";

export type ChartCandle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type KalshiPriceDistribution = {
  open_dollars: string | null;
  low_dollars: string | null;
  high_dollars: string | null;
  close_dollars: string | null;
};

type KalshiCandlestick = {
  price: KalshiPriceDistribution;
  volume_fp: string;
};

export type KalshiCandlesticksResponse = {
  ticker: string;
  candlesticks: KalshiCandlestick[];
};

export const mapKalshiCandlesticksToChartCandles = (
  resp: KalshiCandlesticksResponse,
): ChartCandle[] => {
  let lastClose: number | null = null;
  const out: ChartCandle[] = [];

  for (const c of resp.candlesticks) {
    const openRaw = c.price.open_dollars;
    const highRaw = c.price.high_dollars;
    const lowRaw = c.price.low_dollars;
    const closeRaw = c.price.close_dollars;

    const open: number =
      openRaw === null ? (lastClose ?? 0) : parseKalshiFixedPointNumber(openRaw);
    const close: number =
      closeRaw === null ? (lastClose ?? open) : parseKalshiFixedPointNumber(closeRaw);

    const computedHigh =
      highRaw === null
        ? Math.max(open, close)
        : parseKalshiFixedPointNumber(highRaw);
    const computedLow =
      lowRaw === null
        ? Math.min(open, close)
        : parseKalshiFixedPointNumber(lowRaw);

    const volume = parseKalshiFixedPointNumber(c.volume_fp);
    out.push({ open, high: computedHigh, low: computedLow, close, volume });
    lastClose = close;
  }

  return out;
};

