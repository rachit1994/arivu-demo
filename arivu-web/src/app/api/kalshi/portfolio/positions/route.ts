import { kalshiAuthedFetch } from "@/lib/kalshi/kalshiAuth";

type KalshiPositionsResponse = {
  market_positions: unknown[];
  event_positions: unknown[];
  cursor: string | null;
};

const jsonError = (status: number, message: string): Response =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const parseSubaccount = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  // Primary is 0, subaccounts are 1-32.
  if (n < 0 || n > 32) return null;
  return n;
};

const parseLimit = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 1000) return null;
  return n;
};

const buildKalshiQuery = (
  searchParams: URLSearchParams,
): { kalshiQuery: URLSearchParams } | Response => {
  const ticker = searchParams.get("ticker");
  const eventTicker = searchParams.get("event_ticker");
  const subaccount = parseSubaccount(searchParams.get("subaccount"));
  const limit = parseLimit(searchParams.get("limit"));
  const cursor = searchParams.get("cursor");
  const countFilter = searchParams.get("count_filter");

  if (searchParams.has("subaccount") && subaccount === null) {
    return jsonError(400, "Invalid subaccount");
  }
  if (searchParams.has("limit") && limit === null) {
    return jsonError(400, "Invalid limit");
  }
  if (ticker !== null && ticker.trim().length === 0) {
    return jsonError(400, "Invalid ticker");
  }
  if (eventTicker !== null && eventTicker.trim().length === 0) {
    return jsonError(400, "Invalid event_ticker");
  }

  const kalshiQuery = new URLSearchParams();
  if (ticker) kalshiQuery.set("ticker", ticker);
  if (eventTicker) kalshiQuery.set("event_ticker", eventTicker);
  if (subaccount !== null) kalshiQuery.set("subaccount", String(subaccount));
  if (limit !== null) kalshiQuery.set("limit", String(limit));
  if (cursor) kalshiQuery.set("cursor", cursor);
  if (countFilter) kalshiQuery.set("count_filter", countFilter);

  return { kalshiQuery };
};

const isPositionsResponse = (data: unknown): data is KalshiPositionsResponse => {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Partial<KalshiPositionsResponse>;
  return (
    Array.isArray(d.market_positions) &&
    Array.isArray(d.event_positions) &&
    "cursor" in d
  );
};

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const accessKeyId = process.env.KALSHI_ACCESS_KEY_ID;
  const privateKeyPem = process.env.KALSHI_PRIVATE_KEY_PEM;
  const baseUrl =
    process.env.KALSHI_BASE_URL ?? "https://demo-api.kalshi.co/trade-api/v2";

  if (!accessKeyId || !privateKeyPem) {
    return jsonError(503, "Kalshi not configured");
  }

  const built = buildKalshiQuery(searchParams);
  if (built instanceof Response) return built;

  const path = `/portfolio/positions${
    built.kalshiQuery.toString() ? `?${built.kalshiQuery.toString()}` : ""
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

    if (!isPositionsResponse(data)) {
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

