"use client";

import { TopicRow } from "../TopicRow";

import {
  getTopicListCategoryButtonClass,
  useTopicList,
} from "./hooks/useTopicList";

export const TopicList = () => {
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
