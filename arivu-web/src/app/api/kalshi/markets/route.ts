import { kalshiAuthedFetch } from "@/lib/kalshi/kalshiAuth";

type KalshiMarketStatus = "unopened" | "open" | "paused" | "closed" | "settled";

const ALLOWED_STATUSES: ReadonlySet<KalshiMarketStatus> = new Set([
  "unopened",
  "open",
  "paused",
  "closed",
  "settled",
]);

const parseLimit = (raw: string | null): number | null => {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 1000) return null;
  return n;
};

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const limit = parseLimit(searchParams.get("limit"));
  const cursor = searchParams.get("cursor");
  const statusRaw = searchParams.get("status");

  const status = statusRaw && (ALLOWED_STATUSES.has(statusRaw as KalshiMarketStatus))
    ? (statusRaw as KalshiMarketStatus)
    : null;

  if (searchParams.has("limit") && limit === null) {
    return new Response(JSON.stringify({ error: "Invalid limit" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (statusRaw && status === null) {
    return new Response(JSON.stringify({ error: "Invalid status" }), {
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
  if (limit !== null) kalshiQuery.set("limit", String(limit));
  if (cursor) kalshiQuery.set("cursor", cursor);
  if (status !== null) kalshiQuery.set("status", status);

  const path = `/markets${kalshiQuery.toString() ? `?${kalshiQuery}` : ""}`;
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

    if (
      typeof data !== "object" ||
      !data ||
      !("cursor" in data) ||
      !("markets" in data)
    ) {
      return new Response(JSON.stringify({ error: "Unexpected Kalshi response" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const normalized = data as { markets: unknown[]; cursor: string | null };
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

