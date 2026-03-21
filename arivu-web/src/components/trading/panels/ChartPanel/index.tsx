"use client";

import { CandlestickChart } from "../CandlestickChart";
import { PanelFrame } from "../PanelFrame";

import { useChartPanelCandles } from "./hooks/useChartPanelCandles";

export const ChartPanel = () => {
  const candlesToRender = useChartPanelCandles();

  return (
    <div data-testid="chart-panel" className="flex h-full min-h-0 flex-col">
      <PanelFrame title="Chart">
        <CandlestickChart candles={candlesToRender} />
      </PanelFrame>
    </div>
  );
};
