"use client";

/**
 * One starred market in the strip — thin controller around `PinnedStripCard`.
 *
 * `applySelection` is the shared market-pick pipeline (ticket + headline atoms).
 * `setPinned` must be the Jotai setter so unpin re-renders the strip and sidebar map.
 *
 * Sonar / readability: named handlers instead of inline lambdas in JSX attributes.
 */
import type { Dispatch, SetStateAction } from "react";

import type { MarketSelectionMeta } from "@/lib/trading/hooks";
import type { PinnedMarketSnapshot } from "@/lib/trading/state/pinnedMarketsJotaiAtoms";

import { PinnedStripCard } from "./PinnedStripCard";
import { pinnedStripCategoryPillClass } from "./pinnedStripPillClass";

interface Props {
  market: PinnedMarketSnapshot;
  selected: boolean;
  applySelection: (m: MarketSelectionMeta) => void;
  setPinned: Dispatch<SetStateAction<PinnedMarketSnapshot[]>>;
}

export const PinnedStripRow = ({
  market,
  selected,
  applySelection,
  setPinned,
}: Props) => {
  /** Reuses snapshot fields — works even if the sidebar row is filtered away. */
  const handleSelect = (): void => {
    applySelection({
      id: market.id,
      question: market.question,
      yesPrice: market.yesPrice,
    });
  };

  /** Idempotent filter: removing missing id is a no-op; stable order for remaining pins. */
  const handleUnpin = (): void => {
    setPinned((prev) => prev.filter((p) => p.id !== market.id));
  };

  return (
    <PinnedStripCard
      market={market}
      selected={selected}
      pillClassName={pinnedStripCategoryPillClass(market.category)}
      onSelect={handleSelect}
      onUnpin={handleUnpin}
    />
  );
};
