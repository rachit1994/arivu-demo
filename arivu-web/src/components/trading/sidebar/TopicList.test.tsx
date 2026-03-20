import {
  fireEvent,
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Provider, useAtom } from "jotai";

import { MockRealtimeProvider } from "@/lib/mockRealtime";
import {
  activeMarketQuestionAtom,
  activeMarketTickerAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";
import {
  ticketPickedOutcomeAtom,
  ticketPickedPriceAtom,
  ticketPickedSideAtom,
} from "@/lib/trading/state/ticketSelectionJotaiAtoms";

import { TopicList } from "./TopicList";

describe("TopicList", () => {
  const Harness = () => (
    <div data-testid="topic-scroll" style={{ height: 420, overflow: "auto" }}>
      <TopicList />
    </div>
  );

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("renders a list of topic rows", async () => {
    const fetchSpy = vi.fn(async () => {
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
            {
              ticker: "ev_2",
              market_type: "binary",
              title: "NBA matchup",
              subtitle: "",
              yes_sub_title: "Will Team A win?",
              no_sub_title: "Will Team B win?",
              last_price_dollars: "0.12",
              yes_bid_dollars: "0.11",
              yes_ask_dollars: "0.13",
              volume: 123456,
            },
          ],
          cursor: "cursor_1",
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    render(
      <MockRealtimeProvider enabled={false}>
        <Harness />
      </MockRealtimeProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("market-question-row").length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    await waitFor(() => {
      const senatorQuestionMatches =
        screen.getAllByText("Will the senator win?");
      expect(senatorQuestionMatches.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const anyRowWithSenatorQuestion = screen
      .getAllByTestId("market-question-row")
      .some((r) => r.textContent?.includes("Will the senator win?"));

    expect(anyRowWithSenatorQuestion).toBe(true);
  });

  test("filters by category", async () => {
    const fetchSpy = vi.fn(async () => {
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
            {
              ticker: "ev_2",
              market_type: "binary",
              title: "NBA matchup",
              subtitle: "",
              yes_sub_title: "Will Team A win?",
              no_sub_title: "Will Team B win?",
              last_price_dollars: "0.12",
              yes_bid_dollars: "0.11",
              yes_ask_dollars: "0.13",
              volume: 123456,
            },
          ],
          cursor: "cursor_1",
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    render(
      <MockRealtimeProvider enabled={false}>
        <Harness />
      </MockRealtimeProvider>,
    );

    const sportsButtons = screen.getAllByTestId("category-button-Sports");
    if (!sportsButtons[0]) throw new Error("Missing Sports filter button");
    fireEvent.click(sportsButtons[0]);
    const scroller = screen.getAllByTestId("topic-scroll")[0] as HTMLDivElement;
    scroller.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      const rows = screen.getAllByTestId("market-question-row");
      expect(rows.length).toBeGreaterThan(0);
      for (const r of rows) {
        expect(r.textContent).toContain("Sports");
      }
    }, { timeout: 3000 });

    await waitFor(() => {
      const sportsQuestionRows = screen.getAllByText("Will Team A win?");
      expect(sportsQuestionRows.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  test("clicking a topic sets active market + ticket selection", async () => {
    const fetchSpy = vi.fn(async () => {
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

    const AtomsHarness = () => {
      const [activeTicker] = useAtom(activeMarketTickerAtom);
      const [question] = useAtom(activeMarketQuestionAtom);
      const [pickedPrice] = useAtom(ticketPickedPriceAtom);
      const [pickedSide] = useAtom(ticketPickedSideAtom);
      const [pickedOutcome] = useAtom(ticketPickedOutcomeAtom);

      return (
        <div>
          <div data-testid="active-ticker">{activeTicker ?? ""}</div>
          <div data-testid="active-question">{question ?? ""}</div>
          <div data-testid="picked-price">{pickedPrice ?? ""}</div>
          <div data-testid="picked-side">{pickedSide}</div>
          <div data-testid="picked-outcome">{pickedOutcome}</div>
        </div>
      );
    };

    render(
      <Provider>
        <MockRealtimeProvider enabled={false}>
          <Harness />
          <AtomsHarness />
        </MockRealtimeProvider>
      </Provider>,
    );

    await waitFor(
      () => {
        const rows = screen.getAllByTestId("market-question-row");
        expect(rows.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    const rows = screen.getAllByTestId("market-question-row");
    fireEvent.click(rows[0] as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("active-ticker").textContent).toBe("ev_1");
      expect(screen.getByTestId("active-question").textContent).toBe(
        "Will the senator win?",
      );
      expect(screen.getByTestId("picked-side").textContent).toBe("BUY");
      expect(screen.getByTestId("picked-outcome").textContent).toBe("YES");
      expect(screen.getByTestId("picked-price").textContent).toBe("0.55");
    });
  });

  test("adds extra spacing between sidebar cards", async () => {
    const fetchSpy = vi.fn(async () => {
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

    render(
      <MockRealtimeProvider enabled={false}>
        <Harness />
      </MockRealtimeProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("market-question-row").length).toBeGreaterThan(0);
    });

    const cards = screen.getByTestId("topic-list-cards");
    expect(cards.className).toContain("gap-1.5");
  });
});

