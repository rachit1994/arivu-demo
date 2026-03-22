"use client"; // Ensures this file runs only on the client side

/**
 * React context for providing a single MockSnapshot, which is updated periodically, to mock trading components.
 * - "mock" mode: simulates deterministic tick loop (~20 Hz by default) for local testing.
 * - "kalshi" mode: polls live data from the Kalshi API and feeds book and price history.
 * - In tests (NODE_ENV === "test"): disables real timer loop to ensure deterministic behavior.
 */

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { buildInitialSnapshot, computeNextSnapshot } from "./computeTick";
import type { MockSnapshot } from "./types";

import {
  kalshiAuthedJsonGet,
  mapKalshiMarketToBookAndPrice,
} from "@/lib/trading/hooks";

// Context for sharing the current mock snapshot (or null before initialization)
const Ctx = createContext<MockSnapshot | null>(null);

// Default tick frequency for the mock mode (~20Hz)
const DEFAULT_TICK_MS = 50;

// Partial shape of a Kalshi binary market row, for Kalshi polling/mapping
type KalshiBinaryMarketRow = {
  ticker?: string;
  market_type?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  yes_bid_size_fp?: string;
  tick_size?: string;
};

// Props expected by the MockRealtimeProvider
interface Props {
  children: ReactNode; // Children components to render inside provider
  enabled?: boolean; // Whether realtime mock updates are enabled
  tickMs?: number; // How often to update (ms)
  mode?: "mock" | "kalshi"; // Whether to simulate data or poll Kalshi
  marketTicker?: string | null; // Market ticker to use (optional)
}

// Main realtime provider component
export const MockRealtimeProvider = ({
  children,
  enabled = true, // Enable realtime updates by default
  tickMs = DEFAULT_TICK_MS, // Default tick interval
  mode = "mock", // Default to mock mode
  marketTicker = null, // No market selected by default
}: Props) => {
  // Holds the current mock snapshot; initialize with a snapshot for the specified ticker
  const [snap, setSnap] = useState<MockSnapshot>(() =>
    buildInitialSnapshot(marketTicker),
  );

  // Whenever marketTicker or mode changes, reset the snapshot (fresh order book/chart)
  useEffect(() => {
    if (mode !== "mock") return; // Only reset in mock mode
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnap(buildInitialSnapshot(marketTicker));
  }, [marketTicker, mode]);

  // Main effect: sets up periodic updates (interval) for either mode
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return; // Skip updates in tests
    if (!enabled) return; // Freeze state if disabled

    // For Kalshi: enforce a minimum poll interval of 2000ms to avoid excessive polling
    const pollMs = mode === "kalshi" ? Math.max(2000, tickMs) : tickMs;

    if (mode === "kalshi") {
      // Pick a market row matching the ticker and necessary structure
      const pickKalshiBinaryMarket = (
        markets: KalshiBinaryMarketRow[],
      ): KalshiBinaryMarketRow | null => {
        // Helper to check if a row matches binary market shape for our use
        const matchesShape = (x: KalshiBinaryMarketRow) =>
          x.market_type === "binary" &&
          typeof x.yes_bid_dollars === "string" &&
          typeof x.yes_ask_dollars === "string";

        // Prefer exact ticker match if provided, fallback to any valid binary market
        if (marketTicker) {
          const exact =
            markets.find((x) => x.ticker === marketTicker && matchesShape(x)) ??
            null;
          if (exact) return exact; // Use the matched market or fall through below
        }

        // Otherwise, just get any binary market with prices
        return markets.find(matchesShape) ?? null;
      };

      // Update the current snapshot from a Kalshi market row
      const applyKalshiMarket = (
        prev: MockSnapshot,
        market: KalshiBinaryMarketRow,
        nowMs: number,
      ): MockSnapshot => {
        // Do mapping: convert Kalshi book/price data into mock snapshot format
        const mapped = mapKalshiMarketToBookAndPrice({
          previousPrices: prev.prices,
          market,
          nowMs,
          historySize: 240, // How much price history to keep
          levelCount: 5, // Book depth to simulate
        });

        // Merge mapped data into the previous snapshot, increment tick
        return {
          ...prev,
          prices: mapped.prices,
          orderbook: mapped.orderbook,
          spread: mapped.spread,
          updatedAtMs: nowMs,
          tick: prev.tick + 1,
        };
      };

      // Poll Kalshi API and update snapshot if possible
      const updateFromKalshi = async (): Promise<void> => {
        const result = await kalshiAuthedJsonGet(
          "/markets?status=open&limit=20",
          {
            timeoutMs: 8000, // Give Kalshi API 8s to respond
          },
        );
        // If not configured or request failed: keep last good snapshot
        if (result.kind !== "ok") return;

        // Parse and find candidate market
        const data = result.data as { markets: KalshiBinaryMarketRow[] };
        const m = pickKalshiBinaryMarket(data.markets);
        if (!m) return; // No usable market found: skip update

        // Get current timestamp and update snapshot
        const nowMs = Date.now();
        setSnap((prev) => applyKalshiMarket(prev, m, nowMs));
      };

      // Set up interval for polling Kalshi; safely ignore rejections
      const id = globalThis.setInterval(() => {
        void updateFromKalshi().catch(() => {
          // On error (e.g., network): just retain current state, don't crash UI
        });
      }, pollMs);

      // Cleanup: clear interval when effect re-runs/unmounts
      return () => globalThis.clearInterval(id);
    }

    // "mock" mode: advance simulation by one tick on each interval
    const id = globalThis.setInterval(() => {
      setSnap((p) => computeNextSnapshot(p));
    }, pollMs);

    // Cleanup: clear interval when effect re-runs/unmounts
    return () => globalThis.clearInterval(id);
  }, [enabled, tickMs, mode, marketTicker]);

  // Memoize value for context consumers; referential equality when snapshot changes
  const v = useMemo(() => snap, [snap]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
};

// Hook for consumer components to use the latest mock snapshot
export const useMockRealtime = (): MockSnapshot => {
  const x = useContext(Ctx);
  // Throw a readable error if hook is not used inside provider
  if (!x) throw new Error("useMockRealtime outside MockRealtimeProvider");
  return x;
};
