"use client";

import type { ReactElement } from "react";

import { OpenPositionsPanel } from "./OpenPositionsPanel";
import { OrdersPanel } from "./OrdersPanel";
import { TradesPanel } from "./TradesPanel";

import { bottomTabMeta, useBottomTabs } from "./hooks/useBottomTabs";

export const BottomTabs = () => {
  const { active, setActive, activeMeta, tabButtonClassName } = useBottomTabs();

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
        {bottomTabMeta.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            data-testid={t.testIdTab}
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={[
              "cursor-pointer border-b-2 px-1 py-1.5 text-xs font-medium",
              tabButtonClassName(active === t.key),
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
