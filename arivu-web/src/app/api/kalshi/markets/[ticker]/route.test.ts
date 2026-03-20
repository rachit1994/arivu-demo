import crypto from "node:crypto";
import { describe, expect, test, vi } from "vitest";

import { GET } from "./route";

const makeKeyPairPem = () => {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  return {
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
};

describe("Kalshi /api/kalshi/markets/[ticker] route", () => {
  test("returns market for valid ticker", async () => {
    const { privateKeyPem } = makeKeyPairPem();
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.KALSHI_BASE_URL = "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(JSON.stringify({ market: { ticker: "ev_1" } }), {
        status: 200,
      });
    });

    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request("http://localhost/api/kalshi/markets/ev_1");
    const res = await GET(req, { params: { ticker: "ev_1" } });
    expect(res.status).toBe(200);

    const json = (await res.json()) as unknown;
    if (typeof json !== "object" || json === null) throw new Error("bad json");
    const marketWrapper = json as { market?: { ticker?: string } };
    expect(marketWrapper.market?.ticker).toBe("ev_1");
  });
});

