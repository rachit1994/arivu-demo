import type { ReactNode } from "react";

import { LeftSidebar } from "../sidebar/LeftSidebar";

interface Props {
  children: ReactNode;
  showSidebar?: boolean;
}

export const TradingShell = ({ children, showSidebar = true }: Props) => {
  return (
    <div className="h-dvh w-full bg-neutral-950 text-neutral-50">
      {showSidebar ? (
        <div className="grid h-full grid-cols-[280px_minmax(0,1fr)]">
          <LeftSidebar />
          <main className="w-full min-h-0 min-w-0">{children}</main>
        </div>
      ) : (
        <main className="w-full h-full min-h-0 min-w-0">{children}</main>
      )}
    </div>
  );
};

