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

describe("Kalshi /series/[series_ticker]/markets/[ticker]/candlesticks route", () => {
  test("returns candlesticks for valid query", async () => {
    const { privateKeyPem } = makeKeyPairPem();
    process.env.KALSHI_ACCESS_KEY_ID = "ak_123";
    process.env.KALSHI_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.KALSHI_BASE_URL = "https://demo-api.kalshi.co/trade-api/v2";

    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          ticker: "ev_1",
          candlesticks: [
            {
              end_period_ts: 1710000000,
              yes_bid: {
                open_dollars: "0.50",
                low_dollars: "0.45",
                high_dollars: "0.55",
                close_dollars: "0.52",
              },
              yes_ask: {
                open_dollars: "0.51",
                low_dollars: "0.46",
                high_dollars: "0.56",
                close_dollars: "0.53",
              },
              price: {
                open_dollars: "0.50",
                low_dollars: "0.45",
                high_dollars: "0.55",
                close_dollars: "0.52",
              },
              volume_fp: "10.00",
              open_interest_fp: "100.00",
            },
          ],
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request(
      "http://localhost/api/kalshi/series/ser_1/markets/ev_1/candlesticks?start_ts=1700000000&end_ts=1710000000&period_interval=60",
    );
    const res = await GET(req, {
      params: { series_ticker: "ser_1", ticker: "ev_1" },
    });

    expect(res.status).toBe(200);

    const json = (await res.json()) as unknown;
    expect(json).toBeTruthy();
    if (typeof json !== "object" || json === null) return;
    const normalized = json as {
      ticker: string;
      candlesticks: unknown[];
    };
    expect(normalized.ticker).toBe("ev_1");
    expect(normalized.candlesticks.length).toBe(1);
  });
});

