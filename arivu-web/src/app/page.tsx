"use client";

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
  const kalshiConfigured = useMemo(
    () => getKalshiBrowserConfig() !== null,
    [],
  );
  const [activeMarketTicker] = useAtom(activeMarketTickerAtom);

  return (
    <NuqsAdapter>
      <MockRealtimeProvider
        mode={kalshiConfigured ? "kalshi" : "mock"}
        marketTicker={activeMarketTicker}
      >
        <TradingShell>
          <div className="flex h-full min-h-0 flex-col">
            <GlobalTopNav />
            <TradingUrlSync />
            <TradeTopBar />
            <MarketSubHeader />
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
