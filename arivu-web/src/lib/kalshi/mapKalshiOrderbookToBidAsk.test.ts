import { describe, expect, test } from "vitest";

import { mapKalshiOrderbookToBidAsk } from "./mapKalshiOrderbookToBidAsk";

describe("mapKalshiOrderbookToBidAsk", () => {
  describe("Positive cases", () => {
    test("converts yes/no dollars into bids/asks and computes mid/spread", () => {
      const resp = {
        orderbook_fp: {
          yes_dollars: [
            ["0.40", "10.00"],
            ["0.45", "5.00"],
          ],
          no_dollars: [
            ["0.50", "7.00"],
            ["0.55", "12.00"],
          ],
        },
      };

      const mapped = mapKalshiOrderbookToBidAsk(resp.orderbook_fp);

      expect(mapped.bids.length).toBe(2);
      // Bids are sorted best->worst (descending price).
      expect(mapped.bids[0]!.px).toBe(0.45);
      expect(mapped.bids[0]!.qty).toBe(5);
      expect(mapped.bids[1]!.px).toBe(0.4);
      expect(mapped.bids[1]!.qty).toBe(10);

      // For NO bids at p_no, the corresponding YES ask is at p_yes = 1 - p_no.
      expect(mapped.asks.length).toBe(2);
      // Asks are sorted best->worst (ascending price).
      expect(mapped.asks[0]!.px).toBeCloseTo(0.45);
      expect(mapped.asks[0]!.qty).toBe(12);
      expect(mapped.asks[1]!.px).toBeCloseTo(0.5);
      expect(mapped.asks[1]!.qty).toBe(7);

      const bestBid = mapped.bids[0]!.px;
      const bestAsk = mapped.asks[0]!.px;
      const expectedMid = (bestBid + bestAsk) / 2;
      const expectedSpread = bestAsk - bestBid;

      expect(mapped.mid).toBeCloseTo(expectedMid);
      expect(mapped.spread).toBeCloseTo(expectedSpread);
    });

    test("is order-independent for ascending/descending input arrays", () => {
      const descResp = {
        orderbook_fp: {
          yes_dollars: [
            ["0.5000", "100.00"],
            ["0.4900", "50.00"],
          ],
          no_dollars: [
            ["0.5200", "75.00"],
            ["0.5300", "20.00"],
          ],
        },
      };

      const mappedDesc = mapKalshiOrderbookToBidAsk(descResp.orderbook_fp);

      // best bid is max(yes_dollars px) => 0.50
      expect(mappedDesc.bids[0]!.px).toBeCloseTo(0.5);
      // Spread is clamped non-negative.
      expect(mappedDesc.asks[0]!.px).toBeCloseTo(0.47);
      expect(mappedDesc.spread).toBeCloseTo(0);
      expect(mappedDesc.mid).toBeCloseTo(mappedDesc.bids[0]!.px);

      const ascResp = {
        orderbook_fp: {
          yes_dollars: [...descResp.orderbook_fp.yes_dollars].reverse(),
          no_dollars: [...descResp.orderbook_fp.no_dollars].reverse(),
        },
      };

      const mappedAsc = mapKalshiOrderbookToBidAsk(ascResp.orderbook_fp);
      expect(mappedAsc.mid).toBeCloseTo(mappedDesc.mid);
      expect(mappedAsc.spread).toBeCloseTo(mappedDesc.spread);
    });
  });

  describe("Negative cases", () => {
    test("handles empty sides", () => {
      const resp = {
        orderbook_fp: {
          yes_dollars: [],
          no_dollars: [],
        },
      };

      const mapped = mapKalshiOrderbookToBidAsk(resp.orderbook_fp);
      expect(mapped.bids).toEqual([]);
      expect(mapped.asks).toEqual([]);
      expect(mapped.mid).toBeNull();
      expect(mapped.spread).toBeNull();
    });
  });
});

