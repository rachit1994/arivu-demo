/**
 * Shared shapes for `MockRealtimeProvider` / `computeTick` / Kalshi snapshot mapping.
 * All display strings are pre-formatted so UI components stay dumb.
 */
import { MARKET_CATEGORIES } from "./marketCatalog";

/** Mid price time series (ms epoch, probability 0–1) for chart + last-price fallbacks. */
export interface PricePoint {
  t: number;
  v: number;
}

/** One ladder row in the **mock** orderbook snapshot (string px for legacy mock format). */
export interface BookLevel {
  px: string;
  qty: string;
}

export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

/** One sidebar topic row in mock mode; mirrors Kalshi topic shape closely for UI reuse. */
export interface TopicQuote {
  id: string;
  category: MarketCategory;
  question: string;
  price: string;
  coin: string;
  chain: string;
  totalVolume: string;
  apv: string;
  yesPrice: string;
  noPrice: string;
}

export interface PortfolioCell {
  label: string;
  value: string;
}

/**
 * Full mock realtime snapshot advanced each tick (or replaced in Kalshi poll mode).
 * `tick` monotonic counter drives deterministic phase for sine-based motion.
 */
export interface MockSnapshot {
  prices: PricePoint[];
  orderbook: BookLevel[];
  topics: TopicQuote[];
  portfolio: PortfolioCell[];
  spread: string;
  updatedAtMs: number;
  tick: number;
}
