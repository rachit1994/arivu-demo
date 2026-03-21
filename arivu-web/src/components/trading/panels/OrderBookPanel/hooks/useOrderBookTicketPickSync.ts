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
 * Applies order-book row picks to global ticket atoms on the client where the
 * book lives, so the page shell does not subscribe to ticket state.
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
    setTicketPriceSetMarketTicker(activeMarketTicker);
  };
};
