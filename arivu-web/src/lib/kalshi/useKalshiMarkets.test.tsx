"use client";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useEffect } from "react";

import { resetKalshiPrivateKeyImportCache } from "./kalshiAuth";
import {
  getTestKalshiPrivateKeyPem,
  kalshiDemoBaseUrl,
  resolveFetchUrl,
} from "./kalshiTestKeys";
import { useKalshiMarkets } from "./useKalshiMarkets";

const Harness = () => {
  const { topics, cursor, loading, error } = useKalshiMarkets({
    limit: 2,
  });

  useEffect(() => {
    if (error) return;
  }, [error]);

  return (
    <div>
      <div data-testid="loading">{loading ? "yes" : "no"}</div>
      <div data-testid="cursor">{cursor ?? ""}</div>
      <div data-testid="first-category">{topics[0]?.category ?? ""}</div>
    </div>
  );
};

describe("useKalshiMarkets", () => {
  afterEach(() => {
    resetKalshiPrivateKeyImportCache();
    vi.unstubAllEnvs();
  });

  test("loads markets and maps them into topic quotes", async () => {
    const pem = await getTestKalshiPrivateKeyPem();
    vi.stubEnv("NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID", "ak_test");
    vi.stubEnv("NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM", pem);
    vi.stubEnv("NEXT_PUBLIC_KALSHI_BASE_URL", kalshiDemoBaseUrl);

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveFetchUrl(input);
      if (!url.includes("demo-api.kalshi.co") || !url.includes("/markets?")) {
        return new Response(JSON.stringify({}), { status: 404 });
      }
      return new Response(
        JSON.stringify({
          markets: [
            {
              ticker: "ev_1",
              market_type: "binary",
              title: "Midterm election: Senator",
              subtitle: "Will the senator win?",
              yes_sub_title: "YES",
              no_sub_title: "NO",
              last_price_dollars: "0.55",
              yes_bid_dollars: "0.54",
              yes_ask_dollars: "0.56",
              volume: 350019,
            },
          ],
          cursor: "cursor_1",
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("no");
      expect(screen.getByTestId("cursor").textContent).toBe("cursor_1");
      expect(screen.getByTestId("first-category").textContent).toBe(
        "Elections",
      );
    });
  });
});
