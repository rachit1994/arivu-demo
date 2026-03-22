"use client";

/**
 * Sidebar topic list — data + interaction hub for “which market is active”.
 *
 * Responsibilities:
 * - Merge **mock** catalog rows with **Kalshi** API rows depending on load/error state.
 * - Category chips filter `visibleQuestions` without mutating the underlying catalogs.
 * - Keep **URL `?market=`**, **`activeMarketTickerAtom`**, and **row selection highlight**
 *   aligned across: first load, deep links, browser back/forward, sidebar clicks,
 *   Kalshi fetch completion (mock → live handoff), and category changes.
 * - Persist **starred** markets in `pinnedMarketsAtom` for the chart strip.
 *
 * Non-goals (handled elsewhere):
 * - Writing other query params (timeframe, outcome) → `TradingUrlSync` + ticket UI.
 * - Fetching order book / candles → `MockRealtimeProvider` + panels.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useMockRealtime } from "@/lib/mockRealtime";
import { MARKET_CATEGORIES } from "@/lib/mockRealtime/marketCatalog";
import type { MarketCategory } from "@/lib/mockRealtime/types";
import {
  getKalshiBrowserConfig,
  useKalshiMarkets,
  useTradingMarketSelection,
} from "@/lib/trading/hooks";
import {
  activeMarketQuestionAtom,
  activeMarketTickerAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";
import { pinnedMarketsAtom } from "@/lib/trading/state/pinnedMarketsJotaiAtoms";

/** Shared Tailwind classes for All / Elections / … filter chips (pure, testable). */
export const getTopicListCategoryButtonClass = (isActive: boolean) => {
  if (isActive) {
    return "cursor-pointer rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100";
  }

  return "cursor-pointer rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-400 hover:bg-neutral-900";
};

export const useTopicList = () => {
  /*
   * Read-only view of the query string for `market`. We intentionally do NOT call
   * `useQueryState` here — a second nuqs subscription caused update loops. URL writes
   * still go through `TradingUrlSync`. Optional chaining defends against mock edge cases.
   */
  const searchParams = useSearchParams();
  const marketInUrl = searchParams?.get("market") ?? null;

  const { topics: mockTopics } = useMockRealtime();
  const {
    topics: kalshiTopics,
    loading: kalshiLoading,
    error: kalshiError,
  } = useKalshiMarkets({ limit: 20, status: "open" as const });

  const [activeCategory, setActiveCategory] = useState<"All" | MarketCategory>("All");
  const [pinnedMarkets, setPinnedMarkets] = useAtom(pinnedMarketsAtom);
  const [activeMarketTicker, setActiveMarketTicker] = useAtom(
    activeMarketTickerAtom,
  );
  const activeMarketQuestion = useAtomValue(activeMarketQuestionAtom);
  const setActiveMarketQuestion = useSetAtom(activeMarketQuestionAtom);

  /*
   * Whether Kalshi env is present — used only to gate the “defer mismatch fix” branch.
   * When Kalshi is configured but the sidebar is still on mock data (loading/error),
   * we must not declare the URL’s ticker “missing” and snap to the first mock id.
   */
  const kalshiConfigured = useMemo(
    () => getKalshiBrowserConfig() !== null,
    [],
  );

  /*
   * Tracks the previous `market` query value between effect runs.
   * Why: after a sidebar click, `activeMarketTicker` updates immediately but
   * `useSearchParams` can still return the old `?market=` for a frame. Without this ref,
   * we’d think the URL “changed” and overwrite the user’s selection with a stale param.
   * On real navigation (back/forward), the param string changes and we intentionally adopt it.
   */
  const prevMarketInUrlRef = useRef<string | null | undefined>(undefined);

  // TopicRow expects a map; derived from the pinned array for minimal API churn.
  const pinnedById = useMemo(
    () => Object.fromEntries(pinnedMarkets.map((p) => [p.id, true])),
    [pinnedMarkets],
  );

  const visibleQuestions = useMemo(() => {
    /*
     * Source selection:
     * - While loading: keep mock so the UI is populated (better than an empty sidebar).
     * - On error: also mock — shows demo data with error affordance elsewhere if any.
     * - On success with zero rows: fall back to mock (API edge / filter); avoids blank UI.
     */
    const topics =
      !kalshiLoading && !kalshiError && kalshiTopics.length > 0
        ? kalshiTopics
        : mockTopics;

    if (activeCategory === "All") return topics;
    return topics.filter((t) => t.category === activeCategory);
  }, [activeCategory, kalshiLoading, kalshiError, kalshiTopics, mockTopics]);

  const applyTradingSelection = useTradingMarketSelection();

  const selectMarket = useCallback(
    (id: string) => {
      // Pinned snapshot may exist even if the row is hidden by category filter.
      const topic =
        visibleQuestions.find((t) => t.id === id) ??
        pinnedMarkets.find((p) => p.id === id);
      if (!topic) return;
      applyTradingSelection({
        id: topic.id,
        question: topic.question,
        yesPrice: topic.yesPrice,
      });
    },
    [applyTradingSelection, pinnedMarkets, visibleQuestions],
  );

  /*
   * Reconciliation loop (read carefully):
   * - If ?market= exists: adopt URL when atom is null or the URL param changed
   *   (browser navigation). Do not stomp a newer atom when URL is briefly stale
   *   after a sidebar click.
   * - If no ?market=: default-select first row when atom is null; if ticker is not
   *   in the visible list, snap to first (category change / Kalshi handoff).
   * - While Kalshi is loading or errored we still show mock rows: defer “not listed”
   *   fixes so ev_1 from URL is not replaced by mock id during fetch.
   */
  useEffect(() => {
    const first = visibleQuestions[0];
    // No rows (e.g. empty API + empty mock): nothing to select; avoid infinite defaults.
    if (!first) return;

    const urlSpecifiesMarket =
      marketInUrl !== null && marketInUrl !== undefined && marketInUrl.length > 0;

    if (urlSpecifiesMarket) {
      const priorUrlMarket = prevMarketInUrlRef.current;
      prevMarketInUrlRef.current = marketInUrl;
      const urlMarketChanged = priorUrlMarket !== marketInUrl;

      let tickerForMeta = activeMarketTicker;

      /*
       * Adopt URL ticker when:
       * - Atom never initialized (null) — first visit with deep link.
       * - URL actually changed (user used back/forward or replaced history in tests).
       * Skip when URL matches atom — avoids redundant Jotai writes and render churn.
       * Skip when URL unchanged but differs from atom — that’s the “stale searchParams
       * after click” case; the atom is authoritative until the bar catches up.
       */
      if (
        activeMarketTicker === null ||
        (urlMarketChanged && marketInUrl !== activeMarketTicker)
      ) {
        setActiveMarketTicker(marketInUrl);
        tickerForMeta = marketInUrl;
      }

      /*
       * `MarketSubHeader` reads `activeMarketQuestionAtom`, not the URL. When the ticker
       * comes from a deep link, we may have the row in `visibleQuestions` — copy the
       * question text. If the ticker is not in the list yet (Kalshi still loading),
       * leave question null rather than inventing copy; subheader can show ticker only.
       */
      const topic = visibleQuestions.find(
        (t) => t.id === (tickerForMeta ?? marketInUrl),
      );
      const nextQuestion = topic?.question ?? null;
      if (nextQuestion !== activeMarketQuestion) {
        setActiveMarketQuestion(nextQuestion);
      }
      return;
    }

    /*
     * No market query param: user is on bare `/` or we stripped the param elsewhere.
     * Reset ref so the next time `?market=` appears we treat it as a fresh change
     * (important for back navigation from `/` → `/?market=x`).
     */
    prevMarketInUrlRef.current = null;

    if (activeMarketTicker === null) {
      selectMarket(first.id);
      return;
    }

    const sidebarStillMockBacked = kalshiLoading || kalshiError !== null;
    const deferMismatchFix = kalshiConfigured && sidebarStillMockBacked;
    /*
     * Critical race guard: mock ids (e.g. `ev_1`) are not valid Kalshi tickers.
     * While we’re still showing mock rows but Kalshi is configured, the URL may carry
     * a real ticker that does not exist in the mock list — do NOT snap to first mock.
     * After live data loads, `visibleQuestions` uses Kalshi rows and normal logic applies.
     */
    if (deferMismatchFix) return;

    const listed = visibleQuestions.some((t) => t.id === activeMarketTicker);
    /*
     * Ticker not in current filter results: user changed category, or handoff replaced ids.
     * `selectMarket` picks the first visible row and resets ticket state via hook.
     */
    if (!listed) selectMarket(first.id);
  }, [
    activeMarketQuestion,
    activeMarketTicker,
    kalshiConfigured,
    kalshiError,
    kalshiLoading,
    marketInUrl,
    selectMarket,
    setActiveMarketQuestion,
    setActiveMarketTicker,
    visibleQuestions,
  ]);

  /** Star / unstar: writes global `pinnedMarketsAtom` consumed under the chart. */
  const togglePinned = useCallback(
    (id: string) => {
      setPinnedMarkets((prev) => {
        const exists = prev.some((p) => p.id === id);
        if (exists) return prev.filter((p) => p.id !== id);
        /*
         * Pin only from the visible list — we cannot snapshot a row we don’t have meta for.
         * Edge case: pinning then hiding via category filter still works because we stored
         * a snapshot; unpin always succeeds because filter runs by id on `prev`.
         */
        const topic = visibleQuestions.find((t) => t.id === id);
        if (!topic) return prev;
        // Persist display fields so the chart strip does not depend on sidebar visibility.
        return [
          ...prev,
          {
            id: topic.id,
            category: topic.category,
            question: topic.question,
            yesPrice: topic.yesPrice,
          },
        ];
      });
    },
    [setPinnedMarkets, visibleQuestions],
  );

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

