/**
 * Vitest runs every test file with this module first. Use it for polyfills and
 * app-wide mocks that would otherwise require repeating in each spec.
 *
 * Ordering note: mocks that replace modules must run before imports of those modules
 * in test files — Vitest hoists `vi.mock`, but this file executes before each suite.
 */
import "@testing-library/jest-dom/vitest";

import { webcrypto } from "node:crypto";
import { vi } from "vitest";

import { __setKalshiSubtleCryptoOverride } from "@/lib/trading/hooks";

/*
 * jsdom's SubtleCrypto rejects PKCS8 buffers used by Kalshi signing; Vitest’s VM can
 * also split `globalThis.crypto` from what `@/lib/trading/hooks` captured. Forcing
 * Node’s `webcrypto.subtle` keeps import-key + sign paths consistent in CI.
 */
__setKalshiSubtleCryptoOverride(webcrypto.subtle);

/*
 * `useSearchParams` is a client hook; in jsdom we don’t run the full Next router.
 * Mirror the browser address bar from `window.location.search` so:
 * - `history.replaceState` in tests updates TopicList the same way as production.
 * - We avoid a second `useQueryState('market')` in TopicList (would duplicate nuqs).
 *
 * Edge case: non-browser test environments without `window` — fall back to empty params.
 */
vi.mock("next/navigation", () => ({
  useSearchParams: (): URLSearchParams =>
    new URLSearchParams(
      globalThis.window !== undefined ? globalThis.window.location.search : "",
    ),
}));

/*
 * Many chart/list libs expect ResizeObserver; jsdom omits it. Stub no-op methods —
 * tests don’t assert on resize behavior, they only need the observer not to throw.
 */
if (!("ResizeObserver" in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
