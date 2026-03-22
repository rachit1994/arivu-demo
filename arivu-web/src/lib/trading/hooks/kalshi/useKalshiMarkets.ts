"use client";

/**
 * One-shot fetch of Kalshi `/markets` for sidebar `TopicQuote` rows (see mapper).
 *
 * - `unconfigured` → empty topics, no error (TopicList falls back to mock catalog).
 * - `limit` clamped 1–1000 for sane URLs; `status` optional query filter.
 * - `cursor` returned for future pagination (not wired in UI yet).
 * - Abort + 8s timeout on effect cleanup or param change; ignores errors after abort.
 */

import { useEffect, useMemo, useState } from "react";

import { kalshiAuthedJsonGet } from "./kalshiClientRequest";
import { mapKalshiMarketsToTopicQuotes } from "./mapKalshiMarketsToTopicQuotes";
import type { KalshiMarket } from "./mapKalshiMarketsToTopicQuotes";
import type { TopicQuote } from "@/lib/mockRealtime/types";

type KalshiMarketStatus = "unopened" | "open" | "paused" | "closed" | "settled";

export type UseKalshiMarketsArgs = {
  limit: number;
  status?: KalshiMarketStatus;
};

/** Keeps `limit` in API-friendly range; NaN → 100 default. */
const clampLimit = (n: number): number => {
  if (!Number.isFinite(n)) return 100;
  if (n < 1) return 1;
  if (n > 1000) return 1000;
  return Math.trunc(n);
};

export const useKalshiMarkets = ({
  limit,
  status,
}: UseKalshiMarketsArgs): {
  topics: TopicQuote[];
  cursor: string | null;
  loading: boolean;
  error: string | null;
} => {
  const [topics, setTopics] = useState<TopicQuote[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(clampLimit(limit)));
    if (status) params.set("status", status);
    return params.toString();
  }, [limit, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await kalshiAuthedJsonGet(`/markets?${query}`, {
          signal: controller.signal,
          timeoutMs: 8000,
        });

        if (result.kind === "unconfigured") {
          setTopics([]);
          setCursor(null);
          setError(null);
          return;
        }
        if (result.kind === "error") {
          throw new Error(result.message);
        }

        const data = result.data as {
          markets: unknown[];
          cursor: string | null;
        };

        setTopics(mapKalshiMarketsToTopicQuotes(data.markets as KalshiMarket[]));
        setCursor(data.cursor ?? null);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      globalThis.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  return { topics, cursor, loading, error };
};

