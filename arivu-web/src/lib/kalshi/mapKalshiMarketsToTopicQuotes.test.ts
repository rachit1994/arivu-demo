import { describe, expect, test } from "vitest";

import type { TopicQuote } from "@/lib/mockRealtime/types";

import { mapKalshiMarketsToTopicQuotes } from "./mapKalshiMarketsToTopicQuotes";

type KalshiMarket = {
  ticker: string;
  market_type?: string;
  title?: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  last_price_dollars?: string;
  volume?: number | string;
  coin?: string;
  chain?: string;
};

describe("mapKalshiMarketsToTopicQuotes", () => {
  test("maps an Elections market into Elections + subtitle question + USD price", () => {
    const input: KalshiMarket[] = [
      {
        ticker: "ev_1",
        market_type: "binary",
        title: "Midterm election: Senator",
        subtitle: "Will the senator win?",
        yes_sub_title: "YES",
        no_sub_title: "NO",
        last_price_dollars: "0.55",
        yes_bid_dollars: "0.54",
        yes_ask_dollars: "0.56",
        coin: "BTC",
        chain: "Ethereum",
        volume: "350019",
      },
    ];

    const out = mapKalshiMarketsToTopicQuotes(input);
    expect(out).toHaveLength(1);

    expect(out[0]?.id).toBe("ev_1");
    expect(out[0]?.category).toBe("Elections");
    expect(out[0]?.question).toBe("Will the senator win?");
    expect(out[0]?.price).toBe("$0.55");
    expect(out[0]?.coin).toBe("BTC");
    expect(out[0]?.chain).toBe("Ethereum");
    expect(out[0]?.totalVolume).toBe("$350,019");
    expect(out[0]?.apv).toBe("36%");
    expect(out[0]?.yesPrice).toBe("$0.55");
    expect(out[0]?.noPrice).toBe("$0.45");
  });

  test("maps a Sports market using yes_sub_title when subtitle is missing", () => {
    const input: KalshiMarket[] = [
      {
        ticker: "ev_2",
        market_type: "binary",
        title: "NBA matchup",
        subtitle: "",
        yes_sub_title: "Will Team A win?",
        no_sub_title: "Will Team B win?",
        last_price_dollars: "0.12",
        yes_bid_dollars: "0.11",
        yes_ask_dollars: "0.13",
      },
    ];

    const out: TopicQuote[] = mapKalshiMarketsToTopicQuotes(input);
    expect(out[0]?.id).toBe("ev_2");
    expect(out[0]?.category).toBe("Sports");
    expect(out[0]?.question).toBe("Will Team A win?");
    expect(out[0]?.price).toBe("$0.12");
    expect(out[0]?.coin).toBe("—");
    expect(out[0]?.chain).toBe("—");
    expect(out[0]?.totalVolume).toBe("—");
    expect(out[0]?.apv).toBe("—");
    expect(out[0]?.yesPrice).toBe("$0.12");
    expect(out[0]?.noPrice).toBe("$0.88");
  });
});

