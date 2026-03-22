/**
 * Kalshi returns many numeric fields as **decimal strings** (fixed-point). These helpers
 * parse/format defensively so malformed API data becomes **0** or **"—"** instead of NaN UI.
 *
 * `parseKalshiFixedPointNumber` is the single gate: null/undefined/empty/non-finite → 0.
 * Formatters add locale grouping for display only.
 */

export const parseKalshiFixedPointNumber = (raw: string | null | undefined): number => {
  if (raw === null || raw === undefined) return 0;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return 0;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return 0;
  return n;
};

/** Two-decimal USD string for probability dollars (0–1) or similar small money fields. */
export const formatKalshiDollarsUsd = (
  raw: string | null | undefined,
): string => {
  const dollars = parseKalshiFixedPointNumber(raw);
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Count-like fixed-point with 2 decimals (contracts / size — product choice, not always integer). */
export const formatKalshiFixedPointCount = (
  raw: string | null | undefined,
): string => {
  const count = parseKalshiFixedPointNumber(raw);
  return count.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/** Strips time portion for compact table cells; returns em dash when missing. */
export const formatIsoDateShort = (raw: string | null | undefined): string => {
  if (!raw) return "—";
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "—";
  // Deterministic-ish: take first part (YYYY-MM-DD) if ISO-like.
  const idx = trimmed.indexOf("T");
  if (idx > 0) return trimmed.slice(0, idx);
  return trimmed;
};

