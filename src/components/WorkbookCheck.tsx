"use client";

import { money, Figure } from "@/components/Results";

interface Props {
  appNetProfit: number;
  appClosingCash: number;
  workbookNetProfit: number | null;
  workbookClosingCash: number | null;
  onChange: (next: { netProfit: number | null; closingCash: number | null }) => void;
}

function Verdict({ app, workbook }: { app: number; workbook: number | null }) {
  if (workbook === null) return <span className="quiet">Waiting for your figure</span>;
  if (app === workbook) return <span className="agrees">Matches</span>;
  return <span className="disagrees">Out by {money(Math.abs(app - workbook))}</span>;
}

/**
 * The season checked against the accounting model I keep by hand.
 *
 * The assignment asks for one real Year 1 season to be entered and reconciled, and it is worth
 * more than the mark: two models built from the same rules that disagree mean one of them is
 * wrong, and until they agree neither is worth deciding from.
 */
export function WorkbookCheck({
  appNetProfit,
  appClosingCash,
  workbookNetProfit,
  workbookClosingCash,
  onChange,
}: Props) {
  const agree = appNetProfit === workbookNetProfit && appClosingCash === workbookClosingCash;
  const both = workbookNetProfit !== null && workbookClosingCash !== null;

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Check against your classroom model</h2>
        {both && (
          <span className={agree ? "badge ok" : "badge bad"}>{agree ? "Agrees" : "Differs"}</span>
        )}
      </div>
      <p className="lede">
        Type winter&rsquo;s figures from my own workbook. This app does not assume what they are.
        Where the two disagree, the difference is worth finding before trusting either.
      </p>

      <div className="grid">
        <div className="field">
          <label htmlFor="wb-profit">Workbook net profit (Sh)</label>
          <input
            id="wb-profit"
            name="workbook-net-profit"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. -75175"
            value={workbookNetProfit ?? ""}
            onChange={(e) =>
              onChange({
                netProfit: e.target.value === "" ? null : Number(e.target.value),
                closingCash: workbookClosingCash,
              })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="wb-cash">Workbook closing cash (Sh)</label>
          <input
            id="wb-cash"
            name="workbook-closing-cash"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 37950"
            value={workbookClosingCash ?? ""}
            onChange={(e) =>
              onChange({
                netProfit: workbookNetProfit,
                closingCash: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Winter</th>
              <th className="num">This app</th>
              <th className="num">Your workbook</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Net profit</td>
              <td className="num">
                <Figure value={appNetProfit} />
              </td>
              <td className="num">
                {workbookNetProfit === null ? "—" : <Figure value={workbookNetProfit} />}
              </td>
              <td>
                <Verdict app={appNetProfit} workbook={workbookNetProfit} />
              </td>
            </tr>
            <tr>
              <td>Closing cash</td>
              <td className="num">
                <Figure value={appClosingCash} />
              </td>
              <td className="num">
                {workbookClosingCash === null ? "—" : <Figure value={workbookClosingCash} />}
              </td>
              <td>
                <Verdict app={appClosingCash} workbook={workbookClosingCash} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
