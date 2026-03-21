"use client";

import { useEffect, useState } from "react";

import { useAtom } from "jotai";

import { useMockRealtime } from "@/lib/mockRealtime";
import { activeMarketQuestionAtom } from "@/lib/trading/state/activeMarketJotaiAtoms";

const ageLabel = (ms: number) => {
  const d = Date.now() - ms;
  switch (true) {
    case d < 1000:
      return `${Math.max(0, d)}ms ago`;
    default:
      return `${(d / 1000).toFixed(1)}s ago`;
  }
};

export const useTradeTopBar = (): {
  updatedAtMs: number;
  mounted: boolean;
  activeMarketQuestion: string | null;
  ageLabel: (ms: number) => string;
} => {
  const { updatedAtMs } = useMockRealtime();
  const [mounted, setMounted] = useState(false);
  const [activeMarketQuestion] = useAtom(activeMarketQuestionAtom);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return { updatedAtMs, mounted, activeMarketQuestion, ageLabel };
};
