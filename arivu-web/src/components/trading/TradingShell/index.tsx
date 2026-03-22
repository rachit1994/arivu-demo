/**
 * App chrome for trading: fixed **280px** left rail + fluid main. `min-w-0` on `<main>`
 * is required so grid children can shrink — without it, wide charts overflow horizontally.
 *
 * `showSidebar` supports compact layouts/tests that mount only the main column.
 */
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

