"use client";

import { useEffect, useMemo, useState } from "react";

import { formatKalshiDollarsUsd, formatKalshiFixedPointCount } from "./formatKalshiFixedPoints";
import { kalshiAuthedJsonGet } from "./kalshiClientRequest";

type KalshiPositionsResponse = {
  market_positions: unknown[];
  event_positions: unknown[];
  cursor: string | null;
};

export type PortfolioPositionRow = {
  marketTicker: string;
  positionContracts: string;
  totalTraded: string;
  realizedPnl: string;
  feesPaid: string;
};

export const useKalshiPortfolioPositions = ({
  ticker,
  subaccount,
}: {
  ticker?: string | null;
  subaccount?: number;
}): {
  rows: PortfolioPositionRow[];
  loading: boolean;
  error: string | null;
} => {
  const effectiveSubaccount = typeof subaccount === "number" ? subaccount : 0;

  const query = useMemo(() => {
    if (!ticker) return `?subaccount=${effectiveSubaccount}`;
    return `?ticker=${encodeURIComponent(ticker)}&subaccount=${effectiveSubaccount}`;
  }, [ticker, effectiveSubaccount]);

  const [rows, setRows] = useState<PortfolioPositionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await kalshiAuthedJsonGet(`/portfolio/positions${query}`, {
          signal: controller.signal,
          timeoutMs: 8000,
        });

        if (result.kind === "unconfigured") {
          setRows([]);
          setError(null);
          return;
        }
        if (result.kind === "error") {
          throw new Error(result.message);
        }

        const data = result.data as unknown;
        if (
          typeof data !== "object" ||
          data === null ||
          !("market_positions" in data)
        ) {
          throw new Error("Kalshi positions response malformed");
        }

        const normalized = data as KalshiPositionsResponse;
        const mapped: PortfolioPositionRow[] = (normalized.market_positions ?? [])
          .slice(0, 50)
          .map((mp) => {
            if (typeof mp !== "object" || mp === null) return null;
            const m = mp as Partial<Record<string, unknown>>;
            const marketTicker =
              typeof m.ticker === "string" ? m.ticker : "—";
            return {
              marketTicker,
              positionContracts: formatKalshiFixedPointCount(
                typeof m.position_fp === "string"
                  ? m.position_fp
                  : (m.position_fp as string | null | undefined),
              ),
              totalTraded: formatKalshiDollarsUsd(
                typeof m.total_traded_dollars === "string"
                  ? m.total_traded_dollars
                  : (m.total_traded_dollars as string | null | undefined),
              ),
              realizedPnl: formatKalshiDollarsUsd(
                typeof m.realized_pnl_dollars === "string"
                  ? m.realized_pnl_dollars
                  : (m.realized_pnl_dollars as string | null | undefined),
              ),
              feesPaid: formatKalshiDollarsUsd(
                typeof m.fees_paid_dollars === "string"
                  ? m.fees_paid_dollars
                  : (m.fees_paid_dollars as string | null | undefined),
              ),
            };
          })
          .filter((x): x is PortfolioPositionRow => x !== null);

        setRows(mapped);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Unknown error");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      globalThis.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, ticker]);

  return { rows, loading, error };
};

