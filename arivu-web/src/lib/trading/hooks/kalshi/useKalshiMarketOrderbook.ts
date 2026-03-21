"use client";

import { useEffect, useMemo, useState } from "react";

import { kalshiAuthedJsonGet } from "./kalshiClientRequest";
import {
  mapKalshiOrderbookToBidAsk,
  type KalshiOrderbookFp,
  type BidAskLevel,
} from "./mapKalshiOrderbookToBidAsk";

type KalshiOrderbookRouteResponse = {
  orderbook_fp: KalshiOrderbookFp;
};

const clampDepth = (n: number): number => {
  if (!Number.isFinite(n)) return 50;
  const x = Math.trunc(n);
  if (x < 1) return 1;
  if (x > 100) return 100;
  return x;
};

type KalshiOrderbookSnapshot =
  | { kind: "ok"; bids: BidAskLevel[]; asks: BidAskLevel[]; mid: number | null; spreadText: string }
  | { kind: "unavailable" };

const snapshotFromKalshiResult = (
  result: Awaited<ReturnType<typeof kalshiAuthedJsonGet>>,
): KalshiOrderbookSnapshot => {
  if (result.kind === "unconfigured") return { kind: "unavailable" };
  if (result.kind === "error") {
    throw new Error(result.message);
  }

  const data = result.data;
  if (typeof data !== "object" || data === null || !("orderbook_fp" in data)) {
    throw new Error("Kalshi orderbook response malformed");
  }

  const normalized = data as KalshiOrderbookRouteResponse;
  const mapped = mapKalshiOrderbookToBidAsk(normalized.orderbook_fp);
  const spreadText =
    mapped.spread === null
      ? "—"
      : (() => {
          const spreadNum = mapped.spread;
          const safe = Math.abs(spreadNum) < 0.000001 ? 0 : spreadNum;
          return safe.toFixed(3);
        })();

  return {
    kind: "ok",
    bids: mapped.bids,
    asks: mapped.asks,
    mid: mapped.mid,
    spreadText,
  };
};

export const useKalshiMarketOrderbook = ({
  ticker,
  depth,
  pollIntervalMs = null,
}: {
  ticker: string | null;
  depth: number;
  /** When set, re-fetches on an interval while the document is visible (REST polling). */
  pollIntervalMs?: number | null;
}): {
  bids: BidAskLevel[];
  asks: BidAskLevel[];
  mid: number | null;
  spreadText: string;
  loading: boolean;
  error: string | null;
} => {
  const depthClamped = useMemo(() => clampDepth(depth), [depth]);

  const [bids, setBids] = useState<BidAskLevel[]>([]);
  const [asks, setAsks] = useState<BidAskLevel[]>([]);
  const [mid, setMid] = useState<number | null>(null);
  const [spreadText, setSpreadText] = useState<string>("—");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) {
      setBids([]);
      setAsks([]);
      setMid(null);
      setSpreadText("—");
      setLoading(false);
      setError(null);
      return;
    }

    let alive = true;

    const fetchOnce = async (withLoading: boolean) => {
      const controller = new AbortController();
      const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

      if (withLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await kalshiAuthedJsonGet(
          `/markets/${encodeURIComponent(ticker)}/orderbook?depth=${depthClamped}`,
          { signal: controller.signal, timeoutMs: 8000 },
        );

        if (!alive) return;

        const snap = snapshotFromKalshiResult(result);
        if (snap.kind === "unavailable") {
          setBids([]);
          setAsks([]);
          setMid(null);
          setSpreadText("—");
          setError(null);
          return;
        }

        setBids(snap.bids);
        setAsks(snap.asks);
        setMid(snap.mid);
        setSpreadText(snap.spreadText);
      } catch (e) {
        if (controller.signal.aborted || !alive) return;
        setError(e instanceof Error ? e.message : "Unknown error");
        setBids([]);
        setAsks([]);
        setMid(null);
        setSpreadText("—");
      } finally {
        globalThis.clearTimeout(timeoutId);
        if (withLoading && alive) {
          setLoading(false);
        }
      }
    };

    void fetchOnce(true);

    const shouldPoll =
      pollIntervalMs !== null &&
      pollIntervalMs !== undefined &&
      pollIntervalMs > 0;

    if (!shouldPoll) {
      return () => {
        alive = false;
      };
    }

    const intervalId = globalThis.setInterval(() => {
      if (!alive) return;
      if (globalThis.document.visibilityState !== "visible") return;
      void fetchOnce(false);
    }, pollIntervalMs);

    return () => {
      alive = false;
      globalThis.clearInterval(intervalId);
    };
  }, [depthClamped, pollIntervalMs, ticker]);

  return { bids, asks, mid, spreadText, loading, error };
};

