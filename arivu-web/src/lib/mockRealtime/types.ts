import { MARKET_CATEGORIES } from "./marketCatalog";

export interface PricePoint {
  t: number;
  v: number;
}

export interface BookLevel {
  px: string;
  qty: string;
}

export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

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

export interface MockSnapshot {
  prices: PricePoint[];
  orderbook: BookLevel[];
  topics: TopicQuote[];
  portfolio: PortfolioCell[];
  spread: string;
  updatedAtMs: number;
  tick: number;
}
