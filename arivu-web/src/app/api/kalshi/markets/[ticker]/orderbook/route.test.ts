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

describe("Kalshi /api/kalshi/markets/[ticker]/orderbook route", () => {
  test("returns orderbook_fp for valid ticker and depth", async () => {
    const { privateKeyPem } = makeKeyPairPem();
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.KALSHI_BASE_URL = "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          orderbook_fp: {
            yes_dollars: [
              ["0.5000", "100.00"],
              ["0.4900", "50.00"],
            ],
            no_dollars: [
              ["0.5200", "75.00"],
              ["0.5300", "20.00"],
            ],
          },
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request(
      "http://localhost/api/kalshi/markets/ev_1/orderbook?depth=5",
    );
    const res = await GET(req, { params: { ticker: "ev_1" } });
    expect(res.status).toBe(200);

    const json = (await res.json()) as unknown;
    expect(json).toBeTruthy();
    if (typeof json !== "object" || json === null) return;
    if (!("orderbook_fp" in json)) return;

    const orderbookFp = (json as { orderbook_fp: { yes_dollars: unknown[] } }).orderbook_fp;
    expect(orderbookFp.yes_dollars.length).toBe(2);
  });
});

