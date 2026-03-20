import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import Home from "./page";

describe("HomePageTradingLayout", () => {
  beforeEach(() => {
    globalThis.history.replaceState({}, "", "/");
  });

  describe("Positive cases", () => {
    test("renders trading shell with sidebar, panels, and portfolio", () => {
      render(<Home />);

      expect(screen.getByTestId("left-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("topic-list")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-mini")).toBeInTheDocument();

      expect(screen.getByTestId("trade-topbar")).toBeInTheDocument();
      expect(screen.getByTestId("market-subheader")).toBeInTheDocument();

      expect(screen.getByTestId("chart-panel")).toBeInTheDocument();
      expect(screen.getByTestId("orderbook-panel")).toBeInTheDocument();
      expect(screen.getByTestId("order-ticket-panel")).toBeInTheDocument();

      expect(screen.getByTestId("trade-submit")).toBeInTheDocument();
      expect(screen.getByTestId("bottom-tabs")).toBeInTheDocument();
    });

    test("bottom tabs switch visible content", () => {
      render(<Home />);

      const openPositionsTabs = screen.getAllByTestId("tab-open-positions");
      const openPositionsTab = openPositionsTabs[0];

      const ordersTabs = screen.getAllByTestId("tab-orders");
      const ordersTab = ordersTabs[0];

      const tradesTabs = screen.getAllByTestId("tab-trades");
      const tradesTab = tradesTabs[0];

      expect(openPositionsTab.getAttribute("aria-selected")).toBe("true");
      expect(
        screen.getAllByTestId("tab-content-open-positions")[0],
      ).toBeInTheDocument();

      fireEvent.click(ordersTab);
      expect(ordersTab.getAttribute("aria-selected")).toBe("true");
      expect(screen.getAllByTestId("tab-content-orders")[0]).toBeInTheDocument();

      fireEvent.click(tradesTab);
      expect(tradesTab.getAttribute("aria-selected")).toBe("true");
      expect(screen.getAllByTestId("tab-content-trades")[0]).toBeInTheDocument();
    });

    test("order ticket reacts to user input from the home page", () => {
      render(<Home />);

      const priceInputs = screen.getAllByTestId("ticket-price");
      const quantityInputs = screen.getAllByTestId("ticket-quantity");

      const price = priceInputs[0];
      const quantity = quantityInputs[0];

      fireEvent.change(price, { target: { value: "2" } });
      fireEvent.change(quantity, { target: { value: "5" } });

      expect(screen.getByText("$10.00")).toBeInTheDocument();
    });

    test("order book click sets ticket price", async () => {
      globalThis.history.replaceState({}, "", "/?outcome=NO");
      const { container } = render(<Home />);

      const getFirstRow = (): HTMLElement | null => {
        const bidRows = Array.from(
          container.querySelectorAll('[data-testid^="orderbook-row-bids-"]'),
        );
        const askRows = Array.from(
          container.querySelectorAll('[data-testid^="orderbook-row-asks-"]'),
        );

        const firstBid = bidRows[0];
        if (firstBid instanceof HTMLElement) return firstBid;

        const firstAsk = askRows[0];
        if (firstAsk instanceof HTMLElement) return firstAsk;

        return null;
      };

      await waitFor(() => {
        expect(getFirstRow()).toBeTruthy();
      });
      const firstRow = getFirstRow();
      if (!firstRow) return;

      const rowTestId = firstRow.dataset.testid ?? "";
      const expectsBuy = rowTestId.includes("bids");

      const priceEl = firstRow.querySelector(
        '[data-testid^="orderbook-row-price-"]',
      );
      expect(priceEl).toBeTruthy();
      const expectedPrice = priceEl?.textContent?.trim() ?? "";
      fireEvent.click(firstRow);

      await waitFor(() => {
        const priceInputEl = container.querySelector(
          '[data-testid="ticket-price"]',
        );
        if (!priceInputEl) throw new TypeError("ticket-price input missing");
        if (!(priceInputEl instanceof HTMLInputElement)) {
          throw new TypeError("ticket-price input has unexpected element type");
        }

        expect(priceInputEl.value).toBe(expectedPrice);

        const yesBtn = screen.getAllByTestId("ticket-outcome-yes")[0];
        const noBtn = screen.getAllByTestId("ticket-outcome-no")[0];
        expect(yesBtn.getAttribute("aria-pressed")).toBe("true");
        expect(noBtn.getAttribute("aria-pressed")).toBe("false");

        const buyBtn = screen.getAllByTestId("ticket-side-buy")[0];
        const sellBtn = screen.getAllByTestId("ticket-side-sell")[0];
        if (expectsBuy) {
          expect(buyBtn.getAttribute("aria-pressed")).toBe("true");
          expect(sellBtn.getAttribute("aria-pressed")).toBe("false");
        } else {
          expect(sellBtn.getAttribute("aria-pressed")).toBe("true");
          expect(buyBtn.getAttribute("aria-pressed")).toBe("false");
        }

        expect(globalThis.location.search).not.toContain("outcome=NO");
      });
    });

    test("kalshi order book click sets ticket in kalshi mode", async () => {
      globalThis.history.replaceState(
        {},
        "",
        "/?market=ev_1&outcome=NO&timeframe=1D&subaccount=0",
      );

      const originalFetch = globalThis.fetch;
      const fetchSpy = vi.fn(async (input: RequestInfo) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.includes("/api/kalshi/markets/ev_1/orderbook")) {
          return new Response(
            JSON.stringify({
              orderbook_fp: {
                yes_dollars: [
                  ["0.60", "200000"],
                  ["0.59", "150000"],
                ],
                no_dollars: [
                  ["0.40", "180000"],
                  ["0.39", "120000"],
                ],
              },
            }),
            { status: 200 },
          );
        }

        return new Response(JSON.stringify({ error: "Kalshi not configured" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      });

      vi.stubGlobal("fetch", fetchSpy);

      try {
        const { container } = render(<Home />);

        const getFirstBidRow = (): HTMLElement | null => {
          const bidRows = Array.from(
            container.querySelectorAll(
              '[data-testid^="orderbook-row-bids-"]',
            ),
          );
          const firstBid = bidRows[0];
          if (firstBid instanceof HTMLElement) return firstBid;
          return null;
        };

        const getFirstAskRow = (): HTMLElement | null => {
          const askRows = Array.from(
            container.querySelectorAll(
              '[data-testid^="orderbook-row-asks-"]',
            ),
          );
          const firstAsk = askRows[0];
          if (firstAsk instanceof HTMLElement) return firstAsk;
          return null;
        };

        const expectedPrice = "0.60";
        await waitFor(() => {
          const row = getFirstBidRow();
          expect(row).toBeTruthy();

          const priceEl = row?.querySelector(
            '[data-testid^="orderbook-row-price-"]',
          );
          expect(priceEl).toBeTruthy();
          expect(priceEl?.textContent?.trim()).toBe(expectedPrice);
        });

        const firstRow = getFirstBidRow();
        expect(firstRow).toBeTruthy();
        if (!firstRow) return;

        fireEvent.click(firstRow);

        await waitFor(() => {
          const priceInputEl = container.querySelector(
            '[data-testid="ticket-price"]',
          );
          if (!priceInputEl)
            throw new TypeError("ticket-price input missing");
          if (!(priceInputEl instanceof HTMLInputElement)) {
            throw new TypeError(
              "ticket-price input has unexpected element type",
            );
          }

          expect(priceInputEl.value).toBe(expectedPrice);

          const yesBtn = screen.getAllByTestId("ticket-outcome-yes")[0];
          const noBtn = screen.getAllByTestId("ticket-outcome-no")[0];
          expect(yesBtn.getAttribute("aria-pressed")).toBe("true");
          expect(noBtn.getAttribute("aria-pressed")).toBe("false");

          const buyBtn = screen.getAllByTestId("ticket-side-buy")[0];
          const sellBtn = screen.getAllByTestId("ticket-side-sell")[0];
          expect(buyBtn.getAttribute("aria-pressed")).toBe("true");
          expect(sellBtn.getAttribute("aria-pressed")).toBe("false");

          expect(globalThis.location.search).not.toContain("outcome=NO");
        });

        const firstAskRow = getFirstAskRow();
        expect(firstAskRow).toBeTruthy();
        if (!firstAskRow) return;

        const askPriceEl = firstAskRow.querySelector(
          '[data-testid^="orderbook-row-price-"]',
        );
        expect(askPriceEl).toBeTruthy();
        const expectedAskPrice = askPriceEl?.textContent?.trim() ?? "";

        fireEvent.click(firstAskRow);

        await waitFor(() => {
          const priceInputEl = container.querySelector(
            '[data-testid="ticket-price"]',
          );
          if (!priceInputEl)
            throw new TypeError("ticket-price input missing");
          if (!(priceInputEl instanceof HTMLInputElement)) {
            throw new TypeError(
              "ticket-price input has unexpected element type",
            );
          }

          expect(priceInputEl.value).toBe(expectedAskPrice);

          const yesBtn = screen.getAllByTestId("ticket-outcome-yes")[0];
          const noBtn = screen.getAllByTestId("ticket-outcome-no")[0];
          expect(yesBtn.getAttribute("aria-pressed")).toBe("true");
          expect(noBtn.getAttribute("aria-pressed")).toBe("false");

          const buyBtn = screen.getAllByTestId("ticket-side-buy")[0];
          const sellBtn = screen.getAllByTestId("ticket-side-sell")[0];
          expect(buyBtn.getAttribute("aria-pressed")).toBe("false");
          expect(sellBtn.getAttribute("aria-pressed")).toBe("true");

          expect(globalThis.location.search).not.toContain("outcome=NO");
        });
      } finally {
        if (originalFetch) globalThis.fetch = originalFetch;
      }
    });

    test(
      "url seeds timeframe and subaccount UI",
      async () => {
      globalThis.history.replaceState(
        {},
        "",
        "/?timeframe=1W&subaccount=2",
      );

      render(<Home />);

      await waitFor(
        () => {
        const timeframeEl = screen.getAllByTestId("timeframe-value")[0];
        expect(timeframeEl).toHaveTextContent("1W");

        const subaccountEl = screen.getAllByTestId("subaccount-value")[0];
        expect(subaccountEl).toHaveTextContent("2");
        },
        { timeout: 15000 },
      );
      },
      20000,
    );

    test("timeframe button updates URL", async () => {
      globalThis.history.replaceState({}, "", "/?timeframe=1D&subaccount=0");

      render(<Home />);

      const btns = screen.getAllByTestId("timeframe-btn-1M");
      fireEvent.click(btns[0]);

      await waitFor(() => {
        expect(globalThis.location.search).toContain("timeframe=1M");
        const timeframeEl = screen.getAllByTestId("timeframe-value")[0];
        expect(timeframeEl).toHaveTextContent("1M");
      });
    });
  });

  describe("Negative cases", () => {
    test(
      "kalshi orderbook 503 falls back to mock and flips outcome on click",
      async () => {
      globalThis.history.replaceState(
        {},
        "",
        "/?market=ev_1&outcome=NO&timeframe=1D&subaccount=0",
      );

      const originalFetch = globalThis.fetch;
      const fetchSpy = vi.fn(async () => {
        return new Response(JSON.stringify({ error: "Kalshi not configured" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      });
      vi.stubGlobal("fetch", fetchSpy);

      try {
        const { container } = render(<Home />);

        const getFirstRow = (): HTMLElement | null => {
          const bidRows = Array.from(
            container.querySelectorAll(
              '[data-testid^="orderbook-row-bids-"]',
            ),
          );
          const askRows = Array.from(
            container.querySelectorAll(
              '[data-testid^="orderbook-row-asks-"]',
            ),
          );

          const firstBid = bidRows[0];
          if (firstBid instanceof HTMLElement) return firstBid;
          const firstAsk = askRows[0];
          if (firstAsk instanceof HTMLElement) return firstAsk;
          return null;
        };

        await waitFor(
          () => {
          const row = getFirstRow();
          expect(row).toBeTruthy();
          },
          { timeout: 15000 },
        );

        const yesBtn = screen.getAllByTestId("ticket-outcome-yes")[0];
        const noBtn = screen.getAllByTestId("ticket-outcome-no")[0];
        expect(yesBtn.getAttribute("aria-pressed")).toBe("false");
        expect(noBtn.getAttribute("aria-pressed")).toBe("true");

        const firstRow = getFirstRow();
        expect(firstRow).toBeTruthy();
        if (!firstRow) return;

        fireEvent.click(firstRow);

        await waitFor(
          () => {
          const noBtnAfter = screen.getAllByTestId("ticket-outcome-no")[0];
          const yesBtnAfter = screen.getAllByTestId("ticket-outcome-yes")[0];
          expect(yesBtnAfter.getAttribute("aria-pressed")).toBe("true");
          expect(noBtnAfter.getAttribute("aria-pressed")).toBe("false");
          expect(globalThis.location.search).not.toContain("outcome=NO");
          },
          { timeout: 15000 },
        );
      } finally {
        if (originalFetch) globalThis.fetch = originalFetch;
      }
      },
      20000,
    );
  });
});

