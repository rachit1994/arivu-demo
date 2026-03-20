import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TicketSegment } from "./TicketSegment";

describe("TicketSegment", () => {
  test("toggles active side styling", () => {
    render(<TicketSegment />);

    const buy = screen.getByTestId("ticket-side-buy");
    const sell = screen.getByTestId("ticket-side-sell");

    expect(buy.getAttribute("aria-pressed")).toBe("true");
    expect(sell.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(sell);

    expect(sell.getAttribute("aria-pressed")).toBe("true");
    expect(buy.getAttribute("aria-pressed")).toBe("false");
  });
});

