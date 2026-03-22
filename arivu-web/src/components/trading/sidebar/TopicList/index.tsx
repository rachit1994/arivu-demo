"use client";

/**
 * Sidebar market list UI.
 *
 * Next.js App Router: `useSearchParams()` opts the tree into **dynamic rendering** and
 * can suspend while params resolve. We wrap the hook-using subtree in `<Suspense>` so
 * the parent shell can render immediately and show a lightweight fallback here.
 *
 * `TopicListInner` holds all hooks — keep it as the single suspense boundary child so
 * we don’t duplicate fallbacks for every row.
 */
import { Suspense } from "react";

import { TopicRow } from "../TopicRow";

import {
  getTopicListCategoryButtonClass,
  useTopicList,
} from "./hooks/useTopicList";

/** Real list body: safe to call `useTopicList` (includes `useSearchParams`). */
const TopicListInner = () => {
  const {
    visibleQuestions,
    activeCategory,
    setActiveCategory,
    pinnedById,
    togglePinned,
    activeMarketTicker,
    selectMarket,
    marketCategories,
  } = useTopicList();

  return (
    <div data-testid="topic-list" className="flex min-h-full flex-col p-2">
      <div className="sticky top-0 z-10 -mx-2 mb-2 bg-neutral-950 px-2 pb-2 pt-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            data-testid="category-button-All"
            aria-pressed={activeCategory === "All"}
            className={getTopicListCategoryButtonClass(activeCategory === "All")}
            onClick={() => setActiveCategory("All")}
          >
            All
          </button>
          {marketCategories.map((c) => (
            <button
              key={c}
              type="button"
              data-testid={`category-button-${c}`}
              aria-pressed={activeCategory === c}
              className={getTopicListCategoryButtonClass(activeCategory === c)}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/*
        Do not use flex-1 + min-h-0 here: the sidebar scroll parent has a fixed
        height, so a flex-1 list would shrink every TopicRow (flex-shrink: 1)
        until only padding remained. Natural column height + shrink-0 on cards.
        gap-1.5 = 6px between cards.
      */}
      <div
        data-testid="topic-list-cards"
        className="flex flex-col gap-1.5"
      >
        {visibleQuestions.map((q) => (
          <TopicRow
            key={q.id}
            category={q.category}
            question={q.question}
            id={q.id}
            coin={q.coin}
            chain={q.chain}
            totalVolume={q.totalVolume}
            apv={q.apv}
            yesPrice={q.yesPrice}
            noPrice={q.noPrice}
            isPinned={Boolean(pinnedById[q.id])}
            onTogglePinned={() => togglePinned(q.id)}
            isSelected={activeMarketTicker === q.id}
            onSelectMarket={selectMarket}
          />
        ))}
      </div>
    </div>
  );
};

export const TopicList = () => (
  <>
    {/*
      Fallback keeps sidebar width stable and preserves `data-testid="topic-list"` so
      tests that query the list before inner mount still find a node (avoids brittle timing).
    */}
    <Suspense
      fallback={
        <div
          data-testid="topic-list"
          className="flex min-h-full flex-col p-2 text-[11px] text-neutral-500"
          aria-busy="true"
        >
          Loading topics…
        </div>
      }
    >
      <TopicListInner />
    </Suspense>
  </>
);
