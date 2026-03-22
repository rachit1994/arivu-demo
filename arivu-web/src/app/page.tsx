"use client";

/**
 * Home trading page — composition root for the desktop trading experience.
 *
 * Provider / child order (changing this can reintroduce race bugs):
 * 1. `NuqsAdapter` — required parent for any `useQueryState` / nuqs hooks anywhere below.
 * 2. `TradingUrlSync` — must mount before `TopicList` (inside the shell) so the
 *    active market atom is seeded from `?market=` in the layout phase; otherwise the
 *    sidebar’s first `useEffect` sees a null ticker and picks the first mock row while
 *    a deep link still shows a Kalshi id in the URL.
 * 3. `MockRealtimeProvider` — switches Kalshi vs mock streams based on env; needs the
 *    current `activeMarketTicker` prop so candle/book data follow selection.
 * 4. Grid panels — chart left, book center, ticket right; all need `min-h-0` chain
 *    (see grid class) or flex children won’t shrink and overflow will clip charts.
 */

import { useMemo } from "react";

import { useAtom } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/react";

import {
  BottomTabs,
  MarketSubHeader,
  TradingShell,
} from "@/components/trading";
import { TradeTopBar } from "@/components/trading/TradeTopBar";
import { GlobalTopNav } from "@/components/trading/GlobalTopNav";
import { TradingUrlSync } from "@/components/trading/TradingUrlSync";
import {
  ChartPanel,
  OrderBookPanel,
  OrderTicketPanel,
} from "@/components/trading/panels";
import { getKalshiBrowserConfig } from "@/lib/trading/hooks";
import { MockRealtimeProvider } from "@/lib/mockRealtime";

import { activeMarketTickerAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";

export default function Home() {
  /*
   * Kalshi keys are read once per mount from `NEXT_PUBLIC_*`; memo empty-deps is
   * intentional — we do not expect runtime env mutation in the browser mid-session.
   * Edge case: in tests, `vi.stubEnv` runs before render; remount the tree if you
   * need to flip configured ↔ mock after first paint.
   */
  const kalshiConfigured = useMemo(
    () => getKalshiBrowserConfig() !== null,
    [],
  );
  /*
   * Subscribe at page level (not inside the provider) so when Jotai updates the
   * ticker, this component re-renders and passes the new `marketTicker` down.
   * If we only read the atom inside a deep child, the provider would stay stale.
   */
  const [activeMarketTicker] = useAtom(activeMarketTickerAtom);

  return (
    <NuqsAdapter>
      {/*
        Headless sync: writes/reads search params with `history: "replace"` so back
        button is not spammed with every ticket tweak. See hook for null-guards.
      */}
      <TradingUrlSync />
      {/*
        `mode` drives which websocket/mock feed backs the order book + chart.
        `marketTicker` can be null briefly — provider must tolerate null (shows empty
        or loading) until URL sync + TopicList agree on a default.
      */}
      <MockRealtimeProvider
        mode={kalshiConfigured ? "kalshi" : "mock"}
        marketTicker={activeMarketTicker}
      >
        <TradingShell>
          <div className="flex h-full min-h-0 flex-col">
            <GlobalTopNav />
            <TradeTopBar />
            <MarketSubHeader />
            {/*
              Three fixed-ish columns: chart flexes (`minmax(0,1fr)`), book/ticket fixed
              width. `[&>*]:min-h-0` forces grid items to participate in overflow clipping;
              without it, chart panel height can explode past the viewport.
            */}
            <div className="grid h-full min-h-0 w-full flex-1 grid-cols-[minmax(0,1fr)_360px_300px] grid-rows-[minmax(0,1fr)] gap-2 p-2 [&>*]:min-h-0">
              <ChartPanel />
              <OrderBookPanel />
              <OrderTicketPanel />
            </div>
            <BottomTabs />
          </div>
        </TradingShell>
      </MockRealtimeProvider>
    </NuqsAdapter>
  );
}
