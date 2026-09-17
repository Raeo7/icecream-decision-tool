"use client";

import { useState } from "react";
import { money } from "@/components/Results";
import type { SeasonResult } from "@/lib/engine/types";

export interface Option {
  name: string;
  /** Depends on the plan, not on how much the trainer allocates, so it sits on the option. */
  breakEven: number | null;
  pessimistic: SeasonResult;
  expected: SeasonResult;
  optimistic: SeasonResult;
}

type CaseName = "pessimistic" | "expected" | "optimistic";
const CASES: CaseName[] = ["pessimistic", "expected", "optimistic"];

const LINES: Array<[string, (r: SeasonResult) => number]> = [
  ["Sales revenue", (r) => r.pnl.revenue],
  ["Milk bought", (r) => r.pnl.milk],
  ["Machine maintenance", (r) => r.pnl.maintenance],
  ["Machine depreciation", (r) => r.pnl.depreciation],
  ["Transport", (r) => r.pnl.transport],
  ["Market investment", (r) => r.pnl.marketInvestment],
  ["Premise rent", (r) => r.pnl.rent],
  ["Loan interest", (r) => r.pnl.interest],
  ["Bonus", (r) => r.pnl.bonus],
  ["Salaries", (r) => r.pnl.salaries],
  ["Game tax", (r) => r.pnl.tax],
];

const UNITS: Array<[string, (r: SeasonResult) => number]> = [
  ["Ice creams allocated and sold", (r) => r.unitsSold],
  ["Ice cream spoiled", (r) => r.spoiledIceCream],
  ["Milk left unused", (r) => r.unusedMilk],
];

function signed(value: number): string {
  return value > 0 ? `+${money(value)}` : money(value);
}

export function Differences({ options }: { options: Option[] }) {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(1);
  const [caseName, setCaseName] = useState<CaseName>("expected");

  const a = options[left];
  const b = options[right];
  if (a === undefined || b === undefined) return <p className="badge">Add a second option</p>;

  const ra = a[caseName];
  const rb = b[caseName];
  const rows = LINES.map(([label, read]) => ({
    label,
    a: read(ra),
    b: read(rb),
    delta: read(rb) - read(ra),
  }));
  const biggest = rows.reduce((worst, row) =>
    Math.abs(row.delta) > Math.abs(worst.delta) ? row : worst,
  );
  const netDelta = rb.pnl.netProfit - ra.pnl.netProfit;
  const cashDelta = rb.cash.closing - ra.cash.closing;

  return (
    <div>
      <div className="grid">
        <div>
          <label htmlFor="d-left">Option</label>
          <select id="d-left" value={left} onChange={(e) => setLeft(Number(e.target.value))}>
            {options.map((option, i) => (
              <option key={`${i}-${option.name}`} value={i}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="d-right">compared with</label>
          <select id="d-right" value={right} onChange={(e) => setRight(Number(e.target.value))}>
            {options.map((option, i) => (
              <option key={`${i}-${option.name}`} value={i}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="d-case">If the trainer allocates</label>
          <select
            id="d-case"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value as CaseName)}
          >
            {CASES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p>
        If the trainer allocates the <strong>{caseName}</strong> figure, <strong>{b.name}</strong>{" "}
        makes <strong>Sh {signed(netDelta)}</strong> net profit against {a.name} and closes with{" "}
        <strong>Sh {signed(cashDelta)}</strong> cash. The largest single difference is{" "}
        <strong>{biggest.label.toLowerCase()}</strong>, at Sh {signed(biggest.delta)}.
      </p>

      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th className="num">{a.name}</th>
              <th className="num">{b.name}</th>
              <th className="num">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="num">{money(row.a)}</td>
                <td className="num">{money(row.b)}</td>
                <td className="num">{row.delta === 0 ? "same" : signed(row.delta)}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Net profit</strong>
              </td>
              <td className="num">{money(ra.pnl.netProfit)}</td>
              <td className="num">{money(rb.pnl.netProfit)}</td>
              <td className="num">
                <strong>{netDelta === 0 ? "same" : signed(netDelta)}</strong>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Closing cash</strong>
              </td>
              <td className="num">{money(ra.cash.closing)}</td>
              <td className="num">{money(rb.cash.closing)}</td>
              <td className="num">
                <strong>{cashDelta === 0 ? "same" : signed(cashDelta)}</strong>
              </td>
            </tr>
            {UNITS.map(([label, read]) => (
              <tr key={label}>
                <td>{label} (units)</td>
                <td className="num">{money(read(ra))}</td>
                <td className="num">{money(read(rb))}</td>
                <td className="num">
                  {read(rb) - read(ra) === 0 ? "same" : signed(read(rb) - read(ra))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="badge">
        This subtracts one option from the other. It reports what differs, not which is wiser.
      </p>
    </div>
  );
}
