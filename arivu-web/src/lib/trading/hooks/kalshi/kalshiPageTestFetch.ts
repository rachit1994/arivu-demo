import { isKalshiOrderbookUrl, resolveFetchUrl } from "./kalshiTestKeys";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Default Kalshi demo API responses for Home page tests (sidebar, chart, portfolio).
 * Override orderbook by wrapping and returning a different Response for that URL.
 */
export const createKalshiDemoFetchHandler = (): ((
  input: RequestInfo | URL,
) => Promise<Response>) => {
  return async (input: RequestInfo | URL) => {
    const url = resolveFetchUrl(input);
    if (!url.includes("demo-api.kalshi.co")) {
      return json({}, 404);
    }
    if (isKalshiOrderbookUrl(url)) {
      return json(
        {
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
        },
        200,
      );
    }
    if (url.includes("/markets?")) {
      return json({ markets: [], cursor: null }, 200);
    }
    if (
      url.includes("/trade-api/v2/markets/ev_1") &&
      !url.includes("orderbook")
    ) {
      return json({ market: { series_ticker: "ser_1" } }, 200);
    }
    if (url.includes("/candlesticks")) {
      return json({ ticker: "ev_1", candlesticks: [] }, 200);
    }
    if (url.includes("/portfolio/balance")) {
      return json(
        { balance: 0, portfolio_value: 0, updated_ts: 0 },
        200,
      );
    }
    if (url.includes("/portfolio/positions")) {
      return json(
        { market_positions: [], event_positions: [], cursor: null },
        200,
      );
    }
    if (url.includes("/portfolio/orders")) {
      return json({ orders: [], cursor: null }, 200);
    }
    if (url.includes("/portfolio/fills")) {
      return json({ fills: [], cursor: null }, 200);
    }
    return json({}, 404);
  };
};
