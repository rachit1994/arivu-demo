import crypto from "node:crypto";
import { describe, expect, test, vi } from "vitest";

import { GET } from "./route";

const makeKeyPairPem = () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  return {
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
  };
};

describe("Kalshi /api/kalshi/markets route", () => {
  test("returns markets + cursor for valid query params", async () => {
    const { privateKeyPem } = makeKeyPairPem();
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.KALSHI_BASE_URL =
      "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          markets: [
            {
              ticker: "abc",
              event_ticker: "ev_1",
              market_type: "binary",
              title: "Some Market",
              subtitle: "Will it happen?",
              yes_sub_title: "Yes",
              no_sub_title: "No",
              status: "active",
              last_price_dollars: "0.55",
            },
          ],
          cursor: "cursor_1",
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request(
      "http://localhost/api/kalshi/markets?limit=10&cursor=cursor_1&status=open",
    );

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.cursor).toBe("cursor_1");
    expect(json.markets.length).toBe(1);
    expect(json.markets[0]!.ticker).toBe("abc");
  });
});

