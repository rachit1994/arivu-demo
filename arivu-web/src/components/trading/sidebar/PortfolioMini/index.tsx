"use client";

import { usePortfolioMini } from "./hooks/usePortfolioMini";

export const PortfolioMini = () => {
  const { portfolio } = usePortfolioMini();

  return (
    <div data-testid="portfolio-mini" className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-neutral-200">Portfolio</div>
      <div className="grid grid-cols-3 gap-2">
        {portfolio.map((r) => (
          <div
            key={r.label}
            className="rounded-md border border-neutral-800 bg-neutral-950 px-2 py-2"
          >
            <div className="text-[10px] text-neutral-500">{r.label}</div>
            <div className="mt-0.5 text-xs font-semibold text-neutral-100">
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
