/**
 * Order ticket state shared between **OrderTicketPanel**, **OrderBookPanel** picks, and
 * **TradingUrlSync** (outcome in URL). Strings stay as typed display text until submit
 * logic validates numerics.
 */
import { atom } from "jotai";

export type TicketSide = "BUY" | "SELL";
export type TicketOutcome = "YES" | "NO";

export const ticketPickedPriceAtom = atom<string | null>(null);
export const ticketPickedSideAtom = atom<TicketSide>("BUY");
export const ticketPickedOutcomeAtom = atom<TicketOutcome>("YES");
/*
 * Which market last **explicitly** set `ticketPickedPriceAtom` (sidebar selection or
 * depth click). `useClearTicketPickWhenMarketChanges` compares this to
 * `activeMarketTickerAtom` to avoid wiping a fresh price on the same tick as ticker updates.
 */
export const ticketPriceSetMarketTickerAtom = atom<string | null>(null);

