import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/trading/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/trading/hooks")>();
  return {
    ...actual,
    useKalshiPortfolioPositions: () => ({
      rows: [],
      loading: true,
      error: null,
    }),
    useKalshiPortfolioOrders: () => ({
      rows: [],
      loading: true,
      error: null,
    }),
    useKalshiPortfolioFills: () => ({
      rows: [],
      loading: true,
      error: null,
    }),
  };
});

import { BottomTabs } from "../index";

describe("BottomTabs", () => {
  const countRows = (selectorPrefix: string): number =>
    document.querySelectorAll(`[data-testid^="${selectorPrefix}"]`).length;

  test("keeps fixed height and renders padded rows while loading", () => {
    render(<BottomTabs />);

    const content = screen.getByTestId("bottom-tabs-content");
    expect(content.className).toContain("h-[260px]");

    expect(screen.getByTestId("open-positions-loading")).toBeInTheDocument();
    expect(countRows("open-positions-row-")).toBe(6);

    fireEvent.click(screen.getByTestId("tab-orders"));
    expect(screen.getByTestId("orders-loading")).toBeInTheDocument();
    expect(countRows("orders-row-")).toBe(6);

    fireEvent.click(screen.getByTestId("tab-trades"));
    expect(screen.getByTestId("trades-loading")).toBeInTheDocument();
    expect(countRows("trades-row-")).toBe(6);
  });
});
