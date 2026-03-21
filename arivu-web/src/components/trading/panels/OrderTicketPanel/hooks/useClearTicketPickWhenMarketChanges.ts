"use client";

import { useEffect } from "react";

import { useAtom, useSetAtom } from "jotai";

import { activeMarketTickerAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";
import {
  ticketPickedPriceAtom,
  ticketPriceSetMarketTickerAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

/**
 * Clears ticket price when the active market changes so picks are not tied to a
 * stale order book. Lives on the ticket panel so only that subtree subscribes.
 */
export const useClearTicketPickWhenMarketChanges = (): void => {
  const [activeMarketTicker] = useAtom(activeMarketTickerAtom);
  const [ticketPriceSetMarketTicker] = useAtom(
    ticketPriceSetMarketTickerAtom,
  );
  const setPickedPrice = useSetAtom(ticketPickedPriceAtom);
  const setTicketPriceSetMarketTicker = useSetAtom(
    ticketPriceSetMarketTickerAtom,
  );

  useEffect(() => {
    if (ticketPriceSetMarketTicker === activeMarketTicker) return;
    setPickedPrice(null);
    setTicketPriceSetMarketTicker(null);
  }, [
    setPickedPrice,
    setTicketPriceSetMarketTicker,
    activeMarketTicker,
    ticketPriceSetMarketTicker,
  ]);
};
