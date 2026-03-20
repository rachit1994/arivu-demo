import { describe, expect, test } from "vitest";

import {
  computeYesBidSharePercent,
  parsePriceLikeToNumber,
} from "./topicRowPriceUtils";

describe("topicRowPriceUtils", () => {
  test("parsePriceLikeToNumber handles currency-ish strings", () => {
    expect(parsePriceLikeToNumber("$0.28")).toBe(0.28);
    expect(parsePriceLikeToNumber("3.72")).toBe(3.72);
    expect(parsePriceLikeToNumber("")).toBeNull();
    expect(parsePriceLikeToNumber("x")).toBeNull();
  });

  test("computeYesBidSharePercent splits by sum of parsed prices", () => {
    const { yesPct, noPct } = computeYesBidSharePercent("$0.28", "$3.72");
    expect(yesPct + noPct).toBeCloseTo(100, 5);
    expect(yesPct).toBeLessThan(noPct);
  });
});
