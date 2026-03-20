import { getKalshiBrowserConfig } from "./kalshiBrowserConfig";
import { kalshiAuthedFetch } from "./kalshiAuth";

export type KalshiJsonResult =
  | { kind: "unconfigured" }
  | { kind: "ok"; data: unknown }
  | { kind: "error"; message: string };

/**
 * Authenticated GET to Kalshi Trade API from the client (static export / GitHub Pages).
 */
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
    const message = e instanceof Error ? e.message : "Kalshi request failed";
    return { kind: "error", message };
  }
};
