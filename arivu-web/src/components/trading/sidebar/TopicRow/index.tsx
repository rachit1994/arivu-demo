import { TOPIC_ROW_LAYOUT } from "../topicRowLayout";

import { useTopicRowCard } from "./hooks/useTopicRowCard";

interface Props {
  id: string;
  category: string;
  question: string;
  coin: string;
  chain: string;
  totalVolume: string;
  apv: string;
  yesPrice: string;
  noPrice: string;
  isPinned: boolean;
  onTogglePinned: () => void;
  onSelectMarket?: (id: string) => void;
  isSelected?: boolean;
}

const StarIcon = ({ isPinned }: { isPinned: boolean }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      fill={isPinned ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const getCategoryPillClass = (category: string): string => {
  switch (category) {
    case "Elections":
      return "border-violet-500/30 bg-violet-500/10 text-violet-200";
    case "Sports":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "Tech":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
    case "Economy":
      return "border-lime-500/30 bg-lime-500/10 text-lime-200";
    case "Culture":
      return "border-pink-500/30 bg-pink-500/10 text-pink-200";
    default:
      return "border-neutral-700 bg-neutral-900 text-neutral-200";
  }
};

export const TopicRow = ({
  id,
  category,
  question,
  coin,
  chain,
  totalVolume,
  apv,
  yesPrice,
  noPrice,
  isPinned,
  onTogglePinned,
  onSelectMarket,
  isSelected,
}: Props) => {
  const {
    coinChain,
    starColorClass,
    selectionClass,
    yesPct,
    noPct,
    handleCardKeyDown,
  } = useTopicRowCard({
    id,
    coin,
    chain,
    yesPrice,
    noPrice,
    isPinned,
    isSelected,
    onSelectMarket,
  });

  const layout = TOPIC_ROW_LAYOUT;

  return (
    <div
      role="button"
      tabIndex={onSelectMarket ? 0 : undefined}
      data-testid="market-question-row"
      data-market-id={id}
      onClick={() => onSelectMarket?.(id)}
      onKeyDown={handleCardKeyDown}
      className={[
        "flex w-full min-w-0 max-w-full shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-800/70 bg-neutral-950/70 text-left shadow-sm outline-none hover:border-neutral-700 hover:bg-neutral-900/60 focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        layout.padding,
        layout.sectionGap,
        selectionClass,
      ].join(" ")}
    >
      <div
        className={[
          "flex shrink-0 items-center justify-between gap-2",
          layout.metaRowMinHeight,
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div
            className={[
              "inline-block max-w-full truncate rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              getCategoryPillClass(category),
            ].join(" ")}
          >
            {category}
          </div>
        </div>
        <div className="min-w-0 shrink-0 truncate text-[11px] font-semibold text-neutral-300">
          {coinChain}
        </div>
      </div>

      <div
        className={[layout.questionBlockHeight, "min-w-0 shrink-0 overflow-hidden"].join(" ")}
        data-testid="topic-row-question-slot"
      >
        <p
          className={[layout.questionText, layout.questionClamp, "m-0 text-neutral-50"].join(" ")}
        >
          {question}
        </p>
      </div>

      <div className="grid min-h-0 shrink-0 grid-cols-[minmax(0,5.75rem)_minmax(0,1fr)] gap-x-3 gap-y-0">
        <div className="flex min-h-0 min-w-0 flex-col gap-2 border-r border-neutral-800/50 pr-2">
          <div className="min-w-0">
            <div className="text-[10px] text-neutral-400">Total Vol</div>
            <div className="truncate text-sm font-semibold leading-5 text-neutral-50">
              {totalVolume}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-neutral-400">APV</div>
            <div className="truncate text-sm font-semibold leading-5 text-neutral-50">{apv}</div>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-1.5">
          <div className="flex min-h-0 items-baseline justify-between gap-2">
            <span className="shrink-0 text-[10px] font-medium text-neutral-400">Yes</span>
            <span className="min-w-0 truncate text-right text-base font-semibold tabular-nums leading-6 text-emerald-300">
              {yesPrice}
            </span>
          </div>

          <div
            data-testid="topic-row-bid-bar"
            className="flex h-2.5 w-full min-w-0 shrink-0 overflow-hidden rounded-full bg-neutral-800/90"
            role="img"
            aria-label={`Relative bid mix about ${yesPct}% yes versus ${noPct}% no`}
          >
            <div className="h-full shrink-0 bg-emerald-500/90" style={{ width: `${yesPct}%` }} />
            <div className="h-full min-w-0 flex-1 bg-rose-500/90" />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 text-[9px] tabular-nums leading-4 text-neutral-500">
            <span className="text-emerald-400/90">{yesPct}%</span>
            <span className="text-rose-400/90">{noPct}%</span>
          </div>

          <div className="flex min-h-0 items-baseline justify-between gap-2">
            <span className="shrink-0 text-[10px] font-medium text-neutral-400">No</span>
            <span className="min-w-0 truncate text-right text-base font-semibold tabular-nums leading-6 text-rose-300">
              {noPrice}
            </span>
          </div>
        </div>
      </div>

      <div
        className={[
          "flex shrink-0 items-center justify-end",
          layout.pinRowHeight,
        ].join(" ")}
      >
        <button
          type="button"
          aria-label={isPinned ? "Unpin market" : "Pin market"}
          data-testid={`pin-${id}`}
          className={`rounded-md px-1 py-1 transition-colors ${starColorClass}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePinned();
          }}
        >
          <StarIcon isPinned={isPinned} />
        </button>
      </div>
    </div>
  );
};
