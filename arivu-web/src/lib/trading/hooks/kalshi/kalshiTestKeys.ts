import { webcrypto } from "node:crypto";

let cachedPkcs8Pem: string | null = null;

/** RSA PKCS#8 PEM for tests (Web Crypto import); reused across tests. */
export const getTestKalshiPrivateKeyPem = async (): Promise<string> => {
  if (cachedPkcs8Pem) return cachedPkcs8Pem;

  const pair = await webcrypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );

  const pkcs8 = await webcrypto.subtle.exportKey("pkcs8", pair.privateKey);
  const b64 = Buffer.from(pkcs8).toString("base64");
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  cachedPkcs8Pem = `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
  return cachedPkcs8Pem;
};

export const kalshiDemoBaseUrl = "https://demo-api.kalshi.co/trade-api/v2";

export const isKalshiOrderbookUrl = (raw: string): boolean =>
  raw.includes("demo-api.kalshi.co") && raw.includes("/markets/ev_1/orderbook");

export const resolveFetchUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};
