"use client";

import { useMockRealtime } from "@/lib/mockRealtime";
import { useKalshiPortfolioBalance } from "@/lib/trading/hooks";

export const usePortfolioMini = (): {
  portfolio: ReturnType<typeof useMockRealtime>["portfolio"];
} => {
  const { portfolio: mockPortfolio } = useMockRealtime();
  const { portfolio: kalshiPortfolio, loading, error } =
    useKalshiPortfolioBalance({});

  const portfolio =
    !loading && !error && kalshiPortfolio.length > 0
      ? kalshiPortfolio
      : mockPortfolio;

  return { portfolio };
};
