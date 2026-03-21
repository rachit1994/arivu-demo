"use client";

import { useAtom, useSetAtom } from "jotai";

import {
  type TradingTimeframe,
  activeSubaccountAtom,
  activeTimeframeAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";

export const useMarketSubHeader = (): {
  timeframe: TradingTimeframe;
  setTimeframe: (t: TradingTimeframe) => void;
  subaccount: number;
  setSubaccount: (n: number) => void;
  timeframeKeys: readonly TradingTimeframe[];
  subaccounts: readonly [0, 1, 2, 3];
} => {
  const [timeframe] = useAtom(activeTimeframeAtom);
  const setTimeframe = useSetAtom(activeTimeframeAtom);
  const [subaccount] = useAtom(activeSubaccountAtom);
  const setSubaccount = useSetAtom(activeSubaccountAtom);

  const timeframeKeys: readonly TradingTimeframe[] = ["1D", "1W", "1M"];
  const subaccounts: readonly [0, 1, 2, 3] = [0, 1, 2, 3];

  return {
    timeframe,
    setTimeframe,
    subaccount,
    setSubaccount,
    timeframeKeys,
    subaccounts,
  };
};
