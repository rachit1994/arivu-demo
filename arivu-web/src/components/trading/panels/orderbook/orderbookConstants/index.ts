/**
 * Shared tuning for `OrderBookPanel` + toolbar. Row count drives slice + padding height.
 */
export const ORDERBOOK_VISIBLE_ROWS = 14;

/** Kalshi `orderbook?depth=` request param; hook clamps to a safe 1–100 range. */
export const ORDERBOOK_FETCH_DEPTH = 50;

/**
 * Poll interval for `useKalshiMarketOrderbook` (ms). The hook skips ticks when the
 * document is hidden (`visibilityState`) — this value only applies to visible tabs.
 */
export const ORDERBOOK_POLL_MS = 250;

/** Toolbar tick-size presets; must stay finite and >0 for aggregation buckets. */
export const ORDERBOOK_PRECISION_OPTIONS = [0.01, 0.005, 0.001, 0.0001] as const;

export type OrderbookPrecisionStep =
  (typeof ORDERBOOK_PRECISION_OPTIONS)[number];

/** Combined stack vs single-sided views for narrow layouts / user preference. */
export type OrderbookLayoutMode = "combined" | "bids" | "asks";
