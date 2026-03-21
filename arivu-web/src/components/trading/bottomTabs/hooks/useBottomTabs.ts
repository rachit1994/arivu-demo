"use client";

import { useState } from "react";

export type TabKey =
  | "open_positions"
  | "orders"
  | "trades"
  | "top_traders"
  | "holders"
  | "news_events";

export const bottomTabMeta: ReadonlyArray<{
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

const getActiveMeta = (key: TabKey) => {
  switch (key) {
    case "open_positions":
      return bottomTabMeta[0];
    case "orders":
      return bottomTabMeta[1];
    case "trades":
      return bottomTabMeta[2];
    case "top_traders":
      return bottomTabMeta[3];
    case "holders":
      return bottomTabMeta[4];
    case "news_events":
      return bottomTabMeta[5];
    default: {
      return bottomTabMeta[0];
    }
  }
};

export const useBottomTabs = (): {
  active: TabKey;
  setActive: (k: TabKey) => void;
  activeMeta: (typeof bottomTabMeta)[number];
  tabButtonClassName: (isSelected: boolean) => string;
} => {
  const [active, setActive] = useState<TabKey>("open_positions");

  const tabButtonClassName = (isSelected: boolean): string => {
    if (isSelected) {
      return "border-emerald-500/60 bg-transparent text-neutral-100";
    }

    return "border-transparent bg-transparent text-neutral-400 hover:text-neutral-200";
  };

  return {
    active,
    setActive,
    activeMeta: getActiveMeta(active),
    tabButtonClassName,
  };
};
