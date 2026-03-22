/*
 * Trading hooks barrel — import from `@/lib/trading/hooks` in UI code so feature
 * folders do not reach into `kalshi.ts` internals directly (easier refactors/tests).
 */
// Kalshi API + browser config helpers (fetch, signing, demo handlers for tests).
export * from "./kalshi";
/*
 * Shared “select this market” behavior for TopicList + PinnedMarketsStrip. Keeps ticket
 * atoms and headline question in sync; do not duplicate this logic in components.
 */
export {
  useTradingMarketSelection,
  type MarketSelectionMeta,
} from "./useTradingMarketSelection";
