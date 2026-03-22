"use client";

/**
 * Fetches OHLC candlesticks for the active Kalshi market + timeframe.
 *
 * Flow:
 * 1. Resolve **series ticker** from `/markets/{ticker}` (Kalshi needs series + market).
 * 2. Request candlesticks for a rolling window derived from `timeframe` (see mappers below).
 * 3. Map API payload → chart-friendly numbers via `mapKalshiCandlesticksToChartCandles`.
 *
 * Edge cases:
 * - `ticker === null`: clear state, no network (chart panel uses mock fallback).
 * - `unconfigured` from `kalshiAuthedJsonGet`: empty candles, no error — same as “no keys”.
 * - Abort + 8s timeout per request phase: stale responses discarded on unmount/param change.
 * - Malformed JSON: surfaces as `error` string and empty candles (caller may ignore `error`).
 */

import { useEffect, useMemo, useState } from "react";

import { kalshiAuthedJsonGet } from "./kalshiClientRequest";
import {
  mapKalshiCandlesticksToChartCandles,
  type KalshiCandlesticksResponse,
  type ChartCandle,
} from "./mapKalshiCandlesticksToChartCandles";

import type { TradingTimeframe } from "@/lib/trading/state/activeMarketJotaiAtoms";

type KalshiMarketMetaResponse = {
  market: unknown;
};

/** Rolling history window end = now, start = now minus this many days. */
const timeframeToRangeDays = (tf: TradingTimeframe): number => {
  switch (tf) {
    case "1D":
      return 1;
    case "1W":
      return 7;
    case "1M":
      return 30;
  }
};

/*
 * Kalshi `period_interval` in minutes: finer granularity on short views, coarse on 1M
 * to limit payload size (API-specific tradeoff).
 */
const timeframeToPeriodInterval = (tf: TradingTimeframe): 1 | 60 | 1440 => {
  switch (tf) {
    case "1D":
      return 60;
    case "1W":
      return 60;
    case "1M":
      return 1440;
  }
};

export const useKalshiMarketCandlesticks = ({
  ticker,
  timeframe,
}: {
  ticker: string | null;
  timeframe: TradingTimeframe;
}): {
  candles: ChartCandle[];
  loading: boolean;
  error: string | null;
} => {
  const queryKey = useMemo(() => `${ticker ?? "none"}-${timeframe}`, [ticker, timeframe]);

  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) {
      setCandles([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    // Hard cap so a hung TLS/socket does not leave loading=true forever.
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const metaResult = await kalshiAuthedJsonGet(`/markets/${encodeURIComponent(ticker)}`, {
          signal: controller.signal,
          timeoutMs: 8000,
        });
        if (metaResult.kind === "unconfigured") {
          setCandles([]);
          setError(null);
          return;
        }
        if (metaResult.kind === "error") {
          throw new Error(metaResult.message);
        }

        const meta = metaResult.data as unknown;
        if (typeof meta !== "object" || meta === null) {
          throw new Error("Kalshi market meta response malformed");
        }

        const metaTyped = meta as KalshiMarketMetaResponse;
        const m = metaTyped.market as Record<string, unknown>;
        // Meta shape varies; prefer explicit series, fall back to event ticker string.
        let seriesTicker: string | null = null;
        if (typeof m.series_ticker === "string") {
          seriesTicker = m.series_ticker;
        } else if (typeof m.event_ticker === "string") {
          seriesTicker = m.event_ticker;
        }

        if (!seriesTicker) throw new Error("Kalshi series ticker missing");

        const endTsSec = Math.floor(Date.now() / 1000);
        const startTsSec =
          endTsSec - timeframeToRangeDays(timeframe) * 86400;

        const periodInterval = timeframeToPeriodInterval(timeframe);

        const candlePath = `/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(
          ticker,
        )}/candlesticks?start_ts=${startTsSec}&end_ts=${endTsSec}&period_interval=${periodInterval}`;

        const candleResult = await kalshiAuthedJsonGet(candlePath, {
          signal: controller.signal,
          timeoutMs: 8000,
        });

        if (candleResult.kind === "unconfigured") {
          setCandles([]);
          setError(null);
          return;
        }
        if (candleResult.kind === "error") {
          throw new Error(candleResult.message);
        }

        const raw = candleResult.data as unknown;
        if (
          typeof raw !== "object" ||
          raw === null ||
          !("candlesticks" in raw)
        ) {
          throw new Error("Kalshi candlesticks response malformed");
        }

        const typed = raw as KalshiCandlesticksResponse;
        const mapped = mapKalshiCandlesticksToChartCandles(typed);
        setCandles(mapped);
      } catch (e) {
        // User navigated away or timeout — avoid writing error state after teardown.
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Unknown error");
        setCandles([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      globalThis.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [queryKey, ticker, timeframe]);

  return { candles, loading, error };
};

