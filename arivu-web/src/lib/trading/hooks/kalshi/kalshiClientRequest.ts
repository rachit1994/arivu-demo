/**
 * Thin client for signed Kalshi **GET** JSON calls. Used from hooks (order book, candles).
 *
 * Result kinds:
 * - `unconfigured` — missing env keys; callers should degrade to mock UI, not throw.
 * - `ok` — parsed body as `unknown`; each hook validates shape.
 * - `error` — network, timeout, 4xx/5xx, or signature failure — message for UI/logs.
 *
 * Security note: keys live in `NEXT_PUBLIC_*` (required for static client builds) —
 * treat as **demo / user-owned** credentials, not server secrets.
 */
import { getKalshiBrowserConfig } from "./kalshiBrowserConfig";
import { kalshiAuthedFetch } from "./kalshiAuth";

export type KalshiJsonResult =
  | { kind: "unconfigured" }
  | { kind: "ok"; data: unknown }
  | { kind: "error"; message: string };

/** Authenticated GET to Kalshi Trade API from the browser. */
export const kalshiAuthedJsonGet = async (
  path: string,
  init?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<KalshiJsonResult> => {
  const cfg = getKalshiBrowserConfig();
  if (!cfg) return { kind: "unconfigured" };

  const timestampMs = String(Date.now());
  const timeoutMs = init?.timeoutMs ?? 8000;

  try {
    const data = await kalshiAuthedFetch({
      baseUrl: cfg.baseUrl,
      accessKeyId: cfg.accessKeyId,
      privateKeyPem: cfg.privateKeyPem,
      timestampMs,
      method: "GET",
      path,
      timeoutMs,
      json: true,
      signal: init?.signal,
    });
    return { kind: "ok", data };
  } catch (e) {
    // Do not leak stack traces to UI — hooks map this to user-visible error strings.
    const message = e instanceof Error ? e.message : "Kalshi request failed";
    return { kind: "error", message };
  }
};
