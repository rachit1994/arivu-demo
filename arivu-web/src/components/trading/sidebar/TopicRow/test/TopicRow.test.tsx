import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { TopicRow } from "../index";

describe("TopicRow", () => {
  afterEach(() => {
    cleanup();
  });

  const base = {
    id: "m1",
    category: "Sports",
    coin: "BTC",
    chain: "Base",
    totalVolume: "$1.2M",
    apv: "$50k",
    yesPrice: "45¢",
    noPrice: "55¢",
    isPinned: false,
    onTogglePinned: () => {},
    onSelectMarket: () => {},
  };

  test("reserves a three-line question slot with ellipsis for long copy", () => {
    const longQuestion = "Will this happen? ".repeat(40);
    render(<TopicRow {...base} question={longQuestion} />);

    const slot = screen.getByTestId("topic-row-question-slot");
    expect(slot.className).toContain("h-[3.75rem]");

    const paragraph = slot.querySelector("p");
    expect(paragraph).not.toBeNull();
    expect(paragraph?.className).toContain("line-clamp-3");
  });

  test("card is a div with role=button so pin stays a real button (valid HTML)", () => {
    render(<TopicRow {...base} question="Short?" />);

    const row = screen.getByTestId("market-question-row");
    expect(row.tagName.toLowerCase()).toBe("div");
    expect(row.getAttribute("role")).toBe("button");

    const pin = screen.getByTestId("pin-m1");
    expect(pin.tagName.toLowerCase()).toBe("button");
  });
});
