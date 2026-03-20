import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/kalshi/useKalshiPortfolioPositions", () => ({
  useKalshiPortfolioPositions: () => ({
    rows: [],
    loading: false,
    error: null,
  }),
}));

import { OpenPositionsPanel } from "./OpenPositionsPanel";

describe("OpenPositionsPanel", () => {
  test("renders dummy 10-column table when Kalshi returns no rows", () => {
    const { container } = render(<OpenPositionsPanel />);

    expect(screen.getByText("Avg entry")).toBeInTheDocument();
    expect(screen.getByText("Unrealized PnL")).toBeInTheDocument();

    const rows = container.querySelectorAll('[data-testid^="open-positions-row-"]');
    expect(rows.length).toBe(6);
  });
});

