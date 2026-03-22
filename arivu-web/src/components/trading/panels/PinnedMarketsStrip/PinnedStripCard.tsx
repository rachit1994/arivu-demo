"use client";

/**
 * Compact card UI for one pinned market.
 *
 * Accessibility / DOM validity:
 * - A single `<button>` wrapping the whole card would nest the star control — invalid HTML.
 * - Pattern: non-interactive outer `div`, star `button` (unpin), body `button` (select).
 *
 * Visual state:
 * - `selected` adds emerald border/ring to match sidebar selection language.
 * - Category pill color comes from `pinnedStripCategoryPillClass` (mirrors TopicRow).
 */
import type { PinnedMarketSnapshot } from "@/lib/trading/state/pinnedMarketsJotaiAtoms";

interface Props {
  market: PinnedMarketSnapshot;
  selected: boolean;
  pillClassName: string;
  onSelect: () => void;
  onUnpin: () => void;
}

export const PinnedStripCard = ({
  market: m,
  selected,
  pillClassName,
  onSelect,
  onUnpin,
}: Props) => (
  // Two interactive targets: unpin (star) vs select (body) — avoids nested <button>.
  <div
    className={[
      "flex min-w-[200px] max-w-[240px] shrink-0 flex-col gap-1 rounded-lg border px-2 py-2",
      "border-neutral-800 bg-neutral-900/80",
      selected ? "border-emerald-500/30 ring-1 ring-emerald-500/40" : "",
    ].join(" ")}
  >
    <div className="flex items-start justify-between gap-1">
      <span
        className={[
          "inline-block max-w-[70%] truncate rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase",
          pillClassName,
        ].join(" ")}
      >
        {m.category}
      </span>
      <button
        type="button"
        data-testid={`pinned-strip-unpin-${m.id}`}
        aria-label="Remove from starred"
        className="shrink-0 rounded px-1 text-amber-400/90 hover:bg-neutral-800 hover:text-amber-300"
        onClick={onUnpin}
      >
        ★
      </button>
    </div>
    <button
      type="button"
      data-testid={`pinned-strip-card-${m.id}`}
      onClick={onSelect}
      className="w-full rounded-md text-left hover:bg-neutral-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      <p className="line-clamp-2 text-[11px] leading-snug text-neutral-200">
        {m.question}
      </p>
      <div className="mt-1 text-[10px] text-neutral-500">
        Yes <span className="font-mono text-emerald-400/90">{m.yesPrice}</span>
      </div>
    </button>
  </div>
);
