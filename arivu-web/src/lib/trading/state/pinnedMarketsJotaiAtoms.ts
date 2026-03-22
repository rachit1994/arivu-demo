/**
 * Global starred markets (sidebar pin → chart strip). Stored in Jotai so both
 * TopicList and PinnedMarketsStrip share one source of truth without prop drilling.
 *
 * Why snapshots (not just ids):
 * - A pinned row might disappear from the filtered sidebar list; we still need copy
 *   for question / yesPrice / category badge without re-fetching.
 * - Unpinning removes the snapshot entirely; there is no separate “hidden” list.
 *
 * Persistence: in-memory only for now — refresh clears stars unless we add storage later.
 *
 * Duplicates: `togglePinned` checks `some` before append, so the same `id` cannot appear
 * twice. If you bypass that helper, dedupe in one place to avoid duplicate React keys.
 */
import { atom } from "jotai";

import type { MarketCategory } from "@/lib/mockRealtime/types";

/** Minimal fields needed to render a strip card and re-apply ticket selection. */
export interface PinnedMarketSnapshot {
  /** Market ticker / event id — primary key for unpin + selection. */
  id: string;
  /** Drives category pill styling (must stay in sync with `MarketCategory` enum). */
  category: MarketCategory;
  /** Headline copy; may go stale vs live API but good enough for a quick strip label. */
  question: string;
  /** Display YES price string; passed through `parseTicketPrice` when user selects card. */
  yesPrice: string;
}

/** Ordered list: append on pin, remove on unpin (order = pin order, FIFO). */
export const pinnedMarketsAtom = atom<PinnedMarketSnapshot[]>([]);
