import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/trading/hooks", () => ({
  useKalshiPortfolioOrders: () => ({
    rows: [],
    loading: false,
    error: null,
  }),
}));

import { OrdersPanel } from "../index";

describe("OrdersPanel", () => {
  test("renders dummy 10-column table when Kalshi returns no rows", () => {
    const { container } = render(<OrdersPanel />);

    expect(screen.getByText("Filled")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();

    const rows = container.querySelectorAll('[data-testid^="orders-row-"]');
    expect(rows.length).toBe(6);
  });
});

