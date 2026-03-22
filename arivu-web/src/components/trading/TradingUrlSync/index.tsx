"use client";

/**
 * Headless component: only runs `useTradingUrlSync`. Renders `null` on purpose so we
 * can place it directly under `NuqsAdapter` without an extra DOM node or flex child.
 *
 * Mount point matters: if this lived *below* the sidebar, the sidebar’s effects could
 * run first and pick defaults before the URL seeded `activeMarketTickerAtom`.
 */
import { useTradingUrlSync } from "./hooks/useTradingUrlSync";

export const TradingUrlSync = () => {
  useTradingUrlSync();
  return null;
};
