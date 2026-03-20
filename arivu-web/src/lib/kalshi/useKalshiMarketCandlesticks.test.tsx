"use client";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { resetKalshiPrivateKeyImportCache } from "./kalshiAuth";
import {
  getTestKalshiPrivateKeyPem,
  kalshiDemoBaseUrl,
  resolveFetchUrl,
} from "./kalshiTestKeys";
import { useKalshiMarketCandlesticks } from "./useKalshiMarketCandlesticks";

const Harness = () => {
  const { candles, loading, error } = useKalshiMarketCandlesticks({
    ticker: "ev_1",
    timeframe: "1D",
  });

  return (
    <div>
      <div data-testid="loading">{loading ? "yes" : "no"}</div>
      <div data-testid="error">{error ?? ""}</div>
      <div data-testid="count">{candles.length}</div>
      <div data-testid="first-open">{candles[0]?.open ?? 0}</div>
    </div>
  );
};

describe("useKalshiMarketCandlesticks", () => {
  afterEach(() => {
    resetKalshiPrivateKeyImportCache();
    vi.unstubAllEnvs();
  });

  test("fetches meta then candlesticks and maps to chart candles", async () => {
    const pem = await getTestKalshiPrivateKeyPem();
    vi.stubEnv("NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID", "ak_123");
    vi.stubEnv("NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM", pem);
    vi.stubEnv("NEXT_PUBLIC_KALSHI_BASE_URL", kalshiDemoBaseUrl);

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveFetchUrl(input);
      if (
        url.includes("demo-api.kalshi.co") &&
        url.includes("/trade-api/v2/markets/ev_1") &&
        !url.includes("orderbook") &&
        !url.includes("candlesticks")
      ) {
        return new Response(
          JSON.stringify({ market: { series_ticker: "ser_1" } }),
          { status: 200 },
        );
      }

      if (
        url.includes("demo-api.kalshi.co") &&
        url.includes("/series/ser_1/markets/ev_1/candlesticks")
      ) {
        return new Response(
          JSON.stringify({
            ticker: "ev_1",
            candlesticks: [
              {
                end_period_ts: 0,
                yes_bid: {
                  open_dollars: "0.50",
                  low_dollars: "0.45",
                  high_dollars: "0.55",
                  close_dollars: "0.52",
                },
                yes_ask: {
                  open_dollars: "0.51",
                  low_dollars: "0.46",
                  high_dollars: "0.56",
                  close_dollars: "0.53",
                },
                price: {
                  open_dollars: "0.50",
                  low_dollars: "0.45",
                  high_dollars: "0.55",
                  close_dollars: "0.52",
                },
                volume_fp: "10.00",
                open_interest_fp: "100.00",
              },
            ],
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    vi.stubGlobal("fetch", fetchSpy);

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("no");
      expect(screen.getByTestId("error").textContent).toBe("");
      expect(screen.getByTestId("count").textContent).toBe("1");
      expect(screen.getByTestId("first-open").textContent).toBe("0.5");
    });
  });
});
