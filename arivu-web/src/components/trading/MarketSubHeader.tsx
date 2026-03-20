"use client";

import { useAtom, useSetAtom } from "jotai";

import {
  type TradingTimeframe,
  activeSubaccountAtom,
  activeTimeframeAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";

export const MarketSubHeader = () => {
  const [timeframe] = useAtom(activeTimeframeAtom);
  const setTimeframe = useSetAtom(activeTimeframeAtom);
  const [subaccount] = useAtom(activeSubaccountAtom);
  const setSubaccount = useSetAtom(activeSubaccountAtom);

  const timeframeKeys = ["1D", "1W", "1M"] as const satisfies TradingTimeframe[];
  const subaccounts = [0, 1, 2, 3] as const;

  return (
    <div
      data-testid="market-subheader"
      className="flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-3 py-2"
    >
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-neutral-200">
          Subheader
        </div>
        <div className="truncate text-[11px] text-neutral-500">
          <span>Timeframe:</span>{" "}
          <div className="inline-flex gap-1 align-middle">
            {timeframeKeys.map((t) => {
              const active = timeframe === t;
              return (
                <button
                  key={t}
                  type="button"
                  data-testid={`timeframe-btn-${t}`}
                  aria-pressed={active}
                  onClick={() => setTimeframe(t)}
                  className={`rounded-md px-2 py-0.5 text-[11px] ${
                    active
                      ? "bg-neutral-50 text-neutral-950"
                      : "bg-neutral-950 text-neutral-400 hover:bg-neutral-900"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <span>
            {" "}
            · Subacct:{" "}
            <span data-testid="subaccount-value" className="font-semibold">
              {subaccount}
            </span>
          </span>
          <div className="inline-flex gap-1 align-middle pl-2">
            {subaccounts.map((n) => {
              const active = subaccount === n;
              return (
                <button
                  key={n}
                  type="button"
                  data-testid={`subaccount-btn-${n}`}
                  aria-pressed={active}
                  onClick={() => setSubaccount(n)}
                  className={`rounded-md px-2 py-0.5 text-[11px] ${
                    active
                      ? "bg-neutral-50 text-neutral-950"
                      : "bg-neutral-950 text-neutral-400 hover:bg-neutral-900"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <span data-testid="timeframe-value" className="sr-only">
            {timeframe}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-[11px] text-neutral-500">—</div>
    </div>
  );
};

