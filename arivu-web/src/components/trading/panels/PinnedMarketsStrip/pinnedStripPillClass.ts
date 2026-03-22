/**
 * Maps catalog category → Tailwind pill colors (mirrors TopicRow for visual consistency).
 * Exhaustive switch: if `MarketCategory` grows, TypeScript forces a new case here.
 */
import type { PinnedMarketSnapshot } from "@/lib/trading/state/pinnedMarketsJotaiAtoms";

export const pinnedStripCategoryPillClass = (
  c: PinnedMarketSnapshot["category"],
): string => {
  switch (c) {
    case "Elections":
      // Purple family — distinct from Sports amber on adjacent cards.
      return "border-violet-500/30 bg-violet-500/10 text-violet-200";
    case "Sports":
      // Warm amber — reads as “live / arena” without clashing with Elections violet.
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "Tech":
      // Cool cyan — distinct from Economy’s green-ish lime.
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
    case "Economy":
      // Lime for macro / “growth” connotation; keep contrast on dark bg.
      return "border-lime-500/30 bg-lime-500/10 text-lime-200";
    case "Culture":
      // Pink for softer non-financial topics; still legible at 9px uppercase.
      return "border-pink-500/30 bg-pink-500/10 text-pink-200";
    default: {
      // Compile-time proof every enum member is handled above.
      const _exhaustive: never = c;
      return _exhaustive;
    }
  }
};
