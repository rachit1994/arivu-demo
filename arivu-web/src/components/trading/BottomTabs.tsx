"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { OpenPositionsPanel } from "./bottomTabs/OpenPositionsPanel";
import { OrdersPanel } from "./bottomTabs/OrdersPanel";
import { TradesPanel } from "./bottomTabs/TradesPanel";

type TabKey =
  | "open_positions"
  | "orders"
  | "trades"
  | "top_traders"
  | "holders"
  | "news_events";

const tabMeta: ReadonlyArray<{
  key: TabKey;
  testIdTab: string;
  testIdContent: string;
  label: string;
}> = [
  {
    key: "open_positions",
    testIdTab: "tab-open-positions",
    testIdContent: "tab-content-open-positions",
    label: "Open positions",
  },
  {
    key: "orders",
    testIdTab: "tab-orders",
    testIdContent: "tab-content-orders",
    label: "Orders",
  },
  {
    key: "trades",
    testIdTab: "tab-trades",
    testIdContent: "tab-content-trades",
    label: "Trades",
  },
  {
    key: "top_traders",
    testIdTab: "tab-top-traders",
    testIdContent: "tab-content-top-traders",
    label: "Top Traders",
  },
  {
    key: "holders",
    testIdTab: "tab-holders",
    testIdContent: "tab-content-holders",
    label: "Holders",
  },
  {
    key: "news_events",
    testIdTab: "tab-news-events",
    testIdContent: "tab-content-news-events",
    label: "News & Events",
  },
];

export const BottomTabs = () => {
  const [active, setActive] = useState<TabKey>("open_positions");

  const getActiveMeta = (key: TabKey) => {
    switch (key) {
      case "open_positions":
        return tabMeta[0];
      case "orders":
        return tabMeta[1];
      case "trades":
        return tabMeta[2];
      case "top_traders":
        return tabMeta[3];
      case "holders":
        return tabMeta[4];
      case "news_events":
        return tabMeta[5];
      default: {
        return tabMeta[0];
      }
    }
  };

  const getButtonClassName = (isSelected: boolean): string => {
    if (isSelected) {
      return "border-emerald-500/60 bg-transparent text-neutral-100";
    }

    return "border-transparent bg-transparent text-neutral-400 hover:text-neutral-200";
  };

  const activeMeta = getActiveMeta(active);

  let content: ReactElement | null = null;
  switch (active) {
    case "open_positions":
      content = <OpenPositionsPanel />;
      break;
    case "orders":
      content = <OrdersPanel />;
      break;
    case "trades":
      content = <TradesPanel />;
      break;
    case "top_traders":
      content = (
        <div>
          Top traders (placeholder)
        </div>
      );
      break;
    case "holders":
      content = (
        <div>
          Holders (placeholder)
        </div>
      );
      break;
    case "news_events":
      content = (
        <div>
          News & events (placeholder)
        </div>
      );
      break;
    default: {
      break;
    }
  }

  return (
    <div role="tablist" data-testid="bottom-tabs" className="mt-2 w-full">
      <div className="grid grid-cols-6 gap-0">
        {tabMeta.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            data-testid={t.testIdTab}
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={[
              "cursor-pointer border-b-2 px-1 py-1.5 text-xs font-medium",
              getButtonClassName(active === t.key),
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        data-testid="bottom-tabs-content"
        className="mt-0 h-[260px] overflow-hidden border border-neutral-800 bg-neutral-950 px-3 py-3"
      >
        <div data-testid={activeMeta.testIdContent} className="h-full overflow-hidden">
          {content}
        </div>
      </div>
    </div>
  );
};

