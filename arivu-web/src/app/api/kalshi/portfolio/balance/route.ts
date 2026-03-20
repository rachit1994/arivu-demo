import { kalshiAuthedFetch } from "@/lib/kalshi/kalshiAuth";

const parseSubaccount = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  if (n < 0 || n > 32) return null;
  return n;
};

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const subaccount = parseSubaccount(searchParams.get("subaccount"));
  if (searchParams.has("subaccount") && subaccount === null) {
    return new Response(JSON.stringify({ error: "Invalid subaccount" }), {
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
  if (subaccount !== null) kalshiQuery.set("subaccount", String(subaccount));

  const path = `/portfolio/balance${
    kalshiQuery.toString() ? `?${kalshiQuery}` : ""
  }`;

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
      !("balance" in data) ||
      !("portfolio_value" in data) ||
      !("updated_ts" in data)
    ) {
      return new Response(JSON.stringify({ error: "Unexpected Kalshi response" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const normalized = data as {
      balance: number;
      portfolio_value: number;
      updated_ts: number;
    };

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

