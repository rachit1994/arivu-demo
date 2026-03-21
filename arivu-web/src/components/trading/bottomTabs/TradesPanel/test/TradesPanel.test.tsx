import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/trading/hooks", () => ({
  useKalshiPortfolioFills: () => ({
    rows: [],
    loading: false,
    error: null,
  }),
}));

import { TradesPanel } from "../index";

describe("TradesPanel", () => {
  test("renders dummy 10-column table when Kalshi returns no rows", () => {
    const { container } = render(<TradesPanel />);

    expect(screen.getByText("Liquidity")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();

    const rows = container.querySelectorAll('[data-testid^="trades-row-"]');
    expect(rows.length).toBe(6);
  });
});

