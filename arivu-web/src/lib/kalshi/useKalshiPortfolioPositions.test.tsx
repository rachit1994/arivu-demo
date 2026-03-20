"use client";

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { useKalshiPortfolioPositions } from "./useKalshiPortfolioPositions";

const Harness = () => {
  const { rows, loading, error } = useKalshiPortfolioPositions({
    ticker: "ev_1",
    subaccount: 0,
  });

  return (
    <div>
      <div data-testid="loading">{loading ? "yes" : "no"}</div>
      <div data-testid="error">{error ?? ""}</div>
      <div data-testid="first-market">{rows[0]?.marketTicker ?? ""}</div>
      <div data-testid="first-pnl">{rows[0]?.realizedPnl ?? ""}</div>
    </div>
  );
};

describe("useKalshiPortfolioPositions", () => {
  test("loads market positions and formats dollars", async () => {
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = "priv_pem";
    process.env.KALSHI_BASE_URL = "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          market_positions: [
            {
              ticker: "ev_1",
              position_fp: "1.00",
              total_traded_dollars: "10.00",
              realized_pnl_dollars: "2.00",
              fees_paid_dollars: "0.50",
            },
          ],
          event_positions: [],
          cursor: null,
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("no");
      expect(screen.getByTestId("first-market").textContent).toBe("ev_1");
      expect(screen.getByTestId("first-pnl").textContent).toBe("$2.00");
    });
  });
});

