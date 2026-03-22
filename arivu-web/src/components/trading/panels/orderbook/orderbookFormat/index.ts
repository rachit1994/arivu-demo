/**
 * Small pure helpers shared by order book UI (`OrderbookDepthRow`, middle strip).
 * Kept dependency-free so tests can import without mounting React.
 */

/** Non-finite inputs snap to `lo` so bad padded sentinels do not produce NaN CSS widths. */
export const clamp = (n: number, lo: number, hi: number): number => {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
};

/** Two decimal places — matches mock + Kalshi dollar-style probabilities in the book. */
export const fmtOrderbookPrice = (px: number): string => {
  if (!Number.isFinite(px)) return "—";
  return px.toFixed(2);
};

/** Integer-ish size display; 0 for NaN so disabled rows do not show “NaN”. */
export const fmtOrderbookQty = (n: number): string => {
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
