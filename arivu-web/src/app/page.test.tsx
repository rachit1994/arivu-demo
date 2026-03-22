/**
 * Integration tests for the home trading page: layout smoke, tabs, ticket math,
 * order-book → ticket wiring, Kalshi vs mock fetch paths, and URL-driven UI.
 *
 * Coupling to watch:
 * - Jotai default store is process-global; `resetTradingJotaiStore` runs in beforeEach.
 * - `src/test/setup.ts` mocks `useSearchParams` from `window.location` — tests that
 *   assert on `?market=` must `history.replaceState` before `render`.
 * - Kalshi tests stub env + fetch; `afterEach` clears env stubs and restores fetch.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getDefaultStore } from "jotai";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { resetKalshiPrivateKeyImportCache } from "@/lib/trading/hooks";
import { createKalshiDemoFetchHandler } from "@/lib/trading/hooks";
import {
  getTestKalshiPrivateKeyPem,
  isKalshiOrderbookUrl,
  kalshiDemoBaseUrl,
  resolveFetchUrl,
} from "@/lib/trading/hooks";
import {
  activeMarketQuestionAtom,
  activeMarketTickerAtom,
  activeSubaccountAtom,
  activeTimeframeAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";
import { pinnedMarketsAtom } from "@/lib/trading/state/pinnedMarketsJotaiAtoms";
import {
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
  ticketPriceSetMarketTickerAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

import Home from "./page";

/**
 * Jotai’s default store is global across tests. Without a reset, one test’s
 * selected market / ticket / pins leak into the next and cause flaky failures.
 *
 * We reset every atom TradingUrlSync / TopicList / ticket touch so each example
 * starts from a known baseline regardless of test order or Vitest’s worker reuse.
 */
const resetTradingJotaiStore = (): void => {
  const store = getDefaultStore();
  // Clears selection — TopicList will default-first-row unless URL sets ?market=.
  store.set(activeMarketTickerAtom, null);
  store.set(activeMarketQuestionAtom, null);
  // Matches nuqs defaults in useTradingUrlSync (avoids stale timeframe in subheader).
  store.set(activeTimeframeAtom, "1D");
  store.set(activeSubaccountAtom, 0);
  // Ticket defaults mirror useTradingMarketSelection after picking a market.
  store.set(ticketPickedOutcomeAtom, "YES");
  store.set(ticketPickedPriceAtom, null);
  store.set(ticketPickedSideAtom, "BUY");
  // Prevents “price belongs to old ticker” logic from crossing tests.
  store.set(ticketPriceSetMarketTickerAtom, null);
  // Starred strip + sidebar pin state must not leak (would show phantom cards).
  store.set(pinnedMarketsAtom, []);
};

describe("HomePageTradingLayout", () => {
  beforeEach(() => {
    // Clean URL + clean atoms — tests that need query strings replaceState after this.
    globalThis.history.replaceState({}, "", "/");
    resetTradingJotaiStore();
  });

  afterEach(() => {
    resetKalshiPrivateKeyImportCache();
    vi.unstubAllEnvs();
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
      // Deep link with NO — click path should flip back to YES + sync URL (see waitFor).
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
      // Full query string: seeds ticker, forces Kalshi book UI, then verifies bid/ask
      // clicks map to buy/sell side and clear stale outcome=NO from the URL.
      globalThis.history.replaceState(
        {},
        "",
        "/?market=ev_1&outcome=NO&timeframe=1D&subaccount=0",
      );

      const pem = await getTestKalshiPrivateKeyPem();
      vi.stubEnv("NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID", "ak_test");
      vi.stubEnv("NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM", pem);
      vi.stubEnv("NEXT_PUBLIC_KALSHI_BASE_URL", kalshiDemoBaseUrl);

      const originalFetch = globalThis.fetch;
      const baseHandler = createKalshiDemoFetchHandler();
      // Spy wraps the demo handler so we could assert call counts; primary goal is
      // deterministic Kalshi JSON without hitting the real network.
      const fetchSpy = vi.fn(async (input: RequestInfo | URL) => baseHandler(input));

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
      // No ?market=: still exercises TradingUrlSync init for secondary params.
      globalThis.history.replaceState(
        {},
        "",
        "/?timeframe=1W&subaccount=2",
      );

      render(<Home />);

      // Long timeout: first paint may wait on async hooks + mock Kalshi in some envs.
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

      const pem = await getTestKalshiPrivateKeyPem();
      vi.stubEnv("NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID", "ak_test");
      vi.stubEnv("NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM", pem);
      vi.stubEnv("NEXT_PUBLIC_KALSHI_BASE_URL", kalshiDemoBaseUrl);

      const originalFetch = globalThis.fetch;
      const baseHandler = createKalshiDemoFetchHandler();
      // Order book 503 → UI falls back to mock rows; ticket should still update on click.
      const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
        const url = resolveFetchUrl(input);
        if (isKalshiOrderbookUrl(url)) {
          return new Response(JSON.stringify({ error: "Kalshi not configured" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
        return baseHandler(input);
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

