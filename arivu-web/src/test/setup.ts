import "@testing-library/jest-dom/vitest";

if (!("ResizeObserver" in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

