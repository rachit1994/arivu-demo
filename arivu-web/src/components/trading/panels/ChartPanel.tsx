"use client";

import { useMemo } from "react";
import { useMockRealtime } from "@/lib/mockRealtime";

import { PanelFrame } from "./PanelFrame";
import { CandlestickChart } from "./CandlestickChart";
import { useAtom } from "jotai";
import {
  activeMarketTickerAtom,
  activeTimeframeAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";
import { useKalshiMarketCandlesticks } from "@/lib/kalshi/useKalshiMarketCandlesticks";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const makeCandlesFromPrices = (
  prices: Array<{ t: number; v: number }>,
): Candle[] => {
  const out: Candle[] = [];
  if (prices.length < 2) return out;

  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1].v;
    const curr = prices[i].v;
    const span = Math.abs(curr - prev);
    const wiggle = Math.max(span * 0.35, 0.001);

    const open = prev;
    const close = curr;
    const high = Math.max(open, close) + wiggle * 1.2;
    const low = Math.min(open, close) - wiggle * 0.9;
    const volume = 300 + Math.round(span * 5000);

    out.push({ open, high, low, close, volume });
  }

  return out;
};

export const ChartPanel = () => {
  const { prices } = useMockRealtime();
  const slice = prices.slice(-92);
  const mockCandles = useMemo(() => makeCandlesFromPrices(slice), [slice]);

  const [marketTicker] = useAtom(activeMarketTickerAtom);
  const [timeframe] = useAtom(activeTimeframeAtom);
  const { candles: kalshiCandles } = useKalshiMarketCandlesticks({
    ticker: marketTicker,
    timeframe,
  });

  const candlesToRender = kalshiCandles.length > 0 ? kalshiCandles : mockCandles;

  return (
    <div data-testid="chart-panel" className="flex h-full min-h-0 flex-col">
      <PanelFrame title="Chart">
        <CandlestickChart candles={candlesToRender} />
      </PanelFrame>
    </div>
  );
};
