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

describe("Kalshi /api/kalshi/portfolio/positions route", () => {
  test("returns market_positions + event_positions", async () => {
    const { privateKeyPem } = makeKeyPairPem();
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.KALSHI_BASE_URL = "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          market_positions: [{ ticker: "ev_1", position_fp: "1.00" }],
          event_positions: [{ event_ticker: "ev_1", realized_pnl_dollars: "0.00" }],
          cursor: "cursor_1",
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request(
      "http://localhost/api/kalshi/portfolio/positions?subaccount=0&ticker=ev_1&limit=10",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as unknown;
    expect(json).toBeTruthy();
    if (typeof json !== "object" || json === null) return;
    expect("market_positions" in json).toBe(true);
    expect("event_positions" in json).toBe(true);
  });
});

