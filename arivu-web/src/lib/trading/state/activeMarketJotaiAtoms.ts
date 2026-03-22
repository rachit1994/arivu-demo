/**
 * Global “which market / chart / book context” atoms. Written by `TradingUrlSync`,
 * `useTopicList`, `useTradingMarketSelection`, and book/ticket flows; read across panels.
 *
 * - `activeMarketTickerAtom`: Kalshi ticker or mock id; null before first selection.
 * - `activeMarketQuestionAtom`: headline for subheader; may be null if only ticker known.
 * - `activeTimeframeAtom`: chart + URL; must stay in enum for nuqs parser parity.
 * - `activeSubaccountAtom`: integer index mirrored to `?subaccount=` (not validated here).
 */
import { atom } from "jotai";

export type TradingTimeframe = "1D" | "1W" | "1M";

export const activeMarketTickerAtom = atom<string | null>(null);
export const activeMarketQuestionAtom = atom<string | null>(null);

export const activeTimeframeAtom = atom<TradingTimeframe>("1D");

export const activeSubaccountAtom = atom<number>(0);

