"use client";

/**
 * Bridges Jotai ticket atoms to controlled inputs + derived est cost.
 *
 * `pickedPrice` null: show placeholder `"0.62"` in the input for a non-empty field while
 * still treating “no pick” as null for clearing logic — product/demo default, not a live quote.
 *
 * `quantity` stays in local React state (not Jotai) until we need cross-panel sync.
 */

import { useMemo, useState } from "react";

import { useAtom } from "jotai";

import {
  type TicketOutcome,
  type TicketSide,
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

/** Strips junk chars and caps length to avoid absurd paste payloads in the DOM. */
export const clampNumericText = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  return trimmed.replaceAll(/[^\d.]/g, "").slice(0, 12);
};

export const useOrderTicketFields = (): {
  pickedPrice: string | null;
  setPickedPrice: (v: string | null) => void;
  side: TicketSide;
  setSide: (v: TicketSide) => void;
  outcome: TicketOutcome;
  setOutcome: (v: TicketOutcome) => void;
  price: string;
  quantity: string;
  setQuantity: (v: string) => void;
  estCost: string;
} => {
  const [pickedPrice, setPickedPrice] = useAtom(ticketPickedPriceAtom);
  const [side, setSide] = useAtom(ticketPickedSideAtom);
  const [outcome, setOutcome] = useAtom(ticketPickedOutcomeAtom);

  const price = pickedPrice ?? "0.62";
  const [quantity, setQuantity] = useState("100");

  const estCost = useMemo(() => {
    const p = Number(price);
    const q = Number(quantity);
    if (Number.isFinite(p) && Number.isFinite(q)) {
      return `$${(p * q).toFixed(2)}`;
    }

    return "$—";
  }, [price, quantity]);

  return {
    pickedPrice,
    setPickedPrice,
    side,
    setSide,
    outcome,
    setOutcome,
    price,
    quantity,
    setQuantity,
    estCost,
  };
};
