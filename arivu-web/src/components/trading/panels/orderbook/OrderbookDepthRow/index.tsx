"use client";

/**
 * Single depth row: price / size / cumulative with a cumulative-depth bar (green bids,
 * red asks). The whole row is a `<button>` so one click sends a `TicketPick` to Jotai
 * via `useOrderBookTicketPickSync`.
 *
 * Outcome is always **YES** on row click — the order book UI is YES-space; users flip
 * to NO in the ticket if needed (matches integration tests that expect YES after bid click).
 *
 * `disabled` rows are padded placeholders: no click, em dashes, reduced opacity.
 */

import type { DisplayOrderbookRow } from "@/lib/orderbook/prepareOrderbookDisplayRows";

import { clamp, fmtOrderbookPrice, fmtOrderbookQty } from "../orderbookFormat";

type Side = "bid" | "ask";

/** Payload to the ticket: formatted price string + derived side from bid vs ask row. */
export type TicketPick = {
  price: string;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO";
};

interface Props {
  side: Side;
  index: number;
  row: DisplayOrderbookRow;
  maxCumulative: number;
  disabled?: boolean;
  onPick?: (pick: TicketPick) => void;
}

export const OrderbookDepthRow = ({
  side,
  index,
  row,
  maxCumulative,
  disabled,
  onPick,
}: Props) => {
  // Bar width scales to the largest cumulative on either side of the book for comparability.
  const pct =
    maxCumulative > 0 ? (row.cumulative / maxCumulative) * 100 : 0;
  const widthPct = clamp(pct, 0, 100);
  const isBid = side === "bid";
  const testSide = isBid ? "bids" : "asks";

  return (
    <button
      type="button"
      data-testid={`orderbook-row-${testSide}-${index}`}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onPick?.({
          price: fmtOrderbookPrice(row.px),
          side: isBid ? "BUY" : "SELL",
          outcome: "YES",
        });
      }}
      className="relative grid w-full grid-cols-[1fr_1fr_1fr] items-center gap-1 border-0 bg-transparent px-1 py-0.5 text-left hover:bg-neutral-900/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 disabled:cursor-default disabled:opacity-40"
    >
      {/* Depth bar does not steal clicks from the row button. */}
      <div
        className={[
          "pointer-events-none absolute right-0 top-0 bottom-0 opacity-25",
          isBid ? "bg-emerald-500" : "bg-rose-500",
        ].join(" ")}
        style={{ width: `${widthPct}%` }}
      />
      <div
        data-testid={`orderbook-row-price-${testSide}-${index}`}
        className={[
          "relative z-10 font-mono text-[11px] tabular-nums",
          isBid ? "text-emerald-400" : "text-rose-400",
        ].join(" ")}
      >
        {disabled ? "—" : fmtOrderbookPrice(row.px)}
      </div>
      <div className="relative z-10 text-center font-mono text-[11px] tabular-nums text-neutral-300">
        {disabled ? "—" : fmtOrderbookQty(row.qty)}
      </div>
      <div className="relative z-10 text-right font-mono text-[11px] tabular-nums text-neutral-200">
        {disabled ? "—" : fmtOrderbookQty(row.cumulative)}
      </div>
    </button>
  );
};
