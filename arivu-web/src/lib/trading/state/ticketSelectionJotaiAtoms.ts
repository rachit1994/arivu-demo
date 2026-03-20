import { atom } from "jotai";

export type TicketSide = "BUY" | "SELL";
export type TicketOutcome = "YES" | "NO";

export const ticketPickedPriceAtom = atom<string | null>(null);
export const ticketPickedSideAtom = atom<TicketSide>("BUY");
export const ticketPickedOutcomeAtom = atom<TicketOutcome>("YES");
// Used to prevent the trade page from clearing the ticket price immediately after
// a sidebar click sets it for the newly selected market.
export const ticketPriceSetMarketTickerAtom = atom<string | null>(null);

