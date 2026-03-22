/**
 * Demo / fallback realtime: synthetic tick stream + optional Kalshi-backed snapshot
 * polling. Chart and sidebar import from here; do not import `MockRealtimeProvider`
 * internals directly unless extending the provider.
 */
export { MockRealtimeProvider, useMockRealtime } from "./MockRealtimeProvider";
export { buildInitialSnapshot, computeNextSnapshot } from "./computeTick";
export type {
  BookLevel,
  MockSnapshot,
  PortfolioCell,
  PricePoint,
  TopicQuote,
} from "./types";
