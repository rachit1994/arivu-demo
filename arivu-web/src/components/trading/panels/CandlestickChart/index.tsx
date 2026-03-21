"use client";

import type { ChartCandle } from "@/lib/trading/hooks";

import { useCandlestickChart } from "./hooks/useCandlestickChart";

type Props = {
  candles: ChartCandle[];
};

export const CandlestickChart = ({ candles }: Props) => {
  const { mountRef, isTest, shown, lastPx } = useCandlestickChart(candles);

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 px-2 pb-2 pt-2">
      <div
        ref={mountRef}
        className="h-[300px] w-full"
        data-testid={isTest ? "lw-chart-test-stub" : undefined}
      />
      <div className="mt-2 text-[11px] text-neutral-500">
        {shown.length === 0 && (
          <div className="flex h-[22px] items-center justify-center">
            Warming_up…
          </div>
        )}
        {shown.length > 0 && (
          <div className="flex items-center justify-between">
            <div>Close {lastPx.toFixed(3)}</div>
            <div>{shown.length} candles</div>
          </div>
        )}
      </div>
    </div>
  );
};
