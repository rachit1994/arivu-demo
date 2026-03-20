"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";

import { useKalshiPortfolioPositions } from "@/lib/kalshi/useKalshiPortfolioPositions";
import {
  activeMarketTickerAtom,
  activeSubaccountAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";

type PositionOutcome = "YES" | "NO";
type PositionSide = "Long" | "Short";

type DisplayPositionRow = {
  id: string;
  market: string;
  outcome: PositionOutcome;
  side: PositionSide;
  contracts: string;
  avgEntry: string;
  mark: string;
  unrealizedPnl: string;
  realizedPnl: string;
  feesPaid: string;
  updatedAt: string;
  isDummy: boolean;
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

const formatUsdSigned = (n: number): string => {
  const v = Number.isFinite(n) ? n : 0;
  const sign = v >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
};

const formatPx = (n: number): string => {
  const v = Number.isFinite(n) ? n : 0;
  return v.toFixed(2);
};

const formatInt = (n: number): string =>
  (Number.isFinite(n) ? n : 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const makeDummyPositions = (args: {
  marketTicker: string | null;
  subaccount: number;
  tick: number;
}): DisplayPositionRow[] => {
  const market = args.marketTicker ?? "ev_demo";
  const seedUnit = hashStringToUnit(market);
  const baseMid = clamp(0.62 + (seedUnit - 0.5) * 0.16, 0.08, 0.92);
  const now = Date.now();

  const outcomeByIdx: PositionOutcome[] = ["YES", "NO"];
  const sideByIdx: PositionSide[] = ["Long", "Short"];

  const out: DisplayPositionRow[] = [];
  for (let i = 0; i < 6; i += 1) {
    const phase = args.tick * 0.18 + i * 0.37 + (args.subaccount + i) * 0.04;
    const mark = clamp(baseMid + Math.sin(phase) * 0.04, 0.02, 0.98);
    const avgEntry = clamp(mark - Math.sin(phase * 0.7) * 0.03, 0.02, 0.98);

    const contractsN = 1500 + i * 420 + Math.round(Math.abs(Math.sin(phase)) * 650);
    const contracts = formatInt(contractsN);

    const realized = (Math.sin(phase * 1.2) * 0.5 + 0.5) * 120 - 40;
    const unrealized = (mark - avgEntry) * contractsN * 0.12;
    const fees = Math.abs(Math.cos(phase) * 10) + i;

    const updatedAt = new Date(now - i * 33_000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    out.push({
      id: `dummy-pos-${market}-${args.subaccount}-${args.tick}-${i}`,
      market,
      outcome: outcomeByIdx[i % outcomeByIdx.length]!,
      side: sideByIdx[i % sideByIdx.length]!,
      contracts,
      avgEntry: formatPx(avgEntry),
      mark: formatPx(mark),
      unrealizedPnl: formatUsdSigned(unrealized),
      realizedPnl: formatUsdSigned(realized),
      feesPaid: `${formatUsdSigned(fees).replace("+$", "$")} fees`,
      updatedAt,
      isDummy: true,
    });
  }

  return out;
};

export const OpenPositionsPanel = () => {
  const [marketTicker] = useAtom(activeMarketTickerAtom);
  const [subaccount] = useAtom(activeSubaccountAtom);

  const { rows, loading, error } = useKalshiPortfolioPositions({
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

  const displayRows: DisplayPositionRow[] = useMemo(() => {
    if (showDummy) {
      return makeDummyPositions({ marketTicker, subaccount, tick: dummyTick });
    }

    const outcomeByIdx: PositionOutcome[] = ["YES", "NO"];
    const sideFromContracts = (contracts: string): PositionSide => {
      const numeric = Number(contracts.replaceAll(",", ""));
      return numeric >= 0 ? "Long" : "Short";
    };

    return rows.slice(0, 6).map((r, idx) => ({
      id: `pos-${r.marketTicker}-${idx}`,
      market: r.marketTicker,
      outcome: outcomeByIdx[idx % outcomeByIdx.length]!,
      side: sideFromContracts(r.positionContracts),
      contracts: r.positionContracts,
      avgEntry: "—",
      mark: "—",
      unrealizedPnl: "—",
      realizedPnl: r.realizedPnl,
      feesPaid: r.feesPaid,
      updatedAt: "—",
      isDummy: false,
    }));
  }, [dummyTick, marketTicker, rows, showDummy, subaccount]);

  const paddedRows: DisplayPositionRow[] = useMemo(() => {
    const out: DisplayPositionRow[] = [];
    for (let i = 0; i < 6; i += 1) {
      out.push(
        displayRows[i] ?? {
          id: `pos-placeholder-${i}`,
          market: "—",
          outcome: i % 2 === 0 ? "YES" : "NO",
          side: i % 2 === 0 ? "Long" : "Short",
          contracts: "—",
          avgEntry: "—",
          mark: "—",
          unrealizedPnl: "—",
          realizedPnl: "—",
          feesPaid: "—",
          updatedAt: "—",
          isDummy: true,
        },
      );
    }
    return out;
  }, [displayRows]);

  const overlay: ReactElement | null = loading
    ? (
        <div
          data-testid="open-positions-loading"
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center text-xs text-neutral-500"
        >
          Loading...
        </div>
      )
    : error
      ? (
          <div
            data-testid="open-positions-error"
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
          data-testid={`open-positions-row-${i}`}
          className="grid grid-cols-10 items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5"
        >
          <div className="truncate text-[11px] text-neutral-200">{r.market}</div>
          <div className="text-[11px] text-neutral-200">{r.outcome}</div>
          <div className="text-[11px] text-neutral-200">{r.side}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.contracts}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.avgEntry}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.mark}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.unrealizedPnl}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.realizedPnl}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.feesPaid}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.updatedAt}</div>
        </div>
      ))}
    </>
  );

  return (
    <div data-testid="open-positions-table" className="w-full">
      <div className="grid grid-cols-10 gap-2 text-[11px] text-neutral-500">
        <div>Market</div>
        <div>Outcome</div>
        <div>Side</div>
        <div className="text-right">Contracts</div>
        <div className="text-right">Avg entry</div>
        <div className="text-right">Mark</div>
        <div className="text-right">Unrealized PnL</div>
        <div className="text-right">Realized PnL</div>
        <div className="text-right">Fees</div>
        <div className="text-right">Updated</div>
      </div>
      <div className="mt-2 relative flex flex-col gap-1">
        {body}
        {overlay}
      </div>
    </div>
  );
};

