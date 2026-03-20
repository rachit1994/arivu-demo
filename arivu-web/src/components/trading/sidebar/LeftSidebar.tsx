"use client";

import { PortfolioMini } from "./PortfolioMini";
import { SidebarHeader } from "./SidebarHeader";
import { TopicList } from "./TopicList";

export const LeftSidebar = () => {
  return (
    <aside
      data-testid="left-sidebar"
      className="flex h-full min-h-0 flex-col border-r border-neutral-800 bg-neutral-950"
    >
      <SidebarHeader />
      <div className="min-h-0 flex-1 overflow-auto">
        <TopicList />
      </div>
      <div className="border-t border-neutral-800 p-3">
        <PortfolioMini />
      </div>
    </aside>
  );
};

