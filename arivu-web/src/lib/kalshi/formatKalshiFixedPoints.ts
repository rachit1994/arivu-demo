export const parseKalshiFixedPointNumber = (raw: string | null | undefined): number => {
  if (raw === null || raw === undefined) return 0;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return 0;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return 0;
  return n;
};

export const formatKalshiDollarsUsd = (
  raw: string | null | undefined,
): string => {
  const dollars = parseKalshiFixedPointNumber(raw);
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatKalshiFixedPointCount = (
  raw: string | null | undefined,
): string => {
  const count = parseKalshiFixedPointNumber(raw);
  return count.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatIsoDateShort = (raw: string | null | undefined): string => {
  if (!raw) return "—";
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "—";
  // Deterministic-ish: take first part (YYYY-MM-DD) if ISO-like.
  const idx = trimmed.indexOf("T");
  if (idx > 0) return trimmed.slice(0, idx);
  return trimmed;
};

