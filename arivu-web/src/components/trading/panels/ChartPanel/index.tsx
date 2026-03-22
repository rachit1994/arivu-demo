"use client";

/**
 * Left column of the trading grid: candlestick chart (flexible height) plus the
 * horizontal “Starred” strip pinned under it.
 *
 * Layout edge cases:
 * - The outer column is `flex-col` + `min-h-0` so the chart obeys the grid row height.
 * - Inner `flex-1` wrapper around `PanelFrame` is the scroll boundary for the chart;
 *   without it, the strip competes for height and the chart may not shrink.
 * - `PinnedMarketsStrip` is a sibling below the flex-1 block so it keeps its natural
 *   height; only the chart area flexes. Many starred cards scroll inside the strip.
 */

import { CandlestickChart } from "../CandlestickChart";
import { PinnedMarketsStrip } from "../PinnedMarketsStrip";
import { PanelFrame } from "../PanelFrame";

import { useChartPanelCandles } from "./hooks/useChartPanelCandles";

export const ChartPanel = () => {
  // Hook chooses mock vs Kalshi series based on global selection + provider mode.
  const candlesToRender = useChartPanelCandles();

  return (
    <div
      data-testid="chart-panel"
      className="flex h-full min-h-0 flex-col gap-2"
    >
      <div className="min-h-0 flex-1">
        <PanelFrame title="Chart">
          <CandlestickChart candles={candlesToRender} />
        </PanelFrame>
      </div>
      {/* Starred markets from Jotai; overflow-x-auto on the inner row for many pins. */}
      <PinnedMarketsStrip />
    </div>
  );
};
