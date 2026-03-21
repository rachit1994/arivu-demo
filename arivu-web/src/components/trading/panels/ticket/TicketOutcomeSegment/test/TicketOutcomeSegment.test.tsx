import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TicketOutcomeSegment } from "../index";

describe("TicketOutcomeSegment", () => {
  test("toggles active outcome styling", () => {
    render(<TicketOutcomeSegment />);

    const yes = screen.getByTestId("ticket-outcome-yes");
    const no = screen.getByTestId("ticket-outcome-no");

    expect(yes.getAttribute("aria-pressed")).toBe("true");
    expect(no.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(no);

    expect(no.getAttribute("aria-pressed")).toBe("true");
    expect(yes.getAttribute("aria-pressed")).toBe("false");
  });
});
