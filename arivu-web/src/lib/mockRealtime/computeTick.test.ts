import { describe, expect, test } from "vitest";

import { buildInitialSnapshot, computeNextSnapshot } from "./computeTick";

describe("computeNextSnapshot", () => {
  test("increments tick and grows price history", () => {
    const a = buildInitialSnapshot();
    expect(a.prices.length).toBe(1);
    expect(a.orderbook.length).toBe(5);
    const b = computeNextSnapshot(a);
    expect(b.tick).toBe(1);
    expect(b.prices.length).toBe(2);
    const c = computeNextSnapshot(b);
    expect(c.tick).toBe(2);
    expect(c.prices.length).toBe(3);
    expect(c.orderbook.length).toBe(5);
    expect(c.topics.length).toBeGreaterThan(100);
    expect(c.portfolio.length).toBe(3);
  });
});
