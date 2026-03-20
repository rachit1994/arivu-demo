"use client";

import { useState } from "react";

type Outcome = "YES" | "NO";

const getButtonClassName = (isSelected: boolean) => {
  if (isSelected) {
    return "bg-neutral-50 text-neutral-950";
  }
  return "bg-neutral-950 text-neutral-200 hover:bg-neutral-900";
};

interface Props {
  value?: Outcome;
  onChange?: (next: Outcome) => void;
}

export const TicketOutcomeSegment = ({ value, onChange }: Props) => {
  const [internal, setInternal] = useState<Outcome>("YES");
  const outcome = value ?? internal;
  const setOutcome = (next: Outcome) => {
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
        data-testid="ticket-outcome-yes"
        aria-pressed={outcome === "YES"}
        onClick={() => setOutcome("YES")}
        className={[
          "cursor-pointer px-3 py-2 text-sm font-semibold transition-colors",
          getButtonClassName(outcome === "YES"),
        ].join(" ")}
      >
        Yes
      </button>
      <button
        type="button"
        data-testid="ticket-outcome-no"
        aria-pressed={outcome === "NO"}
        onClick={() => setOutcome("NO")}
        className={[
          "cursor-pointer px-3 py-2 text-sm font-semibold transition-colors",
          getButtonClassName(outcome === "NO"),
        ].join(" ")}
      >
        No
      </button>
    </div>
  );
};

