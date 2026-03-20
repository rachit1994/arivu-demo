/** Parse display strings like "$0.28" or "0.28" to a finite number, or null. */
export const parsePriceLikeToNumber = (raw: string): number | null => {
  const cleaned = raw.replaceAll(/[^\d.-]/g, "");
  if (cleaned.length === 0) return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
};

/** Yes share of (yes + no) in 0–100 for bid-implied split; 50 if unknown. */
export const computeYesBidSharePercent = (
  yesPrice: string,
  noPrice: string,
): { yesPct: number; noPct: number } => {
  const y = parsePriceLikeToNumber(yesPrice);
  const n = parsePriceLikeToNumber(noPrice);
  if (y === null || n === null) {
    return { yesPct: 50, noPct: 50 };
  }
  const total = y + n;
  if (total <= 0) {
    return { yesPct: 50, noPct: 50 };
  }
  const yesPct = Math.round((y / total) * 1000) / 10;
  const noPct = Math.round((n / total) * 1000) / 10;
  return { yesPct, noPct };
};
