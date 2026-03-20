"use client";

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { useKalshiPortfolioFills } from "./useKalshiPortfolioFills";

const Harness = () => {
  const { rows, loading, error } = useKalshiPortfolioFills({
    ticker: "ev_1",
    subaccount: 0,
  });

  return (
    <div>
      <div data-testid="loading">{loading ? "yes" : "no"}</div>
      <div data-testid="error">{error ?? ""}</div>
      <div data-testid="first-date">{rows[0]?.date ?? ""}</div>
      <div data-testid="first-fee">{rows[0]?.fee ?? ""}</div>
    </div>
  );
};

describe("useKalshiPortfolioFills", () => {
  test("loads fills and formats date/fee", async () => {
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = "priv_pem";
    process.env.KALSHI_BASE_URL = "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          fills: [
            {
              fill_id: "f_1",
              trade_id: "f_1",
              order_id: "o_1",
              ticker: "ev_1",
              market_ticker: "ev_1",
              side: "yes",
              action: "buy",
              count_fp: "1.00",
              yes_price_dollars: "0.550000",
              no_price_dollars: "0.450000",
              yes_price_fixed: "0.55",
              no_price_fixed: "0.45",
              is_taker: false,
              fee_cost: "0.01",
              subaccount_number: 0,
              created_time: "2026-03-18T10:00:00Z",
            },
          ],
          cursor: null,
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("no");
      expect(screen.getByTestId("error").textContent).toBe("");
      expect(screen.getByTestId("first-date").textContent).toBe("2026-03-18");
      expect(screen.getByTestId("first-fee").textContent).toBe("$0.01");
    });
  });
});

