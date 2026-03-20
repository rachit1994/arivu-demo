import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { resetKalshiPrivateKeyImportCache } from "@/lib/kalshi/kalshiAuth";
import {
  getTestKalshiPrivateKeyPem,
  kalshiDemoBaseUrl,
  resolveFetchUrl,
} from "@/lib/kalshi/kalshiTestKeys";
import { MockRealtimeProvider } from "@/lib/mockRealtime";

import { PortfolioMini } from "./PortfolioMini";

describe("PortfolioMini", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    resetKalshiPrivateKeyImportCache();
  });

  test("renders Cash/Portfolio value/PnL from Kalshi balance response", async () => {
    const pem = await getTestKalshiPrivateKeyPem();
    vi.stubEnv("NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID", "ak_test");
    vi.stubEnv("NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM", pem);
    vi.stubEnv("NEXT_PUBLIC_KALSHI_BASE_URL", kalshiDemoBaseUrl);

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveFetchUrl(input);
      if (!url.includes("demo-api.kalshi.co") || !url.includes("/portfolio/balance")) {
        return new Response(JSON.stringify({}), { status: 404 });
      }
      return new Response(
        JSON.stringify({
          balance: 10000,
          portfolio_value: 12000,
          updated_ts: 1703123456789,
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    render(
      <MockRealtimeProvider enabled={false}>
        <PortfolioMini />
      </MockRealtimeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Portfolio value")).toBeInTheDocument();
      expect(screen.getByText("+$20.00")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
    });
  });
});
