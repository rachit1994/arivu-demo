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

describe("Kalshi /api/kalshi/portfolio/fills route", () => {
  test("returns fills + cursor", async () => {
    const { privateKeyPem } = makeKeyPairPem();
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.KALSHI_BASE_URL = "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          fills: [
            {
              fill_id: "f_1",
              trade_id: "f_1",
              order_id: "o_1",
              client_order_id: "c_1",
              ticker: "ev_1",
              market_ticker: "ev_1",
              side: "yes",
              action: "buy",
              count_fp: "1.00",
              yes_price_dollars: "0.50",
              no_price_dollars: "0.50",
              yes_price_fixed: "0.50",
              no_price_fixed: "0.50",
              is_taker: false,
              fee_cost: "0.01",
              subaccount_number: 0,
              ts: 1710000000,
            },
          ],
          cursor: "cursor_1",
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request(
      "http://localhost/api/kalshi/portfolio/fills?ticker=ev_1&subaccount=0&limit=10",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as unknown;
    expect(json).toBeTruthy();
    if (typeof json !== "object" || json === null) return;
    const normalized = json as { fills?: unknown[]; cursor?: string | null };
    expect(Array.isArray(normalized.fills)).toBe(true);
    expect(normalized.cursor).toBe("cursor_1");
  });
});

