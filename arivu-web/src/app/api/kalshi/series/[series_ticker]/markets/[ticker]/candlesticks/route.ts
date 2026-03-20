import { kalshiAuthedFetch } from "@/lib/kalshi/kalshiAuth";
import type { NextRequest } from "next/server";

const parseUnixTs = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 0) return null;
  return n;
};

const parsePeriodInterval = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n !== 1 && n !== 60 && n !== 1440) return null;
  return n;
};

const parseBooleanMaybe = (raw: string | null): boolean | null => {
  if (raw === null) return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
};

type KalshiBidAsk = {
  open_dollars: string | null;
  low_dollars: string | null;
  high_dollars: string | null;
  close_dollars: string | null;
};

type KalshiPriceDistribution = {
  open_dollars: string | null;
  low_dollars: string | null;
  high_dollars: string | null;
  close_dollars: string | null;
};

type KalshiCandlestick = {
  end_period_ts: number;
  yes_bid: KalshiBidAsk;
  yes_ask: KalshiBidAsk;
  price: KalshiPriceDistribution;
  volume_fp: string;
  open_interest_fp: string;
};

type KalshiCandlesticksResponse = {
  ticker: string;
  candlesticks: KalshiCandlestick[];
};

export async function GET(
  req: NextRequest,
  ctx: {
    params: Promise<{ series_ticker: string; ticker: string }>;
  },
): Promise<Response> {
  const { series_ticker, ticker } = await ctx.params;
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const seriesTicker = series_ticker;

  if (seriesTicker.trim().length === 0 || ticker.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Invalid market params" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startTs = parseUnixTs(searchParams.get("start_ts"));
  const endTs = parseUnixTs(searchParams.get("end_ts"));
  const periodInterval = parsePeriodInterval(
    searchParams.get("period_interval"),
  );
  const includeLatestBeforeStart = parseBooleanMaybe(
    searchParams.get("include_latest_before_start"),
  );

  if (startTs === null || endTs === null || periodInterval === null) {
    return new Response(JSON.stringify({ error: "Invalid query params" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (startTs >= endTs) {
    return new Response(JSON.stringify({ error: "Invalid ts range" }), {
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
  kalshiQuery.set("start_ts", String(startTs));
  kalshiQuery.set("end_ts", String(endTs));
  kalshiQuery.set("period_interval", String(periodInterval));
  if (includeLatestBeforeStart !== null) {
    kalshiQuery.set(
      "include_latest_before_start",
      includeLatestBeforeStart ? "true" : "false",
    );
  }

  const path = `/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(
    ticker,
  )}/candlesticks?${kalshiQuery.toString()}`;

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

    if (typeof data !== "object" || data === null) {
      return new Response(JSON.stringify({ error: "Unexpected Kalshi response" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const normalized = data as KalshiCandlesticksResponse;
    if (!("ticker" in normalized) || !("candlesticks" in normalized)) {
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

