import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CandlestickChart } from "../index";

describe("CandlestickChart", () => {
  test("mounts chart container even when candles are empty", () => {
    process.env.NODE_ENV = "test";

    const initialCandles = [];
    const { rerender } = render(
      <CandlestickChart candles={initialCandles} />,
    );

    expect(screen.getByTestId("lw-chart-test-stub")).toBeInTheDocument();
    expect(screen.getByText("Warming_up…")).toBeInTheDocument();

    const nextCandles = [
      { open: 1, high: 2, low: 1, close: 1.5, volume: 10 },
      { open: 1.5, high: 2.5, low: 1.2, close: 2, volume: 20 },
    ];
    rerender(<CandlestickChart candles={nextCandles} />);

    expect(screen.queryByText("Warming_up…")).not.toBeInTheDocument();
    expect(screen.getByText(`${nextCandles.length} candles`)).toBeInTheDocument();
  });
});
