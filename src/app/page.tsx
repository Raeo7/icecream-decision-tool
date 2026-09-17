"use client";

import { useMemo, useState } from "react";
import { Flags } from "@/components/Flags";
import { Figure, Results } from "@/components/Results";
import { SeasonForm } from "@/components/SeasonForm";
import { WorkbookCheck } from "@/components/WorkbookCheck";
import { runChain } from "@/lib/engine/chain";
import { marketBand } from "@/lib/engine/market";
import { emptyPosition, type Flag } from "@/lib/engine/types";
import { useGame } from "@/lib/GameProvider";
import { FORECAST, STARTING_CASH, YEAR1_RULES } from "@/lib/rules";
import type { SeasonRecord } from "@/lib/state";

/** Whether a season breaks a rule, said in the year table rather than only inside the season. */
function verdict(flags: Flag[]) {
  const broken = flags.filter((f) => f.severity === "violation").length;
  if (broken > 0) {
    return <span className="disagrees">{broken} to fix</span>;
  }
  const warnings = flags.filter((f) => f.severity === "advisory").length;
  if (warnings > 0) return <span className="quiet">{warnings} to look at</span>;
  return <span className="agrees">Legal</span>;
}

export default function Year1Page() {
  const { state, setState, ready } = useGame();
  const [open, setOpen] = useState(0);

  const results = useMemo(
    () =>
      runChain(
        emptyPosition(STARTING_CASH),
        state.year1.map((record) => ({
          decision: record.decision,
          unitsSold: record.unitsSold,
          rules: YEAR1_RULES,
        })),
      ),
    [state.year1],
  );

  const winter = results[0];
  if (!ready || winter === undefined) return <p className="quiet">Loading your game&hellip;</p>;

  const annual = results.reduce((sum, r) => sum + r.pnl.netProfit, 0);

  const update = (index: number, changes: Partial<SeasonRecord>) =>
    setState({
      ...state,
      year1: state.year1.map((r, i) => (i === index ? { ...r, ...changes } : r)),
    });

  return (
    <>
      <h1>Year 1</h1>
      <p className="lede">
        Winter is the season the team played, as recorded in its own workbook. Spring, summer and
        autumn are the team&rsquo;s own projection: fill each one in and the year runs on from the
        position the season before it closed at. What autumn closes at is where the Year 2 tool
        starts.
      </p>

      <section className="panel">
        <h2>The year</h2>
        <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th>Season</th>
                <th>Status</th>
                <th className="num">Forecast</th>
                <th className="num">Sold</th>
                <th className="num">Net profit</th>
                <th className="num">Closing cash</th>
                <th>Rules</th>
              </tr>
            </thead>
            <tbody>
              {state.year1.map((record, index) => (
                <tr key={record.season}>
                  <td>
                    <button
                      className="secondary"
                      aria-current={index === open ? "true" : undefined}
                      onClick={() => setOpen(index)}
                    >
                      {record.season}
                    </button>
                  </td>
                  <td>{record.played ? "played" : "your projection"}</td>
                  <td className="num">{FORECAST.year1[record.season].toLocaleString()}</td>
                  <td className="num">{record.unitsSold.toLocaleString()}</td>
                  <td className="num">
                    <Figure value={results[index]?.pnl.netProfit ?? 0} />
                  </td>
                  <td className="num">
                    <Figure value={results[index]?.cash.closing ?? 0} />
                  </td>
                  <td>{verdict(results[index]?.flags ?? [])}</td>
                </tr>
              ))}
              <tr className="total">
                <td colSpan={4}>Year 1 annual profit</td>
                <td className="num">
                  <Figure value={annual} />
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <WorkbookCheck
        appNetProfit={winter.pnl.netProfit}
        appClosingCash={winter.cash.closing}
        workbookNetProfit={state.verification.netProfit}
        workbookClosingCash={state.verification.closingCash}
        onChange={(verification) => setState({ ...state, verification })}
      />

      {state.year1.map((record, index) => {
        if (index !== open) return null;
        const result = results[index];
        if (result === undefined) return null;

        return (
          <section className="panel" key={record.season}>
            <div className="panel-head">
              <h2>Year 1 {record.season}</h2>
              <span className={record.played ? "badge ok" : "badge"}>
                {record.played ? "Played" : "Your projection"}
              </span>
            </div>
            <p className="lede">
              {record.season} is forecast at {FORECAST.year1[record.season].toLocaleString()}, and
              the real market runs up to 20% either side of that, so anywhere from{" "}
              {marketBand(FORECAST.year1[record.season]).low.toLocaleString()} to{" "}
              {marketBand(FORECAST.year1[record.season]).high.toLocaleString()}. The trainer divides
              it between the six companies, so what you enter below is what you were given, or what
              you expect to be given.
            </p>

            <div className="grid">
              <div className="field">
                <label htmlFor={`played-${index}`}>Has this season been played?</label>
                <select
                  id={`played-${index}`}
                  value={record.played ? "played" : "projected"}
                  onChange={(e) => update(index, { played: e.target.value === "played" })}
                >
                  <option value="projected">Not yet &mdash; this is my projection</option>
                  <option value="played">Played &mdash; this is what happened</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor={`sold-${index}`}>Ice creams allocated by the trainer</label>
                <input
                  id={`sold-${index}`}
                  name={`allocated-${record.season}`}
                  type="number"
                  inputMode="numeric"
                  autoComplete="off"
                  min={0}
                  step={YEAR1_RULES.requestBlock}
                  value={record.unitsSold}
                  onChange={(e) => update(index, { unitsSold: Number(e.target.value) })}
                />
              </div>
            </div>

            <SeasonForm
              decision={record.decision}
              owned={index === 0 ? [] : (results[index - 1]?.closing.machines ?? [])}
              rules={YEAR1_RULES}
              onChange={(decision) => update(index, { decision })}
            />

            <h3>Rule checks</h3>
            <Flags flags={result.flags} />

            <h3>Results</h3>
            <Results result={result} />
          </section>
        );
      })}
    </>
  );
}
