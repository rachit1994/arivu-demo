import "@testing-library/jest-dom/vitest";

import { webcrypto } from "node:crypto";

// jsdom's SubtleCrypto can reject Node ArrayBuffers/TypedArrays in importKey (cross-realm).
// Use Node's Web Crypto for tests so PKCS#8 buffers from kalshiAuth match crypto.subtle.
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: webcrypto,
  writable: true,
});

if (!("ResizeObserver" in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

