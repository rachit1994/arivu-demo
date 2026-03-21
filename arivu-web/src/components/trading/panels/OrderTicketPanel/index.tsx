"use client";

import { PanelFrame } from "../PanelFrame";
import { TicketRow } from "../ticket/TicketRow";
import { TicketSegment } from "../ticket/TicketSegment";
import { TicketOutcomeSegment } from "../ticket/TicketOutcomeSegment";

import { useClearTicketPickWhenMarketChanges } from "./hooks/useClearTicketPickWhenMarketChanges";
import {
  clampNumericText,
  useOrderTicketFields,
} from "./hooks/useOrderTicketFields";

export const OrderTicketPanel = () => {
  useClearTicketPickWhenMarketChanges();
  const {
    setPickedPrice,
    side,
    setSide,
    outcome,
    setOutcome,
    price,
    quantity,
    setQuantity,
    estCost,
  } = useOrderTicketFields();

  return (
    <div
      data-testid="order-ticket-panel"
      className="flex h-full min-h-0 flex-col"
    >
      <PanelFrame title="Order ticket">
        <div className="flex flex-col gap-3">
          <TicketSegment value={side} onChange={setSide} />
          <TicketOutcomeSegment value={outcome} onChange={setOutcome} />

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
