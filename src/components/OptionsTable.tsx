import type { Option } from "@/components/Differences";
import { Figure, money } from "@/components/Results";
import { marketBand, shareOfMarket } from "@/lib/engine/market";
import type { SeasonResult } from "@/lib/engine/types";

const CASES = ["pessimistic", "expected", "optimistic"] as const;

const ROWS: Array<[string, (r: SeasonResult) => number]> = [
  ["Ice creams sold", (r) => r.unitsSold],
  ["Net profit", (r) => r.pnl.netProfit],
  ["Closing cash", (r) => r.cash.closing],
  ["Lowest cash at any step", (r) => r.cash.lowest],
  ["Ice cream spoiled", (r) => r.spoiledIceCream],
];

export function OptionsTable({ options, forecast }: { options: Option[]; forecast: number }) {
  const band = marketBand(forecast);
  return (
    <div className="scroll-x">
      <table>
        <thead>
          <tr>
            <th>Measure</th>
            {options.map((option, i) =>
              CASES.map((c) => (
                <th key={`${i}-${c}`} className="num">
                  {option.name}
                  <br />
                  <span className="badge">{c}</span>
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, read]) => (
            <tr key={label}>
              <td>{label}</td>
              {options.map((option, i) =>
                CASES.map((c) => (
                  <td key={`${i}-${c}-${label}`} className="num">
                    <Figure value={read(option[c])} />
                  </td>
                )),
              )}
            </tr>
          ))}
          <tr>
            <td>Share of the forecast market</td>
            {options.map((option, i) =>
              CASES.map((c) => (
                <td key={`${i}-${c}-share`} className="num">
                  {Math.round(shareOfMarket(option[c].unitsSold, band).atForecast * 100)}%
                </td>
              )),
            )}
          </tr>
          <tr>
            <td>Break-even units</td>
            {options.map((option, i) =>
              CASES.map((c) => (
                <td key={`${i}-${c}-be`} className="num">
                  {option.breakEven === null ? "never" : money(option.breakEven)}
                </td>
              )),
            )}
          </tr>
          <tr>
            <td>Blocking problems</td>
            {options.map((option, i) =>
              CASES.map((c) => (
                <td key={`${i}-${c}-flags`} className="num">
                  {option[c].flags.filter((f) => f.severity === "violation").length}
                </td>
              )),
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
