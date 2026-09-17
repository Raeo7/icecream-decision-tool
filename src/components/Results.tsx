import type { SeasonResult } from "@/lib/engine/types";

export function money(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * A figure that shows its own sign.
 *
 * Every table on the page mixes money coming in with money going out, and on a page this dense
 * a minus sign is easy to read past. Colour carries it, and the sign stays in the text so the
 * meaning does not depend on seeing the colour.
 */
export function Figure({ value }: { value: number }) {
  const tone = value > 0 ? "up" : value < 0 ? "down" : "flat";
  return <span className={`figure ${tone}`}>{money(value)}</span>;
}

const PNL: Array<[string, (r: SeasonResult) => number]> = [
  ["Revenue", (r) => r.pnl.revenue],
  ["Milk", (r) => r.pnl.milk],
  ["Maintenance", (r) => r.pnl.maintenance],
  ["Depreciation", (r) => r.pnl.depreciation],
  ["Gross profit", (r) => r.pnl.grossProfit],
  ["Transport", (r) => r.pnl.transport],
  ["Market investment", (r) => r.pnl.marketInvestment],
  ["Bonus", (r) => r.pnl.bonus],
  ["Salaries", (r) => r.pnl.salaries],
  ["Rent", (r) => r.pnl.rent],
  ["Loan interest", (r) => r.pnl.interest],
  ["Profit before tax", (r) => r.pnl.profitBeforeTax],
  ["Game tax", (r) => r.pnl.tax],
  ["Net profit", (r) => r.pnl.netProfit],
];

export function Results({ result }: { result: SeasonResult }) {
  return (
    <div className="grid">
      <div className="scroll-x">
        <h3>Profit and loss</h3>
        <table>
          <tbody>
            {PNL.map(([label, read]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className="num">
                  <Figure value={read(result)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="scroll-x">
        <h3>Cash flow</h3>
        <table>
          <tbody>
            <tr>
              <td>Opening cash</td>
              <td className="num">{money(result.cash.opening)}</td>
            </tr>
            {result.cash.steps.map((step) => (
              <tr key={step.label}>
                <td>{step.label}</td>
                <td className="num">{money(step.movement)}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Closing cash</strong>
              </td>
              <td className="num">
                <strong>{money(result.cash.closing)}</strong>
              </td>
            </tr>
            <tr>
              <td>Lowest cash at any step</td>
              <td className="num">{money(result.cash.lowest)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3>Season</h3>
        <table>
          <tbody>
            <tr>
              <td>Ice creams sold</td>
              <td className="num">{money(result.unitsSold)}</td>
            </tr>
            <tr>
              <td>Ice cream spoiled</td>
              <td className="num">{money(result.spoiledIceCream)}</td>
            </tr>
            <tr>
              <td>Milk unused</td>
              <td className="num">{money(result.unusedMilk)}</td>
            </tr>
            <tr>
              <td>Machine capacity</td>
              <td className="num">{money(result.capacity)}</td>
            </tr>
            <tr>
              <td>Tax losses carried forward</td>
              <td className="num">{money(result.closing.taxLossPool)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
