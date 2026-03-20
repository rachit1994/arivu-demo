"use client";

import { useMemo, useState } from "react";
import { useAtom } from "jotai";

import { PanelFrame } from "./PanelFrame";
import { TicketRow } from "./ticket/TicketRow";
import { TicketSegment } from "./ticket/TicketSegment";
import { TicketOutcomeSegment } from "./ticket/TicketOutcomeSegment";

import {
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

const clampNumericText = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  return trimmed.replaceAll(/[^\d.]/g, "").slice(0, 12);
};

export const OrderTicketPanel = () => {
  const [pickedPrice, setPickedPrice] = useAtom(ticketPickedPriceAtom);
  const [side, setSide] = useAtom(ticketPickedSideAtom);
  const [outcome, setOutcome] = useAtom(ticketPickedOutcomeAtom);

  const price = pickedPrice ?? "0.62";
  const [quantity, setQuantity] = useState("100");
  // Keep `side` and `outcome` globally consistent: Jotai atoms are the source of truth.

  const estCost = useMemo(() => {
    const p = Number(price);
    const q = Number(quantity);
    if (Number.isFinite(p) && Number.isFinite(q)) {
      return `$${(p * q).toFixed(2)}`;
    }

    return "$—";
  }, [price, quantity]);

  return (
    <div data-testid="order-ticket-panel" className="flex h-full min-h-0 flex-col">
      <PanelFrame title="Order ticket">
        <div className="flex flex-col gap-3">
          <TicketSegment
            value={side}
            onChange={setSide}
          />
          <TicketOutcomeSegment
            value={outcome}
            onChange={setOutcome}
          />

          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            <span>Price</span>
            <input
              data-testid="ticket-price"
              value={price}
              onChange={(e) => {
                const next = clampNumericText(e.target.value);
                setPickedPrice(next.length === 0 ? null : next);
              }}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-emerald-500"
              inputMode="decimal"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            <span>Quantity</span>
            <input
              data-testid="ticket-quantity"
              value={quantity}
              onChange={(e) => setQuantity(clampNumericText(e.target.value))}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-emerald-500"
              inputMode="numeric"
            />
          </label>

          <TicketRow label="Est_cost" value={estCost} />

          <button
            type="button"
            data-testid="trade-submit"
            className="mt-2 rounded-md border border-orange-400/40 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-950 shadow-[0_0_0_1px_rgba(251,146,60,0.15),0_10px_28px_-18px_rgba(251,146,60,0.55)] hover:bg-neutral-100"
          >
            Trade
          </button>

          <div className="text-[11px] text-neutral-500">
            Review_required_if_price_is_stale
          </div>
        </div>
      </PanelFrame>
    </div>
  );
};

