"use client";

import { useState } from "react";

export type TicketSide = "BUY" | "SELL";

interface Args {
  value?: TicketSide;
  onChange?: (next: TicketSide) => void;
}

export const useTicketSegmentSide = ({
  value,
  onChange,
}: Args): {
  side: TicketSide;
  setSide: (next: TicketSide) => void;
} => {
  const [internal, setInternal] = useState<TicketSide>("BUY");
  const side = value ?? internal;
  const setSide = (next: TicketSide) => {
    if (onChange) {
      onChange(next);
      return;
    }

    setInternal(next);
  };
  return { side, setSide };
};
