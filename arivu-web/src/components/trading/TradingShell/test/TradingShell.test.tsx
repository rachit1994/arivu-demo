import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TradingShell } from "../index";
import { MockRealtimeProvider } from "@/lib/mockRealtime";

describe("TradingShell", () => {
  test("forces main content to be full width when sidebar is enabled", () => {
    const { container } = render(
      <MockRealtimeProvider>
        <TradingShell showSidebar>{null}</TradingShell>
      </MockRealtimeProvider>,
    );
    const mainEl = container.querySelector("main");
    expect(mainEl).not.toBeNull();
    expect(mainEl?.className).toContain("w-full");
  });

  test("forces main content to be full width when sidebar is disabled", () => {
    const { container } = render(
      <MockRealtimeProvider>
        <TradingShell showSidebar={false}>{null}</TradingShell>
      </MockRealtimeProvider>,
    );
    const mainEl = container.querySelector("main");
    expect(mainEl).not.toBeNull();
    expect(mainEl?.className).toContain("w-full");
  });
});

