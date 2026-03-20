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

describe("Kalshi /api/kalshi/portfolio/orders route", () => {
  test("returns orders + cursor", async () => {
    const { privateKeyPem } = makeKeyPairPem();
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.KALSHI_BASE_URL = "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          orders: [
            {
              order_id: "o_1",
              user_id: "u_1",
              client_order_id: "c_1",
              ticker: "ev_1",
              side: "yes",
              action: "buy",
              type: "limit",
              status: "resting",
              yes_price_dollars: "0.550000",
              no_price_dollars: "0.450000",
              fill_count_fp: "0.00",
              remaining_count_fp: "1.00",
              initial_count_fp: "1.00",
              taker_fees_dollars: "0.00",
              maker_fees_dollars: "0.00",
              taker_fill_cost_dollars: "0.00",
              maker_fill_cost_dollars: "0.00",
            },
          ],
          cursor: "cursor_1",
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request(
      "http://localhost/api/kalshi/portfolio/orders?ticker=ev_1&subaccount=0&status=resting&limit=10",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as unknown;
    expect(json).toBeTruthy();
    if (typeof json !== "object" || json === null) return;
    const normalized = json as { orders?: unknown[]; cursor?: string | null };
    expect(Array.isArray(normalized.orders)).toBe(true);
    expect(normalized.cursor).toBe("cursor_1");
  });
});

