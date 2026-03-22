/**
 * Kalshi Trade API **RSA-PSS** request signing for browser `fetch`.
 *
 * - Message format: `${timestampMs}${METHOD}${pathWithoutQuery}` (query string excluded
 *   from the signed path segment per Kalshi’s signing rules — see `signKalshiRequest`).
 * - Private key: PKCS#8 PEM → `importKey` → `sign` with salt length 32 (SHA-256 digest).
 * - `kalshiAuthedFetch` composes headers and handles timeout + outer `AbortSignal` fan-out.
 *
 * Caching: `importRsaPssPrivateKey` memoizes `CryptoKey` by PEM string to avoid re-import
 * on every poll (expensive on low-end devices).
 */

export interface SignKalshiRequestArgs {
  privateKeyPem: string;
  timestampMs: string;
  method: string;
  pathWithQuery: string;
}

const validateMethod = (method: string): string => {
  const m = method.toUpperCase();
  switch (m) {
    case "GET":
    case "POST":
    case "PUT":
    case "PATCH":
    case "DELETE":
      return m;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};

const validatePath = (pathWithQuery: string): string => {
  if (!pathWithQuery.startsWith("/")) {
    throw new Error("pathWithQuery must start with '/'");
  }
  return pathWithQuery;
};

let keyCache: { pem: string; key: CryptoKey } | null = null;

/** Test-only: clear cached CryptoKey when switching PEMs between cases. */
export const resetKalshiPrivateKeyImportCache = (): void => {
  keyCache = null;
};

let subtleCryptoOverride: SubtleCrypto | null = null;

/**
 * Test-only (Vitest + jsdom): inject `node:crypto` webcrypto.subtle so importKey
 * accepts PKCS8 DER (jsdom's SubtleCrypto often rejects it).
 */
export const __setKalshiSubtleCryptoOverride = (subtle: SubtleCrypto | null): void => {
  subtleCryptoOverride = subtle;
};

const getSubtleCrypto = (): SubtleCrypto => {
  if (subtleCryptoOverride) return subtleCryptoOverride;
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available");
  }
  return subtle;
};

const pemPkcs8ToPkcs8DerBuffer = (pem: string): ArrayBuffer => {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = globalThis.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  // Slice to a standalone ArrayBuffer (exact DER length). Avoids passing a view of a
  // larger backing buffer; matches BufferSource typing and SubtleCrypto in jsdom/CI.
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

const importRsaPssPrivateKey = async (privateKeyPem: string): Promise<CryptoKey> => {
  if (keyCache?.pem === privateKeyPem) return keyCache.key;
  const subtle = getSubtleCrypto();
  const key = await subtle.importKey(
    "pkcs8",
    pemPkcs8ToPkcs8DerBuffer(privateKeyPem),
    { name: "RSA-PSS", hash: "SHA-256" },
    false,
    ["sign"],
  );
  keyCache = { pem: privateKeyPem, key };
  return key;
};

const arrayBufferToBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return globalThis.btoa(binary);
};

/** RSA-PSS SHA-256; salt length 32 bytes (digest length), matching Node RSA_PSS_SALTLEN_DIGEST. */
export const signKalshiRequest = async ({
  privateKeyPem,
  timestampMs,
  method,
  pathWithQuery,
}: SignKalshiRequestArgs): Promise<string> => {
  const m = validateMethod(method);
  const p = validatePath(pathWithQuery);
  const signPath = p.split("?")[0]!;
  const message = `${timestampMs}${m}${signPath}`;
  const enc = new TextEncoder().encode(message);
  const key = await importRsaPssPrivateKey(privateKeyPem);
  const subtle = getSubtleCrypto();
  const signatureBytes = await subtle.sign(
    { name: "RSA-PSS", saltLength: 32 },
    key,
    enc,
  );
  return arrayBufferToBase64(signatureBytes);
};

export interface KalshiAuthedFetchArgs {
  baseUrl: string;
  accessKeyId: string;
  privateKeyPem: string;
  timestampMs: string;
  method: string;
  path: string;
  timeoutMs: number;
  json: boolean;
  signal?: AbortSignal;
}

export const kalshiAuthedFetch = async ({
  baseUrl,
  accessKeyId,
  privateKeyPem,
  timestampMs,
  method,
  path,
  timeoutMs,
  json,
  signal: outerSignal,
}: KalshiAuthedFetchArgs): Promise<unknown> => {
  const m = validateMethod(method);
  const p = validatePath(path);

  const signatureB64 = await signKalshiRequest({
    privateKeyPem,
    timestampMs,
    method: m,
    pathWithQuery: p,
  });

  const url = `${baseUrl}${p}`;

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  const onOuterAbort = (): void => {
    controller.abort();
  };

  /*
   * Bridge caller’s AbortSignal (e.g. React effect cleanup) with internal timeout abort.
   * Both paths must clear listeners in `finally` to avoid leaks on long-lived pages.
   */
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort();
    else outerSignal.addEventListener("abort", onOuterAbort, { once: true });
  }

  try {
    const res = await fetch(url, {
      method: m,
      headers: {
        "KALSHI-ACCESS-KEY": accessKeyId,
        "KALSHI-ACCESS-TIMESTAMP": timestampMs,
        "KALSHI-ACCESS-SIGNATURE": signatureB64,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    } satisfies RequestInit);

    if (!res.ok) {
      throw new Error(`Kalshi request failed with status ${res.status}`);
    }

    if (json) return res.json();
    return res.text();
  } finally {
    globalThis.clearTimeout(timeoutId);
    if (outerSignal) {
      outerSignal.removeEventListener("abort", onOuterAbort);
    }
  }
};
