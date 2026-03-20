"use client";

import { useEffect, useMemo, useState } from "react";

import {
  formatIsoDateShort,
  formatKalshiDollarsUsd,
  formatKalshiFixedPointCount,
} from "./formatKalshiFixedPoints";

type KalshiFillsResponse = {
  fills: unknown[];
  cursor: string | null;
};

export type PortfolioFillRow = {
  fillId: string;
  date: string;
  side: "YES" | "NO";
  action: "BUY" | "SELL";
  price: string;
  count: string;
  fee: string;
};

export const useKalshiPortfolioFills = ({
  ticker,
  subaccount,
}: {
  ticker?: string | null;
  subaccount?: number;
}): {
  rows: PortfolioFillRow[];
  loading: boolean;
  error: string | null;
} => {
  const effectiveSubaccount = typeof subaccount === "number" ? subaccount : 0;

  const query = useMemo(() => {
    if (!ticker) return `?subaccount=${effectiveSubaccount}`;
    return `?ticker=${encodeURIComponent(ticker)}&subaccount=${effectiveSubaccount}`;
  }, [ticker, effectiveSubaccount]);

  const [rows, setRows] = useState<PortfolioFillRow[]>([]);
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
        const res = await fetch(`/api/kalshi/portfolio/fills${query}`, {
          signal: controller.signal,
        });

        if (res.status === 503) {
          setRows([]);
          setError(null);
          return;
        }
        if (!res.ok) throw new Error("Kalshi fills request failed");

        const data = (await res.json()) as unknown;
        if (typeof data !== "object" || data === null || !("fills" in data)) {
          throw new Error("Kalshi fills response malformed");
        }

        const normalized = data as KalshiFillsResponse;
        const mapped: PortfolioFillRow[] = (normalized.fills ?? [])
          .slice(0, 50)
          .map((f) => {
            if (typeof f !== "object" || f === null) return null;
            const fill = f as Record<string, unknown>;
            const sideRaw =
              typeof fill.side === "string" ? fill.side : "";
            const side: "YES" | "NO" = sideRaw === "yes" ? "YES" : "NO";
            const actionRaw =
              typeof fill.action === "string" ? fill.action : "";
            const action: "BUY" | "SELL" =
              actionRaw === "buy" ? "BUY" : "SELL";

            const yesPriceRaw =
              typeof fill.yes_price_dollars === "string"
                ? fill.yes_price_dollars
                : null;
            const noPriceRaw =
              typeof fill.no_price_dollars === "string"
                ? fill.no_price_dollars
                : null;
            const priceRaw = side === "YES" ? yesPriceRaw : noPriceRaw;

            const date = formatIsoDateShort(
              typeof fill.created_time === "string"
                ? fill.created_time
                : undefined,
            );

            return {
              fillId:
                typeof fill.fill_id === "string" ? fill.fill_id : "—",
              date,
              side,
              action,
              price: formatKalshiDollarsUsd(
                typeof priceRaw === "string" ? priceRaw : null,
              ),
              count: formatKalshiFixedPointCount(
                typeof fill.count_fp === "string" ? fill.count_fp : null,
              ),
              fee: formatKalshiDollarsUsd(
                typeof fill.fee_cost === "string" ? fill.fee_cost : null,
              ),
            };
          })
          .filter((x): x is PortfolioFillRow => x !== null);

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

