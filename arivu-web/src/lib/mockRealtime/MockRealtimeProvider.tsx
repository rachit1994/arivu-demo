"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { buildInitialSnapshot, computeNextSnapshot } from "./computeTick";
import type { MockSnapshot } from "./types";

import { kalshiAuthedJsonGet } from "@/lib/kalshi/kalshiClientRequest";
import { mapKalshiMarketToBookAndPrice } from "@/lib/kalshi/mapKalshiMarketToBookAndPrice";

const Ctx = createContext<MockSnapshot | null>(null);

/** ~20 Hz mock stream; single batched snapshot per tick. */
const DEFAULT_TICK_MS = 50;

type KalshiBinaryMarketRow = {
  ticker?: string;
  market_type?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  yes_bid_size_fp?: string;
  tick_size?: string;
};

interface Props {
  children: ReactNode;
  enabled?: boolean;
  tickMs?: number;
  mode?: "mock" | "kalshi";
  marketTicker?: string | null;
}

export const MockRealtimeProvider = ({
  children,
  enabled = true,
  tickMs = DEFAULT_TICK_MS,
  mode = "mock",
  marketTicker = null,
}: Props) => {
  const [snap, setSnap] = useState<MockSnapshot>(() =>
    buildInitialSnapshot(marketTicker),
  );

  useEffect(() => {
    if (mode !== "mock") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnap(buildInitialSnapshot(marketTicker));
  }, [marketTicker, mode]);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    if (!enabled) return;

    const pollMs =
      mode === "kalshi" ? Math.max(2000, tickMs) : tickMs;

    if (mode === "kalshi") {
      const pickKalshiBinaryMarket = (
        markets: KalshiBinaryMarketRow[],
      ): KalshiBinaryMarketRow | null => {
        const matchesShape = (x: KalshiBinaryMarketRow) =>
          x.market_type === "binary" &&
          typeof x.yes_bid_dollars === "string" &&
          typeof x.yes_ask_dollars === "string";

        if (marketTicker) {
          const exact =
            markets.find((x) => x.ticker === marketTicker && matchesShape(x)) ??
            null;
          if (exact) return exact;
        }

        return markets.find(matchesShape) ?? null;
      };

      const applyKalshiMarket = (
        prev: MockSnapshot,
        market: KalshiBinaryMarketRow,
        nowMs: number,
      ): MockSnapshot => {
        const mapped = mapKalshiMarketToBookAndPrice({
          previousPrices: prev.prices,
          market,
          nowMs,
          historySize: 240,
          levelCount: 5,
        });

        return {
          ...prev,
          prices: mapped.prices,
          orderbook: mapped.orderbook,
          spread: mapped.spread,
          updatedAtMs: nowMs,
          tick: prev.tick + 1,
        };
      };

      const updateFromKalshi = async (): Promise<void> => {
        const result = await kalshiAuthedJsonGet("/markets?status=open&limit=20", {
          timeoutMs: 8000,
        });
        if (result.kind !== "ok") return;

        const data = result.data as { markets: KalshiBinaryMarketRow[] };
        const m = pickKalshiBinaryMarket(data.markets);
        if (!m) return;

        const nowMs = Date.now();
        setSnap((prev) => applyKalshiMarket(prev, m, nowMs));
      };

      const id = globalThis.setInterval(() => {
        void updateFromKalshi().catch(() => {
          // Keep existing snapshot; avoids UI crashes on intermittent failures.
        });
      }, pollMs);

      return () => globalThis.clearInterval(id);
    }

    const id = globalThis.setInterval(() => {
      setSnap((p) => computeNextSnapshot(p));
    }, pollMs);
    return () => globalThis.clearInterval(id);
  }, [enabled, tickMs, mode, marketTicker]);

  const v = useMemo(() => snap, [snap]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
};

export const useMockRealtime = (): MockSnapshot => {
  const x = useContext(Ctx);
  if (!x) throw new Error("useMockRealtime outside MockRealtimeProvider");
  return x;
};
