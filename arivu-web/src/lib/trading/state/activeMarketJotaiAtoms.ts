import { atom } from "jotai";

export type TradingTimeframe = "1D" | "1W" | "1M";

export const activeMarketTickerAtom = atom<string | null>(null);
export const activeMarketQuestionAtom = atom<string | null>(null);

export const activeTimeframeAtom = atom<TradingTimeframe>("1D");

export const activeSubaccountAtom = atom<number>(0);

