"use client";

import {
  ORDERBOOK_PRECISION_OPTIONS,
  type OrderbookLayoutMode,
  type OrderbookPrecisionStep,
} from "./orderbookConstants";

interface Props {
  layoutMode: OrderbookLayoutMode;
  onLayoutMode: (m: OrderbookLayoutMode) => void;
  precisionStep: OrderbookPrecisionStep;
  onPrecisionStep: (s: OrderbookPrecisionStep) => void;
}

const layoutBtnClass = (active: boolean): string =>
  [
    "flex h-7 w-7 shrink-0 items-center justify-center rounded border text-[10px] font-semibold transition-colors",
    active
      ? "border-neutral-500 bg-neutral-800 text-neutral-100"
      : "border-transparent text-neutral-500 hover:border-neutral-800 hover:text-neutral-300",
  ].join(" ");

export const OrderbookToolbar = ({
  layoutMode,
  onLayoutMode,
  precisionStep,
  onPrecisionStep,
}: Props) => {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2">
      <div
        className="flex items-center gap-0.5 rounded-md bg-neutral-900/80 p-0.5"
        role="group"
        aria-label="Order book layout"
      >
        <button
          type="button"
          data-testid="orderbook-layout-combined"
          aria-pressed={layoutMode === "combined"}
          className={layoutBtnClass(layoutMode === "combined")}
          onClick={() => onLayoutMode("combined")}
          title="Combined book"
        >
          ⇅
        </button>
        <button
          type="button"
          data-testid="orderbook-layout-bids"
          aria-pressed={layoutMode === "bids"}
          className={layoutBtnClass(layoutMode === "bids")}
          onClick={() => onLayoutMode("bids")}
          title="Bids only"
        >
          B
        </button>
        <button
          type="button"
          data-testid="orderbook-layout-asks"
          aria-pressed={layoutMode === "asks"}
          className={layoutBtnClass(layoutMode === "asks")}
          onClick={() => onLayoutMode("asks")}
          title="Asks only"
        >
          A
        </button>
      </div>

      <label className="flex items-center gap-1.5 text-[10px] text-neutral-500">
        <span className="sr-only">Price grouping</span>
        <select
          data-testid="orderbook-precision"
          value={precisionStep}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            onPrecisionStep(v as OrderbookPrecisionStep);
          }}
          className="cursor-pointer rounded border border-neutral-800 bg-neutral-950 px-1.5 py-1 font-mono text-[11px] text-neutral-200 outline-none focus:border-emerald-600/60"
        >
          {ORDERBOOK_PRECISION_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
