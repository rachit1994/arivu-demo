"use client";

import {
  useTicketOutcomeSegment,
  type TicketOutcomeChoice,
} from "./hooks/useTicketOutcomeSegment";

const getButtonClassName = (isSelected: boolean) => {
  if (isSelected) {
    return "bg-neutral-50 text-neutral-950";
  }
  return "bg-neutral-950 text-neutral-200 hover:bg-neutral-900";
};

interface Props {
  value?: TicketOutcomeChoice;
  onChange?: (next: TicketOutcomeChoice) => void;
}

export const TicketOutcomeSegment = ({ value, onChange }: Props) => {
  const { outcome, setOutcome } = useTicketOutcomeSegment({ value, onChange });

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
