import { money } from "@/components/Results";
import { remainingLife } from "@/lib/engine/machines";
import type { Position } from "@/lib/engine/types";
import { FORECAST, type Rules } from "@/lib/rules";

interface Props {
  opening: Position;
  rules: Rules;
  annualProfit: number;
}

export function OpeningPosition({ opening, rules, annualProfit }: Props) {
  const lives =
    opening.machines.length === 0
      ? "none"
      : opening.machines.map((m) => `Machine ${m.typeId}: ${remainingLife(m, rules)}`).join(" · ");
  const debt = opening.loans.reduce((sum, loan) => sum + loan.outstanding, 0);

  return (
    <section className="panel">
      <h2>Where you start</h2>
      <div className="scroll-x">
        <table>
          <tbody>
            <tr>
              <td>Closing cash after Year 1</td>
              <td className="num">{money(opening.cash)}</td>
            </tr>
            <tr>
              <td>Machines owned (remaining life, seasons)</td>
              <td className="num">{lives}</td>
            </tr>
            <tr>
              <td>Loans outstanding</td>
              <td className="num">{money(debt)}</td>
            </tr>
            <tr>
              <td>Unused tax losses</td>
              <td className="num">{money(opening.taxLossPool)}</td>
            </tr>
            <tr>
              <td>Year 1 annual profit</td>
              <td className="num">{money(annualProfit)}</td>
            </tr>
            <tr>
              <td>Year 2 winter demand forecast</td>
              <td className="num">{money(FORECAST.year2.winter)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
