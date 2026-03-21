"use client";

import type { DisplayOrderbookRow } from "@/lib/orderbook/prepareOrderbookDisplayRows";

import { clamp, fmtOrderbookPrice, fmtOrderbookQty } from "../orderbookFormat";

type Side = "bid" | "ask";

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
