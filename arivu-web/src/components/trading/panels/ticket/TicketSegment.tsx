"use client";

import { useState } from "react";

type Side = "BUY" | "SELL";

const getButtonClassName = (isSelected: boolean) => {
  if (isSelected) {
    return "bg-neutral-50 text-neutral-950";
  }
  return "bg-neutral-950 text-neutral-200 hover:bg-neutral-900";
};

interface Props {
  value?: Side;
  onChange?: (next: Side) => void;
}

export const TicketSegment = ({ value, onChange }: Props) => {
  const [internal, setInternal] = useState<Side>("BUY");
  const side = value ?? internal;
  const setSide = (next: Side) => {
    if (onChange) {
      onChange(next);
      return;
    }

    setInternal(next);
  };

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
      <button
        type="button"
        data-testid="ticket-side-buy"
        aria-pressed={side === "BUY"}
        onClick={() => setSide("BUY")}
        className={[
          "cursor-pointer px-3 py-2 text-sm font-semibold transition-colors",
          getButtonClassName(side === "BUY"),
        ].join(" ")}
      >
        Buy
      </button>
      <button
        type="button"
        data-testid="ticket-side-sell"
        aria-pressed={side === "SELL"}
        onClick={() => setSide("SELL")}
        className={[
          "cursor-pointer px-3 py-2 text-sm font-semibold transition-colors",
          getButtonClassName(side === "SELL"),
        ].join(" ")}
      >
        Sell
      </button>
    </div>
  );
};

