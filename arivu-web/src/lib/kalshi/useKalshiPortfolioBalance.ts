"use client";

import { useEffect, useMemo, useState } from "react";

import type { PortfolioCell } from "@/lib/mockRealtime/types";

type KalshiBalance = {
  balance: number;
  portfolio_value: number;
  updated_ts: number;
};

const formatUsdFromCents = (cents: number): string => {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPnlFromCents = (cents: number): string => {
  const abs = Math.abs(cents);
  const sign = cents >= 0 ? "+" : "-";
  const dollars = abs / 100;
  return `${sign}$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const useKalshiPortfolioBalance = ({
  subaccount,
}: {
  subaccount?: number;
}): { portfolio: PortfolioCell[]; loading: boolean; error: string | null } => {
  const [portfolio, setPortfolio] = useState<PortfolioCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (Number.isInteger(subaccount) && subaccount! >= 0) {
      params.set("subaccount", String(subaccount));
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [subaccount]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch(`/api/kalshi/portfolio/balance${query}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Kalshi balance request failed");

        const data = (await res.json()) as KalshiBalance;

        const pnlCents = data.portfolio_value - data.balance;

        setPortfolio([
          { label: "Cash", value: formatUsdFromCents(data.balance) },
          {
            label: "Portfolio value",
            value: formatUsdFromCents(data.portfolio_value),
          },
          { label: "PnL", value: formatPnlFromCents(pnlCents) },
        ]);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      globalThis.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  return { portfolio, loading, error };
};

