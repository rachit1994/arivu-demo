import crypto from "node:crypto";
import { describe, expect, test, vi } from "vitest";

import { GET } from "./route";

const makeKeyPairPem = () => {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  return privateKey.export({ type: "pkcs8", format: "pem" }).toString();
};

describe("Kalshi /api/kalshi/portfolio/balance route", () => {
  test("returns balance and portfolio_value for valid params", async () => {
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = makeKeyPairPem();
    process.env.KALSHI_BASE_URL =
      "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          balance: 12345,
          portfolio_value: 23456,
          updated_ts: 1703123456789,
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request(
      "http://localhost/api/kalshi/portfolio/balance?subaccount=1",
    );

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.balance).toBe(12345);
    expect(json.portfolio_value).toBe(23456);
    expect(json.updated_ts).toBe(1703123456789);
  });
});

