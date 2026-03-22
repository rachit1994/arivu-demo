"use client";

/**
 * Composes **Kalshi REST order book** (when keys + non-empty book exist) with **mock**
 * depth from `useMockRealtime`. Presentation pipeline:
 * raw levels → aggregate by `precisionStep` → trim to `ORDERBOOK_VISIBLE_ROWS` →
 * display order (asks high→low for stacking) → pad to fixed row count for stable UI height.
 *
 * `hasKalshi`: strict check (mid + both sides non-empty) avoids flashing partial Kalshi
 * data during load or after errors — we fall back to mock until the snapshot is usable.
 *
 * `lastPrice`: Kalshi mid wins when live; else book mid from whichever source; else last
 * mock tick from the price stream — gives a sensible “tape” when book mid is missing.
 */

import { useAtom } from "jotai";
import { useMemo, useState } from "react";

import { useMockRealtime } from "@/lib/mockRealtime";
import { aggregateOrderbookLevelsByStep } from "@/lib/orderbook/aggregateLevelsByStep";
import { buildMockBidAskFromSnapshot } from "@/lib/orderbook/buildMockBidAskFromSnapshot";
import {
  prepareAskRowsHighToLow,
  prepareBidRowsHighToLow,
} from "@/lib/orderbook/prepareOrderbookDisplayRows";
import { useKalshiMarketOrderbook } from "@/lib/trading/hooks";
import { activeMarketTickerAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";

import {
  ORDERBOOK_FETCH_DEPTH,
  ORDERBOOK_POLL_MS,
  ORDERBOOK_VISIBLE_ROWS,
  type OrderbookLayoutMode,
  type OrderbookPrecisionStep,
} from "../../orderbook/orderbookConstants";
import type { TicketPick } from "../../orderbook/OrderbookDepthRow";
import { padOrderbookRows, type PaddedOrderbookRow } from "./padOrderbookRows";

interface Args {
  onPickTicket?: (pick: TicketPick) => void;
}

export const useOrderBookPanel = ({
  onPickTicket,
}: Args): {
  layoutMode: OrderbookLayoutMode;
  setLayoutMode: (m: OrderbookLayoutMode) => void;
  precisionStep: OrderbookPrecisionStep;
  setPrecisionStep: (s: OrderbookPrecisionStep) => void;
  asksPadded: PaddedOrderbookRow[];
  bidsPadded: PaddedOrderbookRow[];
  maxCum: number;
  showAsks: boolean;
  showBids: boolean;
  sideScrollClass: string;
  lastPrice: number | null;
  markPrice: number | null;
  spreadLabel: string;
  onPickTicket?: (pick: TicketPick) => void;
} => {
  const [layoutMode, setLayoutMode] = useState<OrderbookLayoutMode>("combined");
  const [precisionStep, setPrecisionStep] =
    useState<OrderbookPrecisionStep>(0.01);

  const [activeMarketTicker] = useAtom(activeMarketTickerAtom);
  const { orderbook, spread, prices } = useMockRealtime();

  const kalshi = useKalshiMarketOrderbook({
    ticker: activeMarketTicker,
    depth: ORDERBOOK_FETCH_DEPTH,
    pollIntervalMs: ORDERBOOK_POLL_MS,
  });

  /*
   * Require a full top-of-book on both sides — one-sided books break spread UI and
   * cumulative bars; mock path is safer for demos until Kalshi returns depth.
   */
  const hasKalshi =
    kalshi.mid !== null && kalshi.bids.length > 0 && kalshi.asks.length > 0;

  const streamLast = prices.at(-1)?.v;

  const { bidsRaw, asksRaw } = useMemo(() => {
    if (hasKalshi) {
      return { bidsRaw: kalshi.bids, asksRaw: kalshi.asks };
    }
    const mock = buildMockBidAskFromSnapshot({ orderbook, spread });
    return { bidsRaw: mock.bids, asksRaw: mock.asks };
  }, [hasKalshi, kalshi.asks, kalshi.bids, orderbook, spread]);

  /** Best bid/ask mid from whichever raw book is active (null if either side missing). */
  const bookMid = useMemo(() => {
    const bb = bidsRaw.at(0)?.px;
    const ba = asksRaw.at(0)?.px;
    if (bb === undefined || ba === undefined) return null;
    if (!Number.isFinite(bb) || !Number.isFinite(ba)) return null;
    return (bb + ba) / 2;
  }, [asksRaw, bidsRaw]);

  const { askRows, bidRows, maxCum } = useMemo(() => {
    /*
     * Aggregation merges levels into tick buckets; slice caps rows so the panel height
     * stays predictable. `maxCum` drives bar width scaling across both sides.
     */
    const bidsAgg = aggregateOrderbookLevelsByStep(
      bidsRaw,
      precisionStep,
      "bid",
    );
    const asksAgg = aggregateOrderbookLevelsByStep(
      asksRaw,
      precisionStep,
      "ask",
    );

    const asksAsc = asksAgg.slice(0, ORDERBOOK_VISIBLE_ROWS);
    const bidsDesc = bidsAgg.slice(0, ORDERBOOK_VISIBLE_ROWS);

    const askDisp = prepareAskRowsHighToLow(asksAsc);
    const bidDisp = prepareBidRowsHighToLow(bidsDesc);

    let max = 0;
    for (const r of askDisp) {
      max = Math.max(max, r.cumulative);
    }
    for (const r of bidDisp) {
      max = Math.max(max, r.cumulative);
    }

    return { askRows: askDisp, bidRows: bidDisp, maxCum: max };
  }, [asksRaw, bidsRaw, precisionStep]);

  const rowCount = ORDERBOOK_VISIBLE_ROWS;
  const asksPadded = padOrderbookRows(askRows, rowCount);
  const bidsPadded = padOrderbookRows(bidRows, rowCount);

  let lastPrice: number | null = bookMid;
  if (hasKalshi) {
    lastPrice = kalshi.mid;
  } else if (streamLast !== undefined && Number.isFinite(streamLast)) {
    // Mock mode: prefer streaming last trade over synthetic book mid when available.
    lastPrice = streamLast;
  }

  const markPrice = bookMid;
  const spreadLabel = hasKalshi ? kalshi.spreadText : spread;

  const showAsks = layoutMode === "combined" || layoutMode === "asks";
  const showBids = layoutMode === "combined" || layoutMode === "bids";

  /*
   * `flex-1 basis-0` lets ask and bid stacks share leftover height evenly in combined
   * mode; each side scrolls independently when rows exceed the viewport.
   */
  const sideScrollClass =
    "flex min-h-0 flex-1 basis-0 flex-col overflow-y-auto";

  return {
    layoutMode,
    setLayoutMode,
    precisionStep,
    setPrecisionStep,
    asksPadded,
    bidsPadded,
    maxCum,
    showAsks,
    showBids,
    sideScrollClass,
    lastPrice,
    markPrice,
    spreadLabel,
    onPickTicket,
  };
};
