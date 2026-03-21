"use client";

import { useState } from "react";

export type TicketOutcomeChoice = "YES" | "NO";

interface Args {
  value?: TicketOutcomeChoice;
  onChange?: (next: TicketOutcomeChoice) => void;
}

export const useTicketOutcomeSegment = ({
  value,
  onChange,
}: Args): {
  outcome: TicketOutcomeChoice;
  setOutcome: (next: TicketOutcomeChoice) => void;
} => {
  const [internal, setInternal] = useState<TicketOutcomeChoice>("YES");
  const outcome = value ?? internal;
  const setOutcome = (next: TicketOutcomeChoice) => {
    if (onChange) {
      onChange(next);
      return;
    }

    setInternal(next);
  };
  return { outcome, setOutcome };
};
