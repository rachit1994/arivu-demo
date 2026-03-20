import { kalshiAuthedFetch } from "@/lib/kalshi/kalshiAuth";

const parseSubaccount = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  if (n < 0 || n > 32) return null;
  return n;
};

const parseLimit = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 200) return null;
  return n;
};

const parseTs = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 0) return null;
  return n;
};

type KalshiFillsResponse = {
  fills: unknown[];
  cursor: string | null;
};

const jsonError = (status: number, message: string): Response =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const isFillsResponse = (data: unknown): data is KalshiFillsResponse => {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Partial<KalshiFillsResponse>;
  return Array.isArray(d.fills) && "cursor" in d;
};

const setQueryParamIfNonEmptyString = (
  q: URLSearchParams,
  key: string,
  value: string | null,
): void => {
  if (value === null) return;
  const trimmed = value.trim();
  if (trimmed.length === 0) return;
  q.set(key, trimmed);
};

const setQueryParamIfNumber = (
  q: URLSearchParams,
  key: string,
  value: number | null,
): void => {
  if (value === null) return;
  q.set(key, String(value));
};

const validateIdentityQueryParams = ({
  searchParams,
  ticker,
  orderId,
  subaccount,
  limit,
}: {
  searchParams: URLSearchParams;
  ticker: string | null;
  orderId: string | null;
  subaccount: number | null;
  limit: number | null;
}): Response | null => {
  if (ticker !== null && ticker.trim().length === 0) return jsonError(400, "Invalid ticker");
  if (orderId !== null && orderId.trim().length === 0) return jsonError(400, "Invalid order_id");
  if (searchParams.has("subaccount") && subaccount === null)
    return jsonError(400, "Invalid subaccount");
  if (searchParams.has("limit") && limit === null) return jsonError(400, "Invalid limit");
  return null;
};

const validateTimeQueryParams = ({
  searchParams,
  minTsN,
  maxTsN,
}: {
  searchParams: URLSearchParams;
  minTsN: number | null;
  maxTsN: number | null;
}): Response | null => {
  if (searchParams.has("min_ts") && minTsN === null) return jsonError(400, "Invalid min_ts");
  if (searchParams.has("max_ts") && maxTsN === null) return jsonError(400, "Invalid max_ts");
  if (minTsN !== null && maxTsN !== null && minTsN >= maxTsN)
    return jsonError(400, "Invalid ts range");
  return null;
};

const buildKalshiPath = (
  searchParams: URLSearchParams,
): { path: string } | Response => {
  const ticker = searchParams.get("ticker");
  const orderId = searchParams.get("order_id");
  const minTsN = parseTs(searchParams.get("min_ts"));
  const maxTsN = parseTs(searchParams.get("max_ts"));
  const limit = parseLimit(searchParams.get("limit"));
  const cursor = searchParams.get("cursor");
  const subaccount = parseSubaccount(searchParams.get("subaccount"));

  const identityValidation = validateIdentityQueryParams({
    searchParams,
    ticker,
    orderId,
    subaccount,
    limit,
  });
  if (identityValidation) return identityValidation;

  const timeValidation = validateTimeQueryParams({
    searchParams,
    minTsN,
    maxTsN,
  });
  if (timeValidation) return timeValidation;

  const kalshiQuery = new URLSearchParams();
  setQueryParamIfNonEmptyString(kalshiQuery, "ticker", ticker);
  setQueryParamIfNonEmptyString(kalshiQuery, "order_id", orderId);
  setQueryParamIfNumber(kalshiQuery, "min_ts", minTsN);
  setQueryParamIfNumber(kalshiQuery, "max_ts", maxTsN);
  setQueryParamIfNumber(kalshiQuery, "limit", limit);
  setQueryParamIfNonEmptyString(kalshiQuery, "cursor", cursor);
  setQueryParamIfNumber(kalshiQuery, "subaccount", subaccount);

  const queryString = kalshiQuery.toString();
  const path = queryString
    ? `/portfolio/fills?${queryString}`
    : "/portfolio/fills";
  return { path };
};

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const built = buildKalshiPath(searchParams);
  if (built instanceof Response) return built;

  const accessKeyId = process.env.KALSHI_ACCESS_KEY_ID;
  const privateKeyPem = process.env.KALSHI_PRIVATE_KEY_PEM;
  const baseUrl =
    process.env.KALSHI_BASE_URL ?? "https://demo-api.kalshi.co/trade-api/v2";

  if (!accessKeyId || !privateKeyPem) {
    return jsonError(503, "Kalshi not configured");
  }
  const path = built.path;

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

    if (!isFillsResponse(data)) return jsonError(502, "Unexpected Kalshi response");

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return jsonError(503, "Kalshi request failed");
  }
}

