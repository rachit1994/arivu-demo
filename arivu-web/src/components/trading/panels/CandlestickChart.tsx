"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ChartCandle } from "@/lib/kalshi/mapKalshiCandlesticksToChartCandles";
import { mapChartCandlesToLightweightSeriesData } from "@/lib/charting/lightweightCharts";

type Props = {
  candles: ChartCandle[];
};

export const CandlestickChart = ({ candles }: Props) => {
  const isTest = process.env.NODE_ENV === "test";
  const mountRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<{ remove: () => void; resize: (w: number, h: number, force?: boolean) => void; timeScale: () => { fitContent: () => void } } | null>(null);
  // We store as `unknown` to keep this file decoupled from heavyweight generic types.
  const candleSeriesRef = useRef<unknown>(null);
  const volumeSeriesRef = useRef<unknown>(null);

  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const shown = useMemo(() => {
    // In production we render "as much as fits". With lightweight-charts, barSpacing
    // controls density; this simple slice prevents runaway work on very large arrays.
    return candles.slice(-400);
  }, [candles]);

  const lastPx = shown.at(-1)?.close ?? 0;

  useEffect(() => {
    if (isTest) return;
    const el = mountRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.floor(r.width);
      const h = Math.floor(r.height);
      if (w <= 0 || h <= 0) return;
      setSize({ w, h });
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isTest]);

  useEffect(() => {
    if (isTest) return;
    const el = mountRef.current;
    if (!el) return;
    if (size.w <= 0 || size.h <= 0) return;

    if (chartRef.current) {
      chartRef.current.resize(size.w, size.h, true);
      return;
    }

    {
      let cancelled = false;
      const init = async () => {
        const mod = await import("lightweight-charts");
        if (cancelled) return;

        const chart = mod.createChart(el, {
          autoSize: true,
          layout: {
            background: { type: mod.ColorType.Solid, color: "rgb(23 23 23)" },
            textColor: "rgba(255,255,255,0.55)",
          },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.06)" },
            horzLines: { color: "rgba(255,255,255,0.06)" },
          },
          rightPriceScale: {
            borderColor: "rgba(255,255,255,0.10)",
            scaleMargins: { top: 0.08, bottom: 0.22 },
          },
          timeScale: {
            borderColor: "rgba(255,255,255,0.10)",
            fixLeftEdge: true,
            fixRightEdge: true,
          },
          crosshair: { mode: 0 },
        });

        const candleSeries = chart.addSeries(mod.CandlestickSeries, {
          upColor: "rgba(0, 210, 148, 0.85)",
          downColor: "rgba(255, 35, 87, 0.78)",
          wickUpColor: "rgb(0 210 148)",
          wickDownColor: "rgb(255 35 87)",
          borderUpColor: "rgb(0 210 148)",
          borderDownColor: "rgb(255 35 87)",
          priceLineVisible: false,
          lastValueVisible: false,
        });

        const volumeSeries = chart.addSeries(mod.HistogramSeries, {
          priceScaleId: "",
          priceLineVisible: false,
          lastValueVisible: false,
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries as unknown;
        volumeSeriesRef.current = volumeSeries as unknown;
      };

      void init();

      return () => {
        cancelled = true;
      };
    }
  }, [isTest, size.h, size.w]);

  useEffect(() => {
    if (isTest) return;
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!chart || !candleSeries || !volumeSeries) return;
    if (shown.length === 0) return;

    const start = Math.floor(Date.now() / 1000) - shown.length * 60;
    const mapped = mapChartCandlesToLightweightSeriesData({
      candles: shown,
      startTimeSeconds: start,
      intervalSeconds: 60,
    });

    (candleSeries as { setData: (d: unknown) => void }).setData(
      mapped.candlesticks,
    );
    (volumeSeries as { setData: (d: unknown) => void }).setData(mapped.volumes);
    chart.timeScale().fitContent();
  }, [isTest, shown]);

  useEffect(() => {
    if (isTest) return;
    const chart = chartRef.current;
    if (!chart) return;
    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [isTest]);

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

