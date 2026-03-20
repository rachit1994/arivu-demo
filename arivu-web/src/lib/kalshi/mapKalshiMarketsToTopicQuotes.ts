import type { TopicQuote, MarketCategory } from "@/lib/mockRealtime/types";

export type KalshiMarket = {
  market_type?: string;
  ticker: string;
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

const toLower = (s: string) => s.toLowerCase();

const pickFirstNonEmpty = (...values: Array<string | undefined>) => {
  for (const v of values) {
    const x = v?.trim();
    if (x) return x;
  }
  return "";
};

const formatUsd = (raw?: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
};

const formatUsdMaybe = (raw: unknown): string => {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return "—";
    return `$${raw.toFixed(2)}`;
  }

  if (typeof raw === "string") {
    const n = Number(raw);
    if (!Number.isFinite(n)) return "—";
    return `$${n.toFixed(2)}`;
  }

  return "—";
};

const formatUsdVolumeMaybe = (raw: unknown): string => {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return "—";
    const whole = Math.round(raw);
    return `$${whole.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  if (typeof raw === "string") {
    const n = Number(raw);
    if (!Number.isFinite(n)) return "—";
    const whole = Math.round(n);
    return `$${whole.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  return "—";
};

const formatApvApproxFromVolume = (raw: unknown): string => {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : NaN;
  if (!Number.isFinite(n)) return "—";
  // Approximation to produce stable, plausible values until APV is confirmed.
  const apvPct = (n / 975000) * 100;
  const clamped = Math.max(0, Math.min(999, Math.round(apvPct)));
  return `${clamped}%`;
};

const pickString = (raw: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed) return trimmed;
    }
  }
  return "—";
};

const categorize = (m: KalshiMarket): MarketCategory => {
  const text = toLower(
    [
      m.title,
      m.subtitle,
      m.yes_sub_title,
      m.no_sub_title,
    ]
      .filter((x): x is string => typeof x === "string")
      .join(" "),
  );

  const electionKeywords = [
    "election",
    "senator",
    "governor",
    "mayor",
    "president",
    "ballot",
    "vote",
  ];

  const sportsKeywords = [
    "nba",
    "nfl",
    "mlb",
    "ufc",
    "match",
    "tournament",
    "league",
    "team",
    "vs",
  ];

  const techKeywords = [
    "llm",
    "chip",
    "framework",
    "browser",
    "device",
    "software",
    "ai",
  ];

  const economyKeywords = [
    "inflation",
    "unemployment",
    "gdp",
    "growth",
    "consumer confidence",
    "recession",
    "interest rate",
  ];

  const cultureKeywords = [
    "film",
    "movie",
    "album",
    "song",
    "series",
    "game",
    "podcast",
    "release",
    "festival",
  ];

  const matchesAny = (ks: string[]) => ks.some((k) => text.includes(k));

  if (matchesAny(electionKeywords)) return "Elections";
  if (matchesAny(sportsKeywords)) return "Sports";
  if (matchesAny(techKeywords)) return "Tech";
  if (matchesAny(economyKeywords)) return "Economy";
  if (matchesAny(cultureKeywords)) return "Culture";

  return "Tech";
};

export const mapKalshiMarketsToTopicQuotes = (
  markets: KalshiMarket[],
): TopicQuote[] => {
  return markets
    .filter((m) => m.market_type === "binary")
    .filter((m) => typeof m.yes_bid_dollars === "string" && typeof m.yes_ask_dollars === "string")
    .map((m) => {
      const raw = m as unknown as Record<string, unknown>;
      const question = pickFirstNonEmpty(
        m.subtitle,
        m.yes_sub_title,
        m.no_sub_title,
        m.title,
      );

      const yesProb = Number(m.last_price_dollars);
      const yesPrice =
        Number.isFinite(yesProb) ? formatUsdMaybe(yesProb) : "—";
      const noPrice =
        Number.isFinite(yesProb) && yesProb >= 0 && yesProb <= 1
          ? formatUsdMaybe(1 - yesProb)
          : "—";

      return {
        id: m.ticker,
        category: categorize(m),
        question: question || m.ticker,
        price: formatUsd(m.last_price_dollars),
        coin: pickString(raw, ["coin", "underlying_coin", "asset", "base_asset"]),
        chain: pickString(raw, ["chain", "underlying_chain", "network"]),
        totalVolume: formatUsdVolumeMaybe(m.volume),
        apv: formatApvApproxFromVolume(m.volume),
        yesPrice,
        noPrice,
      };
    });
};

