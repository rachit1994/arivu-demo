"use client";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { resetKalshiPrivateKeyImportCache } from "./kalshiAuth";
import {
  getTestKalshiPrivateKeyPem,
  kalshiDemoBaseUrl,
  resolveFetchUrl,
} from "./kalshiTestKeys";
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
  afterEach(() => {
    resetKalshiPrivateKeyImportCache();
    vi.unstubAllEnvs();
  });

  test("loads market positions and formats dollars", async () => {
    const pem = await getTestKalshiPrivateKeyPem();
    vi.stubEnv("NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID", "ak_123");
    vi.stubEnv("NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM", pem);
    vi.stubEnv("NEXT_PUBLIC_KALSHI_BASE_URL", kalshiDemoBaseUrl);

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveFetchUrl(input);
      if (!url.includes("demo-api.kalshi.co") || !url.includes("/portfolio/positions")) {
        return new Response(JSON.stringify({}), { status: 404 });
      }
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
