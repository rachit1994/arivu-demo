"use client";

/**
 * Center column: live or mock depth, toolbar (layout + tick size), and row clicks
 * that drive the order ticket via Jotai (`useOrderBookTicketPickSync`).
 *
 * `onPickTicket` prop: optional override for tests or embedded demos; default wires
 * the real ticket atoms without lifting state to `page.tsx`.
 *
 * Row keys: real rows use price+cumulative; padded placeholders use stable `*-pad-i`
 * keys so React does not reuse DOM between disabled filler rows and real data.
 */
import { PanelFrame } from "../PanelFrame";
import {
  OrderbookDepthRow,
  type TicketPick,
} from "../orderbook/OrderbookDepthRow";
import { OrderbookMiddleStrip } from "../orderbook/OrderbookMiddleStrip";
import { OrderbookToolbar } from "../orderbook/OrderbookToolbar";

import { useOrderBookPanel } from "./hooks/useOrderBookPanel";
import { useOrderBookTicketPickSync } from "./hooks/useOrderBookTicketPickSync";

export type { TicketPick };

interface Props {
  onPickTicket?: (pick: TicketPick) => void;
}

export const OrderBookPanel = ({ onPickTicket: onPickTicketProp }: Props) => {
  const onPickTicketSync = useOrderBookTicketPickSync();
  const onPickTicket = onPickTicketProp ?? onPickTicketSync;

  const {
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
    onPickTicket: onPick,
  } = useOrderBookPanel({ onPickTicket });

  return (
    // `overflow-hidden` on shell; inner ask/bid sections own `overflow-y-auto` scroll.
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
                    onPick={onPick}
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
                    onPick={onPick}
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
