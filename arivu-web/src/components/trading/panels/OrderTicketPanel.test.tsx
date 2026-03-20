import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { OrderTicketPanel } from "./OrderTicketPanel";

describe("OrderTicketPanel", () => {
  test("sanitizes numeric inputs and updates estimated cost", () => {
    render(<OrderTicketPanel />);

    const price = screen.getByTestId("ticket-price") as HTMLInputElement;
    const quantity = screen.getByTestId("ticket-quantity") as HTMLInputElement;

    fireEvent.change(price, { target: { value: " 1.5abc " } });
    fireEvent.change(quantity, { target: { value: "2x" } });

    expect(price.value).toBe("1.5");
    expect(quantity.value).toBe("2");
    expect(screen.getByText("$3.00")).toBeInTheDocument();
  });
});

