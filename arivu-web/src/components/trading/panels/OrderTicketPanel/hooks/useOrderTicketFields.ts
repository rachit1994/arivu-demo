"use client";

import { useMemo, useState } from "react";

import { useAtom } from "jotai";

import {
  type TicketOutcome,
  type TicketSide,
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

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
