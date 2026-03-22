"use client";

import { useAtom, useSetAtom } from "jotai";

import { activeMarketTickerAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";
import {
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
  ticketPriceSetMarketTickerAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

import type { TicketPick } from "../../orderbook/OrderbookDepthRow";

/**
 * Applies order-book row picks to global ticket atoms from the book panel so `page.tsx`
 * stays thin. Updates price, side (buy on bid click / sell on ask), outcome, and
 * stamps `ticketPriceSetMarketTickerAtom` with the **current** `activeMarketTicker`.
 *
 * That stamp pairs the price with a market id — `useClearTicketPickWhenMarketChanges`
 * clears the input when the ticker changes unless the book just set price for this ticker.
 */
export const useOrderBookTicketPickSync = (): ((pick: TicketPick) => void) => {
  const setPickedPrice = useSetAtom(ticketPickedPriceAtom);
  const setPickedSide = useSetAtom(ticketPickedSideAtom);
  const setPickedOutcome = useSetAtom(ticketPickedOutcomeAtom);
  const [activeMarketTicker] = useAtom(activeMarketTickerAtom);
  const setTicketPriceSetMarketTicker = useSetAtom(
    ticketPriceSetMarketTickerAtom,
  );

  return (pick: TicketPick) => {
    setPickedPrice(pick.price);
    setPickedSide(pick.side);
    setPickedOutcome(pick.outcome);
    // May be null if selection not ready — still better than leaving a stale prior id.
    setTicketPriceSetMarketTicker(activeMarketTicker);
  };
};
