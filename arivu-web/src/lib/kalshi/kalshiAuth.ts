import crypto from "node:crypto";

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

export const signKalshiRequest = ({
  privateKeyPem,
  timestampMs,
  method,
  pathWithQuery,
}: SignKalshiRequestArgs): string => {
  const m = validateMethod(method);
  const p = validatePath(pathWithQuery);
  const signPath = p.split("?")[0]!;
  const message = `${timestampMs}${m}${signPath}`;

  const signatureBytes = crypto.sign("sha256", Buffer.from(message, "utf8"), {
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return Buffer.from(signatureBytes).toString("base64");
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
}: KalshiAuthedFetchArgs): Promise<unknown> => {
  const m = validateMethod(method);
  const p = validatePath(path);

  const signatureB64 = signKalshiRequest({
    privateKeyPem,
    timestampMs,
    method: m,
    pathWithQuery: p,
  });

  const url = `${baseUrl}${p}`;

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

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
  }
};

