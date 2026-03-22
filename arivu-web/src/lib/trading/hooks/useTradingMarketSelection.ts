"use client";

/**
 * Returns a stable callback that applies “user selected this market” to all relevant
 * atoms (ticker, headline question, default ticket side/outcome/price).
 *
 * Centralized on purpose:
 * - Sidebar row click and starred strip click must reset ticket state the same way.
 * - If we only updated `activeMarketTickerAtom` in one place, the order ticket could
 *   keep a price from the previous market (`ticketPriceSetMarketTickerAtom` guards that).
 *
 * Product defaults when switching markets:
 * - Side BUY, outcome YES — common for prediction markets; power users change after.
 * - Price prefilled from displayed YES ask/last style string after digit cleanup.
 */

import { useCallback } from "react";

import { useSetAtom } from "jotai";

import {
  activeMarketQuestionAtom,
  activeMarketTickerAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";
import {
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
  ticketPriceSetMarketTickerAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

/**
 * Subset of sidebar / snapshot row fields needed to drive atoms.
 * Callers should pass non-empty `id`; we do not re-validate here (Jotai accepts any string).
 */
export interface MarketSelectionMeta {
  id: string;
  question: string;
  yesPrice: string;
}

/*
 * Strip non-digits/decimals from human-facing YES price strings for the numeric ticket.
 * Examples: "55¢" → "55", "$0.60" → "0.60".
 * Edge cases:
 * - Empty after strip → null (ticket clears price; see `ticketPriceSetMarketTickerAtom`).
 * - Multiple "." — rare from API; we do not normalize further; controlled input may reject.
 * - No locale handling — display strings are expected in the app’s simple format.
 */
const parseTicketPrice = (raw: string): string | null => {
  const cleaned = raw.replaceAll(/[^\d.]/g, "");
  if (cleaned.length === 0) return null;
  return cleaned;
};

export const useTradingMarketSelection = (): ((m: MarketSelectionMeta) => void) => {
  // Jotai setters are stable references; listing them satisfies exhaustive-deps lint.
  const setTicker = useSetAtom(activeMarketTickerAtom);
  const setQuestion = useSetAtom(activeMarketQuestionAtom);
  const setSide = useSetAtom(ticketPickedSideAtom);
  const setOutcome = useSetAtom(ticketPickedOutcomeAtom);
  const setPrice = useSetAtom(ticketPickedPriceAtom);
  const setTicketTicker = useSetAtom(ticketPriceSetMarketTickerAtom);

  return useCallback(
    (meta: MarketSelectionMeta) => {
      // Order: ticker first so any subscriber keyed on ticker sees consistent follow-up writes.
      setTicker(meta.id);
      setQuestion(meta.question);
      setSide("BUY");
      setOutcome("YES");
      const ticketPrice = parseTicketPrice(meta.yesPrice);
      setPrice(ticketPrice);
      /*
       * Record which market “owns” the current ticket price. Order ticket code uses this
       * to avoid showing a stale price after `activeMarketTicker` changes without a
       * fresh row click. Null when we could not derive a price — do not tie to ticker.
       */
      setTicketTicker(ticketPrice ? meta.id : null);
    },
    [
      setOutcome,
      setPrice,
      setQuestion,
      setSide,
      setTicketTicker,
      setTicker,
    ],
  );
};
