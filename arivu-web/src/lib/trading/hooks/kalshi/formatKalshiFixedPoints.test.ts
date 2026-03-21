import { describe, expect, test } from "vitest";

import {
  formatIsoDateShort,
  formatKalshiDollarsUsd,
  formatKalshiFixedPointCount,
} from "./formatKalshiFixedPoints";

describe("formatKalshiFixedPoints", () => {
  test("formats fixed point dollars to 2 decimals", () => {
    expect(formatKalshiDollarsUsd("0.550000")).toBe("$0.55");
    expect(formatKalshiDollarsUsd("10")).toBe("$10.00");
  });

  test("formats fixed point count to 2 decimals", () => {
    expect(formatKalshiFixedPointCount("1.00")).toBe("1.00");
    expect(formatKalshiFixedPointCount("2")).toBe("2.00");
  });

  test("formats ISO date short", () => {
    expect(formatIsoDateShort("2026-03-18T10:00:00Z")).toBe("2026-03-18");
    expect(formatIsoDateShort("")).toBe("—");
    expect(formatIsoDateShort(null)).toBe("—");
  });
});

