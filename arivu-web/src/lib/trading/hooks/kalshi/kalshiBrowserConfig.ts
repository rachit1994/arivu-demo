/**
 * Kalshi credentials for browser/static builds. NEXT_PUBLIC_* is embedded in the
 * client bundle. For GitHub Pages, we intentionally do not inject Kalshi private
 * keys via the workflow because it would make them public in the shipped JS.
 *
 * Result: without explicitly providing NEXT_PUBLIC_KALSHI_* in your build
 * environment, the app stays in mock mode.
 */
export interface KalshiBrowserConfig {
  accessKeyId: string;
  privateKeyPem: string;
  baseUrl: string;
}

const normalizePem = (raw: string): string =>
  raw.trim().replace(/\\n/g, "\n");

export const getKalshiBrowserConfig = (): KalshiBrowserConfig | null => {
  const accessKeyId = process.env.NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID?.trim();
  const privateKeyPemRaw = process.env.NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM?.trim();
  const baseUrl =
    process.env.NEXT_PUBLIC_KALSHI_BASE_URL?.trim() ??
    "https://demo-api.kalshi.co/trade-api/v2";

  if (!accessKeyId || !privateKeyPemRaw) return null;

  const privateKeyPem = normalizePem(privateKeyPemRaw);
  if (privateKeyPem.length === 0) return null;

  return { accessKeyId, privateKeyPem, baseUrl };
};
