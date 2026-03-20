"use client";

import { useEffect, useRef } from "react";
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

const outcomeKeys: TicketOutcome[] = ["YES", "NO"];

export const TradingUrlSync = () => {
  const [pickedOutcome, setPickedOutcome] = useAtom(ticketPickedOutcomeAtom);
  const [activeMarketTicker, setActiveMarketTicker] = useAtom(activeMarketTickerAtom);
  const [activeTimeframe, setActiveTimeframe] = useAtom(activeTimeframeAtom);
  const [activeSubaccount, setActiveSubaccount] = useAtom(activeSubaccountAtom);
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
    parseAsInteger.withDefault(0).withOptions({ history: "replace" }),
  );

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    setPickedOutcome(outcomeInUrl);
  }, [outcomeInUrl, setPickedOutcome]);

  useEffect(() => {
    if (outcomeInUrl === pickedOutcome) return;
    setOutcomeInUrl(pickedOutcome);
  }, [outcomeInUrl, pickedOutcome, setOutcomeInUrl]);

  useEffect(() => {
    if (didInitMarketRef.current) return;
    didInitMarketRef.current = true;
    setActiveMarketTicker(marketInUrl);
  }, [marketInUrl, setActiveMarketTicker]);

  useEffect(() => {
    if (marketInUrl === activeMarketTicker) return;
    setMarketInUrl(activeMarketTicker);
  }, [marketInUrl, activeMarketTicker, setMarketInUrl]);

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

  return null;
};

