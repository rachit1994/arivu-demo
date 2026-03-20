import { kalshiAuthedFetch } from "@/lib/kalshi/kalshiAuth";
import type { NextRequest } from "next/server";

const parseDepth = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  // Kalshi accepts 0-100; we bound to 0-100 as input validation.
  if (n < 0 || n > 100) return null;
  return n;
};

type KalshiPriceLevel = [string, string];

type KalshiOrderbookResponse = {
  orderbook_fp: {
    yes_dollars: KalshiPriceLevel[];
    no_dollars: KalshiPriceLevel[];
  };
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ ticker: string }> },
): Promise<Response> {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const { ticker } = await ctx.params;

  if (ticker.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Invalid ticker" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const depth = parseDepth(searchParams.get("depth"));
  if (searchParams.has("depth") && depth === null) {
    return new Response(JSON.stringify({ error: "Invalid depth" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accessKeyId = process.env.KALSHI_ACCESS_KEY_ID;
  const privateKeyPem = process.env.KALSHI_PRIVATE_KEY_PEM;
  const baseUrl =
    process.env.KALSHI_BASE_URL ?? "https://demo-api.kalshi.co/trade-api/v2";

  if (!accessKeyId || !privateKeyPem) {
    return new Response(JSON.stringify({ error: "Kalshi not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const kalshiQuery = new URLSearchParams();
  if (depth !== null) kalshiQuery.set("depth", String(depth));

  const path = `/markets/${encodeURIComponent(ticker)}/orderbook${
    kalshiQuery.toString() ? `?${kalshiQuery.toString()}` : ""
  }`;

  const timestampMs = String(Date.now());
  try {
    const data = (await kalshiAuthedFetch({
      baseUrl,
      accessKeyId,
      privateKeyPem,
      timestampMs,
      method: "GET",
      path,
      timeoutMs: 8000,
      json: true,
    })) as unknown;

    if (typeof data !== "object" || data === null) {
      return new Response(JSON.stringify({ error: "Unexpected Kalshi response" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const normalized = data as KalshiOrderbookResponse;
    if (!("orderbook_fp" in normalized)) {
      return new Response(JSON.stringify({ error: "Unexpected Kalshi response" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Kalshi request failed" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

