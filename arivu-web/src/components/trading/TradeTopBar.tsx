"use client";

import { useEffect, useState } from "react";

import { useAtom } from "jotai";

import { useMockRealtime } from "@/lib/mockRealtime";
import { activeMarketQuestionAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";

const ageLabel = (ms: number) => {
  const d = Date.now() - ms;
  switch (true) {
    case d < 1000:
      return `${Math.max(0, d)}ms ago`;
    default:
      return `${(d / 1000).toFixed(1)}s ago`;
  }
};

export const TradeTopBar = () => {
  const { updatedAtMs } = useMockRealtime();
  const [mounted, setMounted] = useState(false);
  const [activeMarketQuestion] = useAtom(activeMarketQuestionAtom);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      data-testid="trade-topbar"
      className="flex items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2"
    >
      <div className="min-w-0">
        <div
          data-testid="trade-topbar-question"
          className="truncate text-sm font-semibold"
        >
          {activeMarketQuestion ?? "Will_X_happen_by_Y"}
        </div>
        <div className="truncate text-xs text-neutral-400">
          Market_status: Trading · Mock stream ·{" "}
          {mounted ? `Updated ${ageLabel(updatedAtMs)}` : "Updated just now"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="topbar-watch"
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs hover:bg-neutral-800"
        >
          Watch
        </button>
        <button
          type="button"
          data-testid="topbar-share"
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs hover:bg-neutral-800"
        >
          Share
        </button>
      </div>
    </div>
  );
};
