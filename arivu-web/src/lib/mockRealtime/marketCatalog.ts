export const MARKET_CATEGORIES = [
  "Elections",
  "Sports",
  "Tech",
  "Economy",
  "Culture",
] as const;

export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

export interface MarketQuestionDef {
  id: string;
  category: MarketCategory;
  question: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const pick = <T,>(xs: readonly T[], i: number): T => xs[i % xs.length];

const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll(/[^a-z0-9-]/g, "");

const buildQuestion = (category: MarketCategory, index: number): string => {
  switch (category) {
    case "Elections": {
      const states = ["CA", "NY", "TX", "FL", "IL", "WA"] as const;
      const parties = ["Democrats", "Republicans"] as const;
      const offices = ["Governor", "Senate seat", "Mayor"] as const;
      const k = clamp(index, 0, 10_000);
      return `Will the ${pick(parties, k)} win the next ${pick(offices, k)} election in ${pick(states, k)}?`;
    }
    case "Sports": {
      const leagues = ["NBA", "NFL", "MLB", "UFC"] as const;
      const teams = ["Lions", "Tigers", "Falcons", "Bears", "Sharks", "Giants"] as const;
      const k = clamp(index, 0, 10_000);
      return `Will ${pick(teams, k)} beat a rival in the next ${pick(leagues, k)} matchup?`;
    }
    case "Tech": {
      const products = ["LLM", "chip", "framework", "browser", "device"] as const;
      const k = clamp(index, 0, 10_000);
      return `Will a new ${pick(products, k)} release meet its headline performance goal within 90 days?`;
    }
    case "Economy": {
      const metrics = ["inflation", "unemployment", "growth", "consumer confidence", "GDP"] as const;
      const k = clamp(index, 0, 10_000);
      return `Will ${pick(metrics, k)} improve by at least 1 point this quarter?`;
    }
    case "Culture": {
      const media = ["film", "album", "series", "game", "podcast"] as const;
      const k = clamp(index, 0, 10_000);
      return `Will the next ${pick(media, k)} release reach the top 10 within the first week?`;
    }
    default: {
      // Exhaustiveness guard.
      return `Unknown market question #${index}`;
    }
  }
};

const QUESTIONS_PER_CATEGORY = 60;

export const MARKET_QUESTION_DEFS: MarketQuestionDef[] = (() => {
  const out: MarketQuestionDef[] = [];
  for (const category of MARKET_CATEGORIES) {
    for (let i = 0; i < QUESTIONS_PER_CATEGORY; i += 1) {
      const index = out.length;
      const id = `${slugify(category)}-${index}`;
      out.push({
        id,
        category,
        question: buildQuestion(category, i + index),
      });
    }
  }
  return out;
})();

