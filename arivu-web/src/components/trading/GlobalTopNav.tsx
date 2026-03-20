export const GlobalTopNav = () => {
  return (
    <header
      data-testid="global-top-nav"
      className="flex h-14 items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950 px-4"
    >
      <div className="flex items-center gap-7 text-xs text-neutral-400">
        <a className="hover:text-neutral-200" href="#">
          Discover
        </a>
        <a className="hover:text-neutral-200" href="#">
          Portfolio
        </a>
        <a className="hover:text-neutral-200" href="#">
          Wallet tracker
        </a>
        <a className="hover:text-neutral-200" href="#">
          Leaderboard
        </a>
        <a className="hover:text-neutral-200" href="#">
          Watchlist
        </a>
        <a className="hover:text-neutral-200" href="#">
          Referrals
        </a>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-500 md:flex">
          <input
            type="text"
            aria-label="Search markets"
            placeholder="Search markets..."
            className="w-64 bg-transparent text-xs text-neutral-200 outline-none"
          />
        </div>

        <button
          type="button"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-50 hover:bg-neutral-800"
        >
          Deposit
        </button>
      </div>
    </header>
  );
};

