import { kalshiAuthedFetch } from "@/lib/kalshi/kalshiAuth";

type KalshiHistoricalFillsResponse = {
  fills: unknown[];
  cursor: string | null;
};

const jsonError = (status: number, message: string): Response =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const parseNonNegativeInt = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 0) return null;
  return n;
};

const parseLimit = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 200) return null;
  return n;
};

const isHistoricalFillsResponse = (
  data: unknown,
): data is KalshiHistoricalFillsResponse => {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Partial<KalshiHistoricalFillsResponse>;
  return Array.isArray(d.fills) && "cursor" in d;
};

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);

  const ticker = searchParams.get("ticker");
  const maxTsN = parseNonNegativeInt(searchParams.get("max_ts"));
  const limit = parseLimit(searchParams.get("limit"));
  const cursor = searchParams.get("cursor");

  if (ticker !== null && ticker.trim().length === 0) {
    return jsonError(400, "Invalid ticker");
  }

  if (searchParams.has("max_ts") && maxTsN === null) {
    return jsonError(400, "Invalid max_ts");
  }

  if (searchParams.has("limit") && limit === null) {
    return jsonError(400, "Invalid limit");
  }

  const kalshiQuery = new URLSearchParams();
  if (ticker) kalshiQuery.set("ticker", ticker);
  if (maxTsN !== null) kalshiQuery.set("max_ts", String(maxTsN));
  if (limit !== null) kalshiQuery.set("limit", String(limit));
  if (cursor) kalshiQuery.set("cursor", cursor);

  const path = `/historical/fills${
    kalshiQuery.toString() ? `?${kalshiQuery}` : ""
  }`;

  const accessKeyId = process.env.KALSHI_ACCESS_KEY_ID;
  const privateKeyPem = process.env.KALSHI_PRIVATE_KEY_PEM;
  const baseUrl =
    process.env.KALSHI_BASE_URL ?? "https://demo-api.kalshi.co/trade-api/v2";

  if (!accessKeyId || !privateKeyPem) {
    return jsonError(503, "Kalshi not configured");
  }

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

    if (!isHistoricalFillsResponse(data)) {
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

