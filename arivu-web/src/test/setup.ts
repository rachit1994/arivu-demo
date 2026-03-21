import "@testing-library/jest-dom/vitest";

import { webcrypto } from "node:crypto";

import { __setKalshiSubtleCryptoOverride } from "@/lib/trading/hooks";

// jsdom's SubtleCrypto rejects PKCS8 buffers from kalshiAuth; Vitest VMs can also split
// globalThis.crypto from the module graph. Force Node's subtle for all tests.
__setKalshiSubtleCryptoOverride(webcrypto.subtle);

if (!("ResizeObserver" in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

