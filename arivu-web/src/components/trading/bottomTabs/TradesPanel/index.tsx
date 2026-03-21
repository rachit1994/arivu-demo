"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";

import { useKalshiPortfolioFills } from "@/lib/trading/hooks";
import {
  activeMarketTickerAtom,
  activeSubaccountAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";

type TradeOutcome = "YES" | "NO";
type TradeAction = "BUY" | "SELL";
type TradeRole = "Maker" | "Taker";

type DisplayTradeRow = {
  id: string;
  fillId: string;
  date: string;
  market: string;
  outcome: TradeOutcome;
  action: TradeAction;
  price: string;
  count: string;
  fee: string;
  role: TradeRole;
  liquidity: string;
};

const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, n));

const hashStringToUnit = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.codePointAt(i) ?? 0;
    h = (h * 16777619) >>> 0;
  }
  return (h % 10_000) / 10_000;
};

const formatUsd = (n: number): string => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
const formatInt = (n: number): string =>
  (Number.isFinite(n) ? n : 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const formatTime = (ms: number): string =>
  new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const makeDummyTrades = (args: {
  marketTicker: string | null;
  subaccount: number;
  tick: number;
}): DisplayTradeRow[] => {
  const market = args.marketTicker ?? "ev_demo";
  const seedUnit = hashStringToUnit(market);
  const baseMid = clamp(0.62 + (seedUnit - 0.5) * 0.16, 0.08, 0.92);
  const now = Date.now();

  const outcomeByIdx: TradeOutcome[] = ["YES", "NO"];
  const actionByIdx: TradeAction[] = ["BUY", "SELL"];
  const roles: TradeRole[] = ["Maker", "Taker"];
  const liquidityLevels = ["High", "Med", "Low"] as const;

  const out: DisplayTradeRow[] = [];
  for (let i = 0; i < 6; i += 1) {
    const phase = args.tick * 0.22 + i * 0.29 + args.subaccount * 0.07;
    const outcome = outcomeByIdx[i % 2]!;
    const action = actionByIdx[i % 2]!;
    const role = roles[i % 2]!;

    const price = clamp(
      baseMid + Math.sin(phase) * 0.03 + (i - 2) * 0.008,
      0.02,
      0.98,
    );
    const countN = 60 + i * 15 + Math.round(Math.abs(Math.cos(phase)) * 90);
    const feeN = 0.02 * countN + Math.abs(Math.sin(phase * 0.4)) * 0.25;

    const liqIdx = clamp(Math.round(Math.abs(Math.sin(phase)) * 2), 0, 2);
    const liquidity = liquidityLevels[liqIdx]!;

    out.push({
      id: `dummy-tr-${market}-${args.subaccount}-${args.tick}-${i}`,
      fillId: `fill_${market}_${args.subaccount}_${args.tick}_${i}`,
      date: formatTime(now - i * 58_000),
      market,
      outcome,
      action,
      price: formatUsd(price),
      count: formatInt(countN),
      fee: formatUsd(feeN),
      role,
      liquidity,
    });
  }

  return out;
};

export const TradesPanel = () => {
  const [marketTicker] = useAtom(activeMarketTickerAtom);
  const [subaccount] = useAtom(activeSubaccountAtom);

  const { rows, loading, error } = useKalshiPortfolioFills({
    ticker: marketTicker,
    subaccount,
  });

  const showDummy = !loading && !error && rows.length === 0;
  const [dummyTick, setDummyTick] = useState(0);

  useEffect(() => {
    if (!showDummy) return;
    if (process.env.NODE_ENV === "test") return;

    const id = globalThis.setInterval(() => {
      setDummyTick((t) => t + 1);
    }, 1500);

    return () => globalThis.clearInterval(id);
  }, [showDummy, marketTicker, subaccount]);

  const displayRows: DisplayTradeRow[] = useMemo(() => {
    if (showDummy) {
      return makeDummyTrades({ marketTicker, subaccount, tick: dummyTick });
    }

    return rows.slice(0, 6).map((r, idx) => ({
      id: `tr-${r.fillId}-${idx}`,
      fillId: r.fillId,
      date: r.date,
      market: marketTicker ?? "—",
      outcome: r.side,
      action: r.action,
      price: r.price,
      count: r.count,
      fee: r.fee,
      role: "Taker",
      liquidity: "—",
    }));
  }, [dummyTick, marketTicker, rows, showDummy, subaccount]);

  const paddedRows: DisplayTradeRow[] = useMemo(() => {
    const out: DisplayTradeRow[] = [];
    for (let i = 0; i < 6; i += 1) {
      out.push(
        displayRows[i] ?? {
          id: `tr-placeholder-${i}`,
          fillId: "—",
          date: "—",
          market: "—",
          outcome: i % 2 === 0 ? "YES" : "NO",
          action: i % 2 === 0 ? "BUY" : "SELL",
          price: "—",
          count: "—",
          fee: "—",
          role: "Maker",
          liquidity: "—",
        },
      );
    }
    return out;
  }, [displayRows]);

  const overlay: ReactElement | null = loading
    ? (
        <div
          data-testid="trades-loading"
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center text-xs text-neutral-500"
        >
          Loading...
        </div>
      )
    : error
      ? (
          <div
            data-testid="trades-error"
            className="pointer-events-none absolute inset-x-0 top-0 flex justify-center text-xs text-rose-400"
          >
            {error}
          </div>
        )
      : null;

  const body = (
    <>
      {paddedRows.map((r, i) => (
        <div
          key={r.id}
          data-testid={`trades-row-${i}`}
          className="grid grid-cols-10 items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5"
        >
          <div className="truncate text-[11px] text-neutral-200">{r.fillId}</div>
          <div className="truncate text-[11px] text-neutral-200">{r.market}</div>
          <div className="text-[11px] text-neutral-200">{r.outcome}</div>
          <div className="text-[11px] text-neutral-200">{r.action}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.price}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.count}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.fee}</div>
          <div className="text-[11px] text-neutral-200">{r.date}</div>
          <div className="text-[11px] text-neutral-200">{r.role}</div>
          <div className="text-[11px] text-neutral-200">{r.liquidity}</div>
        </div>
      ))}
    </>
  );

  return (
    <div data-testid="trades-table" className="w-full">
      <div className="grid grid-cols-10 gap-2 text-[11px] text-neutral-500">
        <div>Fill</div>
        <div>Market</div>
        <div>Outcome</div>
        <div>Action</div>
        <div className="text-right">Price</div>
        <div className="text-right">Count</div>
        <div className="text-right">Fee</div>
        <div>Date</div>
        <div>Role</div>
        <div>Liquidity</div>
      </div>
      <div className="mt-2 relative flex flex-col gap-1">
        {body}
        {overlay}
      </div>
    </div>
  );
};

