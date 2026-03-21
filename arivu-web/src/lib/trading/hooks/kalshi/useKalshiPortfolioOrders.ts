"use client";

import { useEffect, useMemo, useState } from "react";

import { kalshiAuthedJsonGet } from "./kalshiClientRequest";
import {
  formatKalshiDollarsUsd,
  formatKalshiFixedPointCount,
} from "./formatKalshiFixedPoints";

type KalshiOrdersResponse = {
  orders: unknown[];
  cursor: string | null;
};

export type PortfolioOrderRow = {
  orderId: string;
  side: "YES" | "NO";
  action: "BUY" | "SELL";
  price: string;
  remaining: string;
  status: string;
};

export const useKalshiPortfolioOrders = ({
  ticker,
  subaccount,
}: {
  ticker?: string | null;
  subaccount?: number;
}): {
  rows: PortfolioOrderRow[];
  loading: boolean;
  error: string | null;
} => {
  const effectiveSubaccount = typeof subaccount === "number" ? subaccount : 0;

  const query = useMemo(() => {
    if (!ticker) return `?subaccount=${effectiveSubaccount}`;
    return `?ticker=${encodeURIComponent(ticker)}&subaccount=${effectiveSubaccount}`;
  }, [ticker, effectiveSubaccount]);

  const [rows, setRows] = useState<PortfolioOrderRow[]>([]);
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
        const result = await kalshiAuthedJsonGet(`/portfolio/orders${query}`, {
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
        if (typeof data !== "object" || data === null || !("orders" in data)) {
          throw new Error("Kalshi orders response malformed");
        }

        const normalized = data as KalshiOrdersResponse;
        const mapped: PortfolioOrderRow[] = (normalized.orders ?? [])
          .slice(0, 50)
          .map((o) => {
            if (typeof o !== "object" || o === null) return null;
            const order = o as Record<string, unknown>;
            const sideRaw =
              typeof order.side === "string" ? order.side : "";
            const side: "YES" | "NO" = sideRaw === "yes" ? "YES" : "NO";
            const actionRaw =
              typeof order.action === "string" ? order.action : "";
            const action: "BUY" | "SELL" =
              actionRaw === "buy" ? "BUY" : "SELL";

            const yesPriceRaw =
              typeof order.yes_price_dollars === "string"
                ? order.yes_price_dollars
                : null;
            const noPriceRaw =
              typeof order.no_price_dollars === "string"
                ? order.no_price_dollars
                : null;

            const priceRaw = side === "YES" ? yesPriceRaw : noPriceRaw;

            return {
              orderId:
                typeof order.order_id === "string"
                  ? order.order_id
                  : "—",
              side,
              action,
              price: formatKalshiDollarsUsd(
                typeof priceRaw === "string" ? priceRaw : null,
              ),
              remaining: formatKalshiFixedPointCount(
                typeof order.remaining_count_fp === "string"
                  ? order.remaining_count_fp
                  : null,
              ),
              status:
                typeof order.status === "string" ? order.status : "—",
            };
          })
          .filter((x): x is PortfolioOrderRow => x !== null);

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

