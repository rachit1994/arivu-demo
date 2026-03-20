"use client";

import { useAtom } from "jotai";
import { useMemo, useState } from "react";

import { useMockRealtime } from "@/lib/mockRealtime";
import { aggregateOrderbookLevelsByStep } from "@/lib/orderbook/aggregateLevelsByStep";
import { buildMockBidAskFromSnapshot } from "@/lib/orderbook/buildMockBidAskFromSnapshot";
import {
  prepareAskRowsHighToLow,
  prepareBidRowsHighToLow,
  type DisplayOrderbookRow,
} from "@/lib/orderbook/prepareOrderbookDisplayRows";
import { useKalshiMarketOrderbook } from "@/lib/kalshi/useKalshiMarketOrderbook";
import { activeMarketTickerAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";

import { PanelFrame } from "./PanelFrame";
import {
  ORDERBOOK_FETCH_DEPTH,
  ORDERBOOK_POLL_MS,
  ORDERBOOK_VISIBLE_ROWS,
  type OrderbookLayoutMode,
  type OrderbookPrecisionStep,
} from "./orderbook/orderbookConstants";
import {
  OrderbookDepthRow,
  type TicketPick,
} from "./orderbook/OrderbookDepthRow";
import { OrderbookMiddleStrip } from "./orderbook/OrderbookMiddleStrip";
import { OrderbookToolbar } from "./orderbook/OrderbookToolbar";

export type { TicketPick } from "./orderbook/OrderbookDepthRow";

interface Props {
  onPickTicket?: (pick: TicketPick) => void;
}

type PaddedRow = DisplayOrderbookRow & { disabled: boolean };

const padRows = (rows: DisplayOrderbookRow[], count: number): PaddedRow[] => {
  const out: PaddedRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const r = rows[i];
    if (r) {
      out.push({ ...r, disabled: false });
      continue;
    }
    out.push({
      px: -i - 1,
      qty: 0,
      cumulative: 0,
      disabled: true,
    });
  }
  return out;
};

export const OrderBookPanel = ({ onPickTicket }: Props) => {
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
  const asksPadded = padRows(askRows, rowCount);
  const bidsPadded = padRows(bidRows, rowCount);

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

  return (
    <div
      data-testid="orderbook-panel"
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <PanelFrame title="Order Book">
        <div className="flex h-full min-h-0 flex-col gap-2">
          <OrderbookToolbar
            layoutMode={layoutMode}
            onLayoutMode={setLayoutMode}
            precisionStep={precisionStep}
            onPrecisionStep={setPrecisionStep}
          />

          <div className="grid shrink-0 grid-cols-[1fr_1fr_1fr] gap-1 px-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
            <div>Price (USD)</div>
            <div className="text-center">Size</div>
            <div className="text-right">Total</div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {showAsks ? (
              <div
                className={sideScrollClass}
                data-testid="orderbook-asks-section"
              >
                {asksPadded.map((row, i) => (
                  <OrderbookDepthRow
                    key={
                      row.disabled
                        ? `a-pad-${i}`
                        : `a-${row.px}-${row.cumulative}`
                    }
                    side="ask"
                    index={i}
                    row={row}
                    maxCumulative={maxCum}
                    disabled={row.disabled}
                    onPick={onPickTicket}
                  />
                ))}
              </div>
            ) : null}

            <OrderbookMiddleStrip
              lastPrice={lastPrice}
              markPrice={markPrice}
              spreadLabel={spreadLabel}
            />

            {showBids ? (
              <div
                className={sideScrollClass}
                data-testid="orderbook-bids-section"
              >
                {bidsPadded.map((row, i) => (
                  <OrderbookDepthRow
                    key={
                      row.disabled
                        ? `b-pad-${i}`
                        : `b-${row.px}-${row.cumulative}`
                    }
                    side="bid"
                    index={i}
                    row={row}
                    maxCumulative={maxCum}
                    disabled={row.disabled}
                    onPick={onPickTicket}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </PanelFrame>
    </div>
  );
};
