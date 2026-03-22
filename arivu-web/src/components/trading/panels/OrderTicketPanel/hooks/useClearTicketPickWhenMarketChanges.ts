"use client";

import { useEffect } from "react";

import { useAtom, useSetAtom } from "jotai";

import { activeMarketTickerAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";
import {
  ticketPickedPriceAtom,
  ticketPriceSetMarketTickerAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

/**
 * Clears ticket price when the active market changes **unless** the current price was
 * explicitly set for this market (book click or row selection sets `ticketPriceSetMarketTickerAtom`).
 *
 * Effect: switching markets wipes a stale book price; clicking a depth row on the new
 * market sets ticker+price together so the next run sees a match and does not clear.
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
    /*
     * Match means “price belongs to this ticker” (or both null on fresh load).
     * Mismatch means ticker moved without a new book pick — drop price to avoid trading
     * the old level on the new contract.
     */
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
