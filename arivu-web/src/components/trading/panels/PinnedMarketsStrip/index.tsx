"use client";

/**
 * Horizontal “Starred” row under the chart.
 *
 * Behavior:
 * - Subscribes to `pinnedMarketsAtom` + `activeMarketTickerAtom` for selection ring.
 * - Clicking a card calls the same `useTradingMarketSelection` path as the sidebar.
 * - Unpin updates atom immutably (filter) — no separate “deleted” tombstones.
 *
 * Empty state: returns `null` so `ChartPanel` does not reserve vertical space when unused.
 *
 * Scrolling: inner row is `flex-nowrap` implied by horizontal flex + `shrink-0` cards;
 * `overflow-x-auto` adds a scrollbar only when needed. `scrollbar-gutter: stable`
 * reduces layout shift when the scrollbar appears (supported browsers).
 */
import { useAtom, useAtomValue } from "jotai";

import { useTradingMarketSelection } from "@/lib/trading/hooks";
import { activeMarketTickerAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";
import { pinnedMarketsAtom } from "@/lib/trading/state/pinnedMarketsJotaiAtoms";

import { PinnedStripRow } from "./PinnedStripRow";

export const PinnedMarketsStrip = () => {
  const [pinned, setPinned] = useAtom(pinnedMarketsAtom);
  const activeTicker = useAtomValue(activeMarketTickerAtom);
  // New function identity when hook internals change — fine; list is small.
  const applySelection = useTradingMarketSelection();

  if (pinned.length === 0) return null;

  return (
    <div
      data-testid="pinned-markets-strip"
      className="shrink-0 rounded-lg border border-neutral-800 bg-neutral-950/90 px-2 py-2"
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        Starred
      </div>
      {/* shrink-0 cards + nowrap row → horizontal scroll instead of wrapping */}
      <div className="flex min-h-0 gap-2 overflow-x-auto pb-1 [scrollbar-gutter:stable]">
        {/* `key={m.id}` relies on TopicList pin logic preventing duplicate ids in the array. */}
        {pinned.map((m) => (
          <PinnedStripRow
            key={m.id}
            market={m}
            selected={m.id === activeTicker}
            applySelection={applySelection}
            setPinned={setPinned}
          />
        ))}
      </div>
    </div>
  );
};
