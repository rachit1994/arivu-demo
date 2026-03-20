"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";

import { useKalshiPortfolioOrders } from "@/lib/kalshi/useKalshiPortfolioOrders";
import {
  activeMarketTickerAtom,
  activeSubaccountAtom,
} from "@/lib/trading/state/activeMarketJotaiAtoms";

type OrderOutcome = "YES" | "NO";
type OrderAction = "BUY" | "SELL";
type OrderType = "Limit";

type DisplayOrderRow = {
  id: string;
  orderId: string;
  market: string;
  outcome: OrderOutcome;
  action: OrderAction;
  type: OrderType;
  price: string;
  filled: string;
  remaining: string;
  status: string;
  createdAt: string;
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

const makeDummyOrders = (args: {
  marketTicker: string | null;
  subaccount: number;
  tick: number;
}): DisplayOrderRow[] => {
  const market = args.marketTicker ?? "ev_demo";
  const seedUnit = hashStringToUnit(market);
  const baseMid = clamp(0.62 + (seedUnit - 0.5) * 0.16, 0.08, 0.92);
  const now = Date.now();

  const outcomeByIdx: OrderOutcome[] = ["YES", "NO"];
  const actionByIdx: OrderAction[] = ["BUY", "SELL"];
  const statuses = ["Resting", "Partial", "Executed"] as const;

  const out: DisplayOrderRow[] = [];
  for (let i = 0; i < 6; i += 1) {
    const phase = args.tick * 0.2 + i * 0.33 + args.subaccount * 0.05;
    const outcome = outcomeByIdx[i % 2]!;
    const action = actionByIdx[i % 2]!;

    const price = clamp(
      baseMid + (i - 2) * 0.01 + Math.sin(phase) * 0.012,
      0.02,
      0.98,
    );
    const total = 800 + i * 240 + Math.round(Math.abs(Math.cos(phase)) * 520);
    const filledN = Math.round(
      total * clamp(0.15 + Math.sin(phase * 0.7) * 0.35 + 0.4, 0, 1),
    );
    const remainingN = Math.max(0, total - filledN);

    const ratio = total > 0 ? filledN / total : 0;
    let status: (typeof statuses)[number];
    switch (true) {
      case ratio > 0.85:
        status = statuses[2]!;
        break;
      case ratio > 0.25:
        status = statuses[1]!;
        break;
      default:
        status = statuses[0]!;
    }

    out.push({
      id: `dummy-ord-${market}-${args.subaccount}-${args.tick}-${i}`,
      orderId: `ord_${market}_${args.subaccount}_${args.tick}_${i}`,
      market,
      outcome,
      action,
      type: "Limit",
      price: formatUsd(price),
      filled: formatInt(filledN),
      remaining: formatInt(remainingN),
      status,
      createdAt: formatTime(now - i * 72_000),
    });
  }

  return out;
};

export const OrdersPanel = () => {
  const [marketTicker] = useAtom(activeMarketTickerAtom);
  const [subaccount] = useAtom(activeSubaccountAtom);

  const { rows, loading, error } = useKalshiPortfolioOrders({
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

  const displayRows: DisplayOrderRow[] = useMemo(() => {
    if (showDummy) {
      return makeDummyOrders({ marketTicker, subaccount, tick: dummyTick });
    }

    return rows.slice(0, 6).map((r, idx) => ({
      id: `ord-${r.orderId}-${idx}`,
      orderId: r.orderId,
      market: marketTicker ?? "—",
      outcome: r.side,
      action: r.action,
      type: "Limit",
      price: r.price,
      filled: "—",
      remaining: r.remaining,
      status: r.status,
      createdAt: "—",
    }));
  }, [dummyTick, marketTicker, rows, showDummy, subaccount]);

  const paddedRows: DisplayOrderRow[] = useMemo(() => {
    const out: DisplayOrderRow[] = [];
    for (let i = 0; i < 6; i += 1) {
      out.push(
        displayRows[i] ?? {
          id: `ord-placeholder-${i}`,
          orderId: "—",
          market: "—",
          outcome: i % 2 === 0 ? "YES" : "NO",
          action: i % 2 === 0 ? "BUY" : "SELL",
          type: "Limit",
          price: "—",
          filled: "—",
          remaining: "—",
          status: "—",
          createdAt: "—",
        },
      );
    }
    return out;
  }, [displayRows]);

  const overlay: ReactElement | null = loading
    ? (
        <div
          data-testid="orders-loading"
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center text-xs text-neutral-500"
        >
          Loading...
        </div>
      )
    : error
      ? (
          <div
            data-testid="orders-error"
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
          data-testid={`orders-row-${i}`}
          className="grid grid-cols-10 items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5"
        >
          <div className="truncate text-[11px] text-neutral-200">{r.orderId}</div>
          <div className="truncate text-[11px] text-neutral-200">{r.market}</div>
          <div className="text-[11px] text-neutral-200">{r.outcome}</div>
          <div className="text-[11px] text-neutral-200">{r.action}</div>
          <div className="text-[11px] text-neutral-200">{r.type}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.price}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.filled}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.remaining}</div>
          <div className="text-[11px] text-neutral-200">{r.status}</div>
          <div className="text-right text-[11px] text-neutral-200 tabular-nums">{r.createdAt}</div>
        </div>
      ))}
    </>
  );

  return (
    <div data-testid="orders-table" className="w-full">
      <div className="grid grid-cols-10 gap-2 text-[11px] text-neutral-500">
        <div>Order</div>
        <div>Market</div>
        <div>Outcome</div>
        <div>Action</div>
        <div>Type</div>
        <div className="text-right">Price</div>
        <div className="text-right">Filled</div>
        <div className="text-right">Remaining</div>
        <div>Status</div>
        <div className="text-right">Created</div>
      </div>
      <div className="mt-2 relative flex flex-col gap-1">
        {body}
        {overlay}
      </div>
    </div>
  );
};

