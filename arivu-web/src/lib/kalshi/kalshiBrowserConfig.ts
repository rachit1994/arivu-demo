/**
 * Kalshi credentials for browser/static builds. NEXT_PUBLIC_* is embedded in the
 * client bundle — use only demo keys or accept public exposure for GitHub Pages demos.
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
