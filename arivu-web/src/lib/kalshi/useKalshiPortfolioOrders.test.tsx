"use client";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { resetKalshiPrivateKeyImportCache } from "./kalshiAuth";
import {
  getTestKalshiPrivateKeyPem,
  kalshiDemoBaseUrl,
  resolveFetchUrl,
} from "./kalshiTestKeys";
import { useKalshiPortfolioOrders } from "./useKalshiPortfolioOrders";

const Harness = () => {
  const { rows, loading, error } = useKalshiPortfolioOrders({
    ticker: "ev_1",
    subaccount: 0,
  });

  return (
    <div>
      <div data-testid="loading">{loading ? "yes" : "no"}</div>
      <div data-testid="error">{error ?? ""}</div>
      <div data-testid="first-price">{rows[0]?.price ?? ""}</div>
      <div data-testid="first-side">{rows[0]?.side ?? ""}</div>
    </div>
  );
};

describe("useKalshiPortfolioOrders", () => {
  afterEach(() => {
    resetKalshiPrivateKeyImportCache();
    vi.unstubAllEnvs();
  });

  test("loads orders and formats price", async () => {
    const pem = await getTestKalshiPrivateKeyPem();
    vi.stubEnv("NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID", "ak_123");
    vi.stubEnv("NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM", pem);
    vi.stubEnv("NEXT_PUBLIC_KALSHI_BASE_URL", kalshiDemoBaseUrl);

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveFetchUrl(input);
      if (!url.includes("demo-api.kalshi.co") || !url.includes("/portfolio/orders")) {
        return new Response(JSON.stringify({}), { status: 404 });
      }
      return new Response(
        JSON.stringify({
          orders: [
            {
              order_id: "o_1",
              user_id: "u_1",
              client_order_id: "c_1",
              ticker: "ev_1",
              side: "yes",
              action: "buy",
              type: "limit",
              status: "resting",
              yes_price_dollars: "0.550000",
              no_price_dollars: "0.450000",
              fill_count_fp: "0.00",
              remaining_count_fp: "2.00",
              initial_count_fp: "2.00",
              taker_fees_dollars: "0.00",
              maker_fees_dollars: "0.00",
              taker_fill_cost_dollars: "0.00",
              maker_fill_cost_dollars: "0.00",
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
      expect(screen.getByTestId("first-price").textContent).toBe("$0.55");
      expect(screen.getByTestId("first-side").textContent).toBe("YES");
    });
  });
});
