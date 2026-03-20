import crypto from "node:crypto";
import { describe, expect, test, vi } from "vitest";

import {
  signKalshiRequest,
  kalshiAuthedFetch,
} from "./kalshiAuth";

describe("Kalshi authenticated request helpers", () => {
  test("signKalshiRequest produces a verifiable RSA-PSS signature (SHA256)", () => {
    const { privateKeyPem, publicKeyPem } = (() => {
      const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
      });

      return {
        privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
        publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
      };
    })();

    const timestampMs = "1703123456789";
    const method = "GET";
    const pathWithQuery = "/trade-api/v2/markets?series_ticker=abc";

    const signatureB64 = signKalshiRequest({
      privateKeyPem,
      timestampMs,
      method,
      pathWithQuery,
    });

    const message = `${timestampMs}${method}${pathWithQuery.split("?")[0]}`;
    const signatureBytes = Buffer.from(signatureB64, "base64");

    const ok = crypto.verify(
      "sha256",
      message,
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      },
      signatureBytes,
    );

    expect(ok).toBe(true);
  });

  test("kalshiAuthedFetch sets Kalshi headers and signs path without query params", async () => {
    const { privateKeyPem, publicKeyPem } = (() => {
      const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
      });

      return {
        privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
        publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
      };
    })();

    const accessKeyId = "ak_123";
    const baseUrl = "https://demo-api.kalshi.co/trade-api/v2";

    const timestampMs = "1703123456789";
    const method = "GET";
    const path = "/markets?series_ticker=abc";

    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.["KALSHI-ACCESS-KEY"]).toBe(accessKeyId);
      expect(headers?.["KALSHI-ACCESS-TIMESTAMP"]).toBe(timestampMs);

      const signatureB64 = headers?.["KALSHI-ACCESS-SIGNATURE"];
      expect(signatureB64).toBeTypeOf("string");

      const message = `${timestampMs}${method}${path.split("?")[0]}`;
      const signatureBytes = Buffer.from(signatureB64!, "base64");

      const ok = crypto.verify(
        "sha256",
        message,
        {
          key: publicKeyPem,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
        },
        signatureBytes,
      );
      expect(ok).toBe(true);

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    vi.stubGlobal("fetch", fetchSpy);

    const result = await kalshiAuthedFetch({
      baseUrl,
      accessKeyId,
      privateKeyPem,
      timestampMs,
      method,
      path,
      json: true,
      timeoutMs: 1000,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

