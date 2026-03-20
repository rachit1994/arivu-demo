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

const getSubtleCrypto = (): SubtleCrypto => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available");
  }
  return subtle;
};

const pemPkcs8ToArrayBuffer = (pem: string): ArrayBuffer => {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = globalThis.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const importRsaPssPrivateKey = async (privateKeyPem: string): Promise<CryptoKey> => {
  if (keyCache?.pem === privateKeyPem) return keyCache.key;
  const subtle = getSubtleCrypto();
  const key = await subtle.importKey(
    "pkcs8",
    pemPkcs8ToArrayBuffer(privateKeyPem),
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
