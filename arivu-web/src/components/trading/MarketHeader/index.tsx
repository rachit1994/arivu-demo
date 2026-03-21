export const MarketHeader = () => {
  return (
    <div
      data-testid="market-header"
      className="flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-3 py-3"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-neutral-100">
          Market
        </div>
        <div className="truncate text-xs text-neutral-500">
          Header stats (placeholder)
        </div>
      </div>
      <div className="shrink-0 text-xs text-neutral-500">
        Last updated just now
      </div>
    </div>
  );
};

