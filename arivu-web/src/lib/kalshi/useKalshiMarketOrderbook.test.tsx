"use client";

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { useKalshiMarketOrderbook } from "./useKalshiMarketOrderbook";

const Harness = () => {
  const { bids, asks, mid, spreadText, loading } = useKalshiMarketOrderbook({
    ticker: "ev_1",
    depth: 5,
  });

  return (
    <div>
      <div data-testid="loading">{loading ? "yes" : "no"}</div>
      <div data-testid="bids">{bids.length}</div>
      <div data-testid="asks">{asks.length}</div>
      <div data-testid="mid">{mid === null ? "null" : mid.toFixed(3)}</div>
      <div data-testid="spread">{spreadText}</div>
    </div>
  );
};

describe("useKalshiMarketOrderbook", () => {
  describe("Positive cases", () => {
    test("fetches /api/kalshi/markets/:ticker/orderbook and maps", async () => {
      process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
      process.env.KALSHI_PRIVATE_KEY_PEM = "priv_pem";
      process.env.KALSHI_BASE_URL =
        "https://demo-api.kalshi.co/trade-api/v2";

      const fetchSpy = vi.fn(async (input: RequestInfo) => {
        if (typeof input !== "string")
          throw new Error("Unexpected fetch input");
        if (!input.includes("/api/kalshi/markets/ev_1/orderbook")) {
          return new Response(JSON.stringify({}), { status: 404 });
        }

        return new Response(
          JSON.stringify({
            orderbook_fp: {
              yes_dollars: [
                ["0.40", "10.00"],
                ["0.45", "5.00"],
              ],
              no_dollars: [
                ["0.50", "7.00"],
                ["0.55", "12.00"],
              ],
            },
          }),
          { status: 200 },
        );
      });

      vi.stubGlobal("fetch", fetchSpy);

      render(<Harness />);

      await waitFor(() => {
        const loading = screen.getAllByTestId("loading").at(-1)!;
        const bids = screen.getAllByTestId("bids").at(-1)!;
        const asks = screen.getAllByTestId("asks").at(-1)!;
        const mid = screen.getAllByTestId("mid").at(-1)!;
        const spread = screen.getAllByTestId("spread").at(-1)!;

        expect(loading.textContent).toBe("no");
        expect(bids.textContent).toBe("2");
        expect(asks.textContent).toBe("2");
        expect(mid.textContent).toBe("0.450");
        expect(spread.textContent).toBe("0.000");
      });
    });
  });

  describe("Negative cases", () => {
    test("treats 503 from orderbook as no Kalshi data", async () => {
      const fetchSpy = vi.fn(async (input: RequestInfo) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/api/kalshi/markets/ev_1/orderbook")) {
          return new Response(JSON.stringify({ error: "Kalshi not configured" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({}), { status: 404 });
      });

      vi.stubGlobal("fetch", fetchSpy);
      render(<Harness />);

      await waitFor(() => {
        const loading = screen.getAllByTestId("loading").at(-1)!;
        const bids = screen.getAllByTestId("bids").at(-1)!;
        const asks = screen.getAllByTestId("asks").at(-1)!;
        const mid = screen.getAllByTestId("mid").at(-1)!;
        const spread = screen.getAllByTestId("spread").at(-1)!;

        expect(loading.textContent).toBe("no");
        expect(bids.textContent).toBe("0");
        expect(asks.textContent).toBe("0");
        expect(mid.textContent).toBe("null");
        expect(spread.textContent).toBe("—");
      });
    });
  });
});

