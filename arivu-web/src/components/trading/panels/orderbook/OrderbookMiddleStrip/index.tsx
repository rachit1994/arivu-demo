"use client";

import { fmtOrderbookPrice } from "../orderbookFormat";

interface Props {
  lastPrice: number | null;
  markPrice: number | null;
  spreadLabel: string;
}

export const OrderbookMiddleStrip = ({
  lastPrice,
  markPrice,
  spreadLabel,
}: Props) => {
  const lastOk = lastPrice !== null && Number.isFinite(lastPrice);
  const markOk = markPrice !== null && Number.isFinite(markPrice);

  return (
    <div
      data-testid="orderbook-middle-strip"
      className="flex shrink-0 items-center justify-between gap-2 border-y border-neutral-800 bg-neutral-900/40 py-2"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-medium uppercase tracking-wide text-neutral-500">
          Last
        </div>
        <div
          data-testid="orderbook-last-price"
          className="truncate font-mono text-lg font-semibold tabular-nums text-rose-400"
        >
          {lastOk ? `$${fmtOrderbookPrice(lastPrice)}` : "—"}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <div className="text-[9px] font-medium uppercase tracking-wide text-neutral-500">
            Spread
          </div>
          <div
            data-testid="orderbook-spread-inline"
            className="font-mono text-[11px] tabular-nums text-neutral-400"
          >
            {spreadLabel}
          </div>
        </div>
        <button
          type="button"
          data-testid="orderbook-mark-trigger"
          title="Mark price (mid of best bid and ask)"
          className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-1 text-[10px] text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-neutral-600 font-mono text-[9px] text-neutral-300">
            M
          </span>
          <span
            data-testid="orderbook-mark-price"
            className="border-b border-dashed border-neutral-500 font-mono text-[11px] tabular-nums text-neutral-200"
          >
            {markOk ? fmtOrderbookPrice(markPrice) : "—"}
          </span>
        </button>
      </div>
    </div>
  );
};
