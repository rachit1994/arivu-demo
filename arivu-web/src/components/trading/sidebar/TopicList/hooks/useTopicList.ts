"use client";

import { useMemo, useState } from "react";

import { useAtom, useSetAtom } from "jotai";

import { useMockRealtime } from "@/lib/mockRealtime";
import { MARKET_CATEGORIES } from "@/lib/mockRealtime/marketCatalog";
import type { MarketCategory } from "@/lib/mockRealtime/types";
import { useKalshiMarkets } from "@/lib/trading/hooks";
import {
  activeMarketQuestionAtom,
  activeMarketTickerAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";
import {
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
  ticketPriceSetMarketTickerAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

export const getTopicListCategoryButtonClass = (isActive: boolean) => {
  if (isActive) {
    return "cursor-pointer rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100";
  }

  return "cursor-pointer rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-400 hover:bg-neutral-900";
};

export const useTopicList = () => {
  const { topics: mockTopics } = useMockRealtime();
  const {
    topics: kalshiTopics,
    loading: kalshiLoading,
    error: kalshiError,
  } = useKalshiMarkets({ limit: 20, status: "open" as const });

  const [activeCategory, setActiveCategory] = useState<"All" | MarketCategory>("All");
  const [pinnedById, setPinnedById] = useState<Record<string, boolean>>({});
  const [activeMarketTicker, setActiveMarketTicker] = useAtom(
    activeMarketTickerAtom,
  );
  const setActiveMarketQuestion = useSetAtom(activeMarketQuestionAtom);
  const setPickedPrice = useSetAtom(ticketPickedPriceAtom);
  const setPickedSide = useSetAtom(ticketPickedSideAtom);
  const setPickedOutcome = useSetAtom(ticketPickedOutcomeAtom);
  const setTicketPriceSetMarketTicker = useSetAtom(
    ticketPriceSetMarketTickerAtom,
  );

  const visibleQuestions = useMemo(() => {
    const topics =
      !kalshiLoading && !kalshiError && kalshiTopics.length > 0
        ? kalshiTopics
        : mockTopics;

    if (activeCategory === "All") return topics;
    return topics.filter((t) => t.category === activeCategory);
  }, [activeCategory, kalshiLoading, kalshiError, kalshiTopics, mockTopics]);

  const parseTicketPrice = (raw: string): string | null => {
    const cleaned = raw.replaceAll(/[^\d.]/g, "");
    if (cleaned.length === 0) return null;
    return cleaned;
  };

  const selectMarket = (id: string) => {
    setActiveMarketTicker(id);
    const topic = visibleQuestions.find((t) => t.id === id);
    setActiveMarketQuestion(topic?.question ?? null);
    setPickedSide("BUY");
    setPickedOutcome("YES");

    const ticketPrice = topic ? parseTicketPrice(topic.yesPrice) : null;
    setPickedPrice(ticketPrice);
    setTicketPriceSetMarketTicker(ticketPrice ? id : null);
  };

  const togglePinned = (id: string) => {
    setPinnedById((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return {
    visibleQuestions,
    activeCategory,
    setActiveCategory,
    pinnedById,
    togglePinned,
    activeMarketTicker,
    selectMarket,
    marketCategories: MARKET_CATEGORIES,
  };
};

