import { kalshiAuthedFetch } from "@/lib/kalshi/kalshiAuth";
import type { NextRequest } from "next/server";

type KalshiMarketResponse = {
  market: unknown;
};

const jsonError = (status: number, message: string): Response =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const isKalshiMarketResponse = (data: unknown): data is KalshiMarketResponse => {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Partial<KalshiMarketResponse>;
  return "market" in d;
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ ticker: string }> },
): Promise<Response> {
  const { ticker } = await ctx.params;

  if (ticker.trim().length === 0) {
    return jsonError(400, "Invalid ticker");
  }

  const accessKeyId = process.env.KALSHI_ACCESS_KEY_ID;
  const privateKeyPem = process.env.KALSHI_PRIVATE_KEY_PEM;
  const baseUrl =
    process.env.KALSHI_BASE_URL ?? "https://demo-api.kalshi.co/trade-api/v2";

  if (!accessKeyId || !privateKeyPem) {
    return jsonError(503, "Kalshi not configured");
  }

  const path = `/markets/${encodeURIComponent(ticker)}`;
  const timestampMs = String(Date.now());

  try {
    const data = await kalshiAuthedFetch({
      baseUrl,
      accessKeyId,
      privateKeyPem,
      timestampMs,
      method: "GET",
      path,
      timeoutMs: 8000,
      json: true,
    });

    if (!isKalshiMarketResponse(data)) {
      return jsonError(502, "Unexpected Kalshi response");
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return jsonError(503, "Kalshi request failed");
  }
}

