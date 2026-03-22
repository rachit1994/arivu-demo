/**
 * Deterministic mock market simulation: builds an initial `MockSnapshot` and evolves it
 * with `computeNextSnapshot` on a timer (`MockRealtimeProvider` mock mode).
 *
 * Design goals:
 * - **Stable per ticker**: `buildInitialSnapshot(marketTicker)` hashes the id so changing
 *   the selected market shifts mid/spread/topic phases without a full app reload.
 * - **Bounded values**: mids and probabilities clamped so charts and copy stay in-range.
 * - **Bounded history**: price array trimmed to last 240 points to cap memory in long sessions.
 *
 * Topics/portfolio strings are decorative — they animate with `tick` for a “live” feel.
 */
import type { MockSnapshot } from "./types";

import { MARKET_QUESTION_DEFS } from "./marketCatalog";

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

const hashStringToUnit = (s: string): number => {
  // FNV-1a-ish hash -> [0, 1)
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.codePointAt(i) ?? 0;
    h = (h * 16777619) >>> 0;
  }
  return (h % 10_000) / 10_000;
};

const fmtUsd = (n: number, frac = 0) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}`;

const fmtQty = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export const buildInitialSnapshot = (
  marketTicker?: string | null,
): MockSnapshot => {
  const seedUnit = marketTicker ? hashStringToUnit(marketTicker) : 0.5;
  const baseMid = clamp(0.62 + (seedUnit - 0.5) * 0.16, 0.08, 0.92);

  return {
    prices: [{ t: Date.now(), v: baseMid }],
    // Five bid-style levels stepping down from mid (mock path; Kalshi uses real REST elsewhere).
    orderbook: [0, 1, 2, 3, 4].map((i) => {
      const px = clamp(baseMid - i * 0.01, 0.02, 0.98);
      const qty = 800 + (i * 97) % 5000;
      return { px: px.toFixed(2), qty: fmtQty(qty) };
    }),
  topics: MARKET_QUESTION_DEFS.map((q, i) => {
    const prob = clamp(0.35 + i * 0.0007, 0.05, 0.95);
    return { id: q.id, category: q.category, question: q.question, price: prob.toFixed(2), coin: ["BTC", "ETH", "USDC", "SOL"][i % 4] ?? "—", chain: ["Ethereum", "Arbitrum", "Polygon", "Optimism"][i % 4] ?? "—", totalVolume: fmtUsd(350000 + i * 997 + Math.round(prob * 50000), 0), apv: `${Math.round(10 + prob * 40)}%`, yesPrice: fmtUsd(prob * 4, 2), noPrice: fmtUsd((1 - prob) * 4, 2) };
  }),
  portfolio: [
    { label: "Cash", value: "$1,240" },
    { label: "Open", value: "3" },
    { label: "PnL", value: "+$12.50" },
  ],
  spread: "0.010",
  updatedAtMs: Date.now(),
  tick: 0,
  };
};

export const computeNextSnapshot = (prev: MockSnapshot): MockSnapshot => {
  const tick = prev.tick + 1;
  const phase = tick * 0.12;
  const prevMid = prev.prices.at(-1)?.v ?? 0.62;
  const mid = clamp(
    prevMid + Math.sin(phase) * 0.12 + Math.sin(phase * 2.7) * 0.02,
    0.08,
    0.92,
  );
  const nextPrice: MockSnapshot["prices"][0] = { t: Date.now(), v: mid };
  // Cap history so a long-lived tab does not grow `prices` without bound (~chart window).
  const prices = [...prev.prices, nextPrice].slice(-240);
  const orderbook = [0, 1, 2, 3, 4].map((i) => {
    const px = mid - i * 0.01;
    const qty = 800 + ((tick + i * 97) % 5000);
    return { px: px.toFixed(2), qty: fmtQty(qty) };
  });
  const spread = (0.008 + (Math.sin(phase * 3) + 1) * 0.006).toFixed(3);
  // Wiggle each row’s implied prob slightly out of sync for a busier sidebar (still mock).
  const topics = MARKET_QUESTION_DEFS.map((q, i) => {
    const base = mid + Math.sin(phase + i * 0.13) * 0.06;
    const prob = clamp(base, 0.05, 0.95);
    return { id: q.id, category: q.category, question: q.question, price: prob.toFixed(2), coin: ["BTC", "ETH", "USDC", "SOL"][i % 4] ?? "—", chain: ["Ethereum", "Arbitrum", "Polygon", "Optimism"][i % 4] ?? "—", totalVolume: fmtUsd(250000 + i * 997 + Math.round(prob * 200000), 0), apv: `${Math.round(10 + prob * 40)}%`, yesPrice: fmtUsd(prob * 4, 2), noPrice: fmtUsd((1 - prob) * 4, 2) };
  });
  const cash = 1240 + Math.sin(phase * 0.5) * 40;
  const pnl = 12.5 + Math.sin(phase * 1.3) * 8;
  const openN = 2 + (tick % 4);
  const portfolio: MockSnapshot["portfolio"] = [
    { label: "Cash", value: fmtUsd(cash) },
    { label: "Open", value: String(openN) },
    {
      label: "PnL",
      value: `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
    },
  ];
  return {
    prices,
    orderbook,
    topics,
    portfolio,
    spread,
    updatedAtMs: Date.now(),
    tick,
  };
};
