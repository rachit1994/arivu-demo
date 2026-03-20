"use client";

import { useEffect, useMemo, useState } from "react";

import {
  mapKalshiCandlesticksToChartCandles,
  type KalshiCandlesticksResponse,
  type ChartCandle,
} from "./mapKalshiCandlesticksToChartCandles";

import type { TradingTimeframe } from "@/lib/trading/state/activeMarketJotaiAtoms";

type KalshiMarketMetaResponse = {
  market: unknown;
};

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
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const metaRes = await fetch(`/api/kalshi/markets/${ticker}`, {
          signal: controller.signal,
        });
        if (metaRes.status === 503) {
          setCandles([]);
          setError(null);
          return;
        }
        if (!metaRes.ok) throw new Error("Kalshi market meta request failed");

        const meta = (await metaRes.json()) as unknown;
        if (typeof meta !== "object" || meta === null) {
          throw new Error("Kalshi market meta response malformed");
        }

        const metaTyped = meta as KalshiMarketMetaResponse;
        const m = metaTyped.market as Record<string, unknown>;
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

        const candlestickRes = await fetch(
          `/api/kalshi/series/${encodeURIComponent(
            seriesTicker,
          )}/markets/${encodeURIComponent(
            ticker,
          )}/candlesticks?start_ts=${startTsSec}&end_ts=${endTsSec}&period_interval=${periodInterval}`,
          { signal: controller.signal },
        );

        if (candlestickRes.status === 503) {
          setCandles([]);
          setError(null);
          return;
        }
        if (!candlestickRes.ok) throw new Error("Kalshi candlesticks request failed");

        const raw = (await candlestickRes.json()) as unknown;
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

