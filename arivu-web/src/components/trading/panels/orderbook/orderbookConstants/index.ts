export const ORDERBOOK_VISIBLE_ROWS = 14;

export const ORDERBOOK_FETCH_DEPTH = 50;

/** REST polling while Kalshi is configured; pauses when the tab is hidden. */
export const ORDERBOOK_POLL_MS = 250;

export const ORDERBOOK_PRECISION_OPTIONS = [0.01, 0.005, 0.001, 0.0001] as const;

export type OrderbookPrecisionStep =
  (typeof ORDERBOOK_PRECISION_OPTIONS)[number];

export type OrderbookLayoutMode = "combined" | "bids" | "asks";
