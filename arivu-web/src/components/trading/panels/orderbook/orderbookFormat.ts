export const clamp = (n: number, lo: number, hi: number): number => {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
};

export const fmtOrderbookPrice = (px: number): string => {
  if (!Number.isFinite(px)) return "—";
  return px.toFixed(2);
};

export const fmtOrderbookQty = (n: number): string => {
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
