"use client";

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

  const bookMid = useMemo(() => {
    const bb = bidsRaw.at(0)?.px;
    const ba = asksRaw.at(0)?.px;
    if (bb === undefined || ba === undefined) return null;
    if (!Number.isFinite(bb) || !Number.isFinite(ba)) return null;
    return (bb + ba) / 2;
  }, [asksRaw, bidsRaw]);

  const { askRows, bidRows, maxCum } = useMemo(() => {
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
    lastPrice = streamLast;
  }

  const markPrice = bookMid;
  const spreadLabel = hasKalshi ? kalshi.spreadText : spread;

  const showAsks = layoutMode === "combined" || layoutMode === "asks";
  const showBids = layoutMode === "combined" || layoutMode === "bids";

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
