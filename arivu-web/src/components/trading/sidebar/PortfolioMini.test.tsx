import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MockRealtimeProvider } from "@/lib/mockRealtime";

import { PortfolioMini } from "./PortfolioMini";

describe("PortfolioMini", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("renders Cash/Portfolio value/PnL from Kalshi balance response", async () => {
    const fetchSpy = vi.fn(async () => {
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

