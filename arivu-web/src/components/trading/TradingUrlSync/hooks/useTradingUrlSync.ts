/**
 * Keeps the browser URL (nuqs) and Jotai trading state aligned both ways.
 *
 * Why this file is subtle:
 * - nuqs hydrates after first paint; `marketInUrl` can be empty for one frame even when
 *   `window.location` already has `?market=`. We combine nuqs + raw `location` for the
 *   one-shot market init so deep links win.
 * - Jotai atoms can be `null` during SSR/hydration; blindly writing `null` into the URL
 *   would strip shareable query strings. The market effect explicitly skips atom→URL
 *   when the atom is null but the URL still has a market param.
 * - TopicList also reads `?market=` via `useSearchParams` and reconciles with the atom.
 *   This hook must not fight that loop: we use one-shot refs so “seed from URL” runs
 *   once per mount, not on every param change.
 * - `history: "replace"` on all parsers avoids polluting the user’s back stack when
 *   sliders/toggles update params.
 */
"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  useQueryState,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";
import { useAtom } from "jotai";

import {
  activeMarketTickerAtom,
  activeSubaccountAtom,
  activeTimeframeAtom,
  type TradingTimeframe,
} from "@/lib/trading/state/activeMarketJotaiAtoms";
import {
  ticketPickedOutcomeAtom,
  type TicketOutcome,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

/** Only YES/NO are valid; unknown query values fall back via parser default. */
const outcomeKeys: TicketOutcome[] = ["YES", "NO"];

export const useTradingUrlSync = (): void => {
  const [pickedOutcome, setPickedOutcome] = useAtom(ticketPickedOutcomeAtom);
  const [activeMarketTicker, setActiveMarketTicker] = useAtom(
    activeMarketTickerAtom,
  );
  const [activeTimeframe, setActiveTimeframe] = useAtom(activeTimeframeAtom);
  const [activeSubaccount, setActiveSubaccount] = useAtom(
    activeSubaccountAtom,
  );
  /*
   * One-shot flags per concern: after the first URL→atom copy, ongoing sync is
   * atom→URL (user-driven). Without refs, the “init” effect would re-run whenever
   * nuqs re-parses the same param and could reset user edits mid-interaction.
   */
  const didInitRef = useRef(false);
  const didInitMarketRef = useRef(false);
  const didInitTimeframeRef = useRef(false);
  const didInitSubaccountRef = useRef(false);

  const outcomeParser = parseAsStringEnum<TicketOutcome>(outcomeKeys).withDefault(
    "YES",
  );

  const [outcomeInUrl, setOutcomeInUrl] = useQueryState(
    "outcome",
    outcomeParser.withOptions({ history: "replace" }),
  );

  /*
   * `market` is a free-form string ticker (Kalshi event ticker or mock id). Empty string
   * is treated as “missing” downstream so we normalize with length checks elsewhere.
   */
  const [marketInUrl, setMarketInUrl] = useQueryState(
    "market",
    parseAsString.withOptions({ history: "replace" }),
  );

  const timeframeKeys: TradingTimeframe[] = ["1D", "1W", "1M"];
  const timeframeParser = parseAsStringEnum<TradingTimeframe>(timeframeKeys).withDefault(
    "1D",
  );
  const [timeframeInUrl, setTimeframeInUrl] = useQueryState(
    "timeframe",
    timeframeParser.withOptions({ history: "replace" }),
  );

  const [subaccountInUrl, setSubaccountInUrl] = useQueryState(
    "subaccount",
    /*
     * `parseAsInteger` yields NaN for garbage input; nuqs default 0 keeps UI stable.
     * Negative subaccounts are still “valid” numbers — if we need to reject them, do it
     * at the control that increments/decrements, not here.
     */
    parseAsInteger.withDefault(0).withOptions({ history: "replace" }),
  );

  /*
   * Outcome — two linked effects:
   * (1) First commit: copy URL → atom so deep links open with NO selected, etc.
   * (2) Later commits: copy atom → URL when the in-app toggle diverges from the bar.
   * We intentionally do not use a ref guard on (2): toggling should always win after init.
   */
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    setPickedOutcome(outcomeInUrl);
  }, [outcomeInUrl, setPickedOutcome]);

  useEffect(() => {
    if (outcomeInUrl === pickedOutcome) return;
    setOutcomeInUrl(pickedOutcome);
  }, [outcomeInUrl, pickedOutcome, setOutcomeInUrl]);

  /*
   * Market ticker: useLayoutEffect so the atom updates before child useEffects run.
   * nuqs can briefly report an empty market on the first paint; fall back to
   * window.location so ?market= deep links still win.
   */
  useLayoutEffect(() => {
    if (didInitMarketRef.current) return;
    didInitMarketRef.current = true;
    // SSR / pre-paint: no window — only nuqs (may still be empty on first client pass).
    const qp =
      typeof globalThis.window !== "undefined"
        ? new URLSearchParams(globalThis.window.location.search).get("market")
        : null;
    // Treat empty string as missing so "?market=" does not become a bogus ticker id.
    const fromNuqs =
      marketInUrl !== null &&
      marketInUrl !== undefined &&
      marketInUrl.length > 0
        ? marketInUrl
        : null;
    setActiveMarketTicker(fromNuqs ?? qp ?? null);
  }, [marketInUrl, setActiveMarketTicker]);

  /*
   * Atom → URL for market: `setMarketInUrl` returns a Promise (Next adapter); void it
   * so React does not treat the effect as async in a way lint rules dislike.
   *
   * Guard: if the atom is still null but the URL already names a market, do nothing.
   * Rationale: on hydration the atom may lag behind the address bar; writing null
   * would erase `?market=` and break shareable links + TopicList’s URL reconciliation.
   * When the user truly clears selection (atom null + URL empty), we still write null.
   */
  useEffect(() => {
    if (marketInUrl === activeMarketTicker) return;
    if (activeMarketTicker === null && marketInUrl !== null) return;
    void setMarketInUrl(activeMarketTicker);
  }, [marketInUrl, activeMarketTicker, setMarketInUrl]);

  /*
   * Timeframe + subaccount follow the same init-then-mirror pattern as outcome.
   * Edge case: invalid enum strings in URL become parser default before these run,
   * so atoms always receive a legal `TradingTimeframe` / integer subaccount index.
   */
  useEffect(() => {
    if (didInitTimeframeRef.current) return;
    didInitTimeframeRef.current = true;
    setActiveTimeframe(timeframeInUrl);
  }, [timeframeInUrl, setActiveTimeframe]);

  useEffect(() => {
    if (timeframeInUrl === activeTimeframe) return;
    setTimeframeInUrl(activeTimeframe);
  }, [timeframeInUrl, activeTimeframe, setTimeframeInUrl]);

  useEffect(() => {
    if (didInitSubaccountRef.current) return;
    didInitSubaccountRef.current = true;
    setActiveSubaccount(subaccountInUrl);
  }, [subaccountInUrl, setActiveSubaccount]);

  useEffect(() => {
    if (subaccountInUrl === activeSubaccount) return;
    setSubaccountInUrl(activeSubaccount);
  }, [
    subaccountInUrl,
    activeSubaccount,
    setSubaccountInUrl,
  ]);
};
