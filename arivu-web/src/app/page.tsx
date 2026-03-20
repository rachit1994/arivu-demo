"use client";

import { useEffect, useMemo } from "react";

import { useAtom, useSetAtom } from "jotai";
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
import { getKalshiBrowserConfig } from "@/lib/kalshi/kalshiBrowserConfig";
import { MockRealtimeProvider } from "@/lib/mockRealtime";

import {
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
  ticketPriceSetMarketTickerAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";
import { activeMarketTickerAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";

export default function Home() {
  const kalshiConfigured = useMemo(
    () => getKalshiBrowserConfig() !== null,
    [],
  );
  const setPickedPrice = useSetAtom(ticketPickedPriceAtom);
  const setPickedSide = useSetAtom(ticketPickedSideAtom);
  const setPickedOutcome = useSetAtom(ticketPickedOutcomeAtom);
  const [activeMarketTicker] = useAtom(activeMarketTickerAtom);
  const [ticketPriceSetMarketTicker] = useAtom(
    ticketPriceSetMarketTickerAtom,
  );
  const setTicketPriceSetMarketTicker = useSetAtom(
    ticketPriceSetMarketTickerAtom,
  );

  useEffect(() => {
    // When the user switches markets, the ticket price should no longer be tied
    // to the previous order book context.
    if (ticketPriceSetMarketTicker === activeMarketTicker) return;
    setPickedPrice(null);
    setTicketPriceSetMarketTicker(null);
  }, [
    setPickedPrice,
    setTicketPriceSetMarketTicker,
    activeMarketTicker,
    ticketPriceSetMarketTicker,
  ]);

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
              <OrderBookPanel
                onPickTicket={(pick) => {
                  setPickedPrice(pick.price);
                  setPickedSide(pick.side);
                  setPickedOutcome(pick.outcome);
                  // The selected price is now tied to the current market; don't clear it.
                  setTicketPriceSetMarketTicker(activeMarketTicker);
                }}
              />
              <OrderTicketPanel />
            </div>
            <BottomTabs />
          </div>
        </TradingShell>
      </MockRealtimeProvider>
    </NuqsAdapter>
  );
}
