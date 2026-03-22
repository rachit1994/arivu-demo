"use client";

/**
 * Presentation + a11y helpers for `TopicRow`: selection ring classes, YES/NO bar percents
 * from price strings, and keyboard activation (Enter / Space) when `role="button"`.
 */

import type { KeyboardEvent } from "react";

import { computeYesBidSharePercent } from "../../topicRowPriceUtils";

interface Args {
  id: string;
  coin: string;
  chain: string;
  yesPrice: string;
  noPrice: string;
  isPinned: boolean;
  isSelected?: boolean;
  onSelectMarket?: (id: string) => void;
}

export const useTopicRowCard = ({
  id,
  coin,
  chain,
  yesPrice,
  noPrice,
  isPinned,
  isSelected,
  onSelectMarket,
}: Args): {
  coinChain: string;
  starColorClass: string;
  selectionClass: string;
  yesPct: number;
  noPct: number;
  handleCardKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
} => {
  const coinChain = `${coin} / ${chain}`;
  const starColorClass = isPinned
    ? "text-yellow-300"
    : "text-neutral-500 hover:text-neutral-200";
  // Index 0 = unselected, 1 = selected — avoids ternary + duplicate class strings in JSX.
  const selectionClass = [
    "",
    "border-emerald-400/60 bg-emerald-500/5 ring-1 ring-emerald-500/15 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]",
  ][Number(Boolean(isSelected))];

  const { yesPct, noPct } = computeYesBidSharePercent(yesPrice, noPrice);

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelectMarket) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onSelectMarket(id);
  };

  return {
    coinChain,
    starColorClass,
    selectionClass,
    yesPct,
    noPct,
    handleCardKeyDown,
  };
};
