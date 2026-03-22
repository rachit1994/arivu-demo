"use client";

/**
 * Feeds `CandlestickChart` with either **Kalshi OHLC** rows or a **synthetic** series
 * derived from mock realtime prices.
 *
 * Decision tree (in order):
 * 1. `useKalshiMarketCandlesticks` returns a non-empty `candles` array → use it.
 * 2. Otherwise → fall back to `makeCandlesFromPrices(mock slice)`.
 *
 * Why not only Kalshi when configured? The candle hook returns `[]` while loading,
 * on error, when unconfigured, or when `ticker` is null — the chart would flash empty.
 * Mock candles keep the panel visually alive during those gaps (product choice).
 *
 * Coupling: `activeMarketTickerAtom` + `activeTimeframeAtom` must stay in sync with
 * `TradingUrlSync` / top bar so the fetch key matches the user’s bar selection.
 */

import { useMemo } from "react";

import { useAtom } from "jotai";

import { useMockRealtime } from "@/lib/mockRealtime";
import { useKalshiMarketCandlesticks } from "@/lib/trading/hooks";
import {
  activeMarketTickerAtom,
  activeTimeframeAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";

/** Matches chart consumer: OHLCV in 0–1 style probability space for mock synthesis. */
type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Builds fake candlesticks from a 1D price series (mock websocket ticks).
 * - Needs ≥2 points; fewer → empty array (chart shows flat/empty upstream).
 * - Each segment uses prev→curr as open/close; high/low add asymmetric “wiggle” so bars
 *   look organic rather than a straight line (purely cosmetic for demos).
 * - Volume is a deterministic function of move size so adjacent bars differ slightly.
 */
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

export const useChartPanelCandles = (): Candle[] => {
  const { prices } = useMockRealtime();
  /*
   * Last ~92 ticks: enough segments for a readable chart without recomputing on every
   * tick if the array grows unbounded (slice is cheap; parent `prices` ref identity may
   * still change often — see useMemo below).
   */
  const slice = prices.slice(-92);
  const mockCandles = useMemo(() => makeCandlesFromPrices(slice), [slice]);

  const [marketTicker] = useAtom(activeMarketTickerAtom);
  const [timeframe] = useAtom(activeTimeframeAtom);
  const { candles: kalshiCandles } = useKalshiMarketCandlesticks({
    ticker: marketTicker,
    timeframe,
  });

  /*
   * Prefer Kalshi whenever we have at least one row. Empty Kalshi array means:
   * - no ticker yet, loading, auth missing, network error, or API returned no bars.
   * In all those cases we degrade to mock so the chart column does not look “broken”.
   */
  return kalshiCandles.length > 0 ? kalshiCandles : mockCandles;
};
