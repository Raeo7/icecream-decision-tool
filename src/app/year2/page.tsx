"use client";

import { useState } from "react";
import { Differences, type Option } from "@/components/Differences";
import { OpeningPosition } from "@/components/OpeningPosition";
import { OptionEditor } from "@/components/OptionEditor";
import { OptionsTable } from "@/components/OptionsTable";
import { Recommendation } from "@/components/Recommendation";
import { Year2Assumptions } from "@/components/Year2Assumptions";
import { runChain } from "@/lib/engine/chain";
import { breakEvenUnits } from "@/lib/engine/breakeven";
import { runSeason } from "@/lib/engine/season";
import { blankDecision, emptyPosition } from "@/lib/engine/types";
import { useGame } from "@/lib/GameProvider";
import { FORECAST, STARTING_CASH, YEAR1_RULES } from "@/lib/rules";
import { playedCount, type GameState, type Scenario } from "@/lib/state";

function withNewOption(state: GameState): GameState {
  return {
    ...state,
    scenarios: [
      ...state.scenarios,
      {
        id: `s${state.scenarios.length + 1}`,
        name: `Option ${String.fromCharCode(65 + state.scenarios.length)}`,
        decision: state.scenarios[0]?.decision ?? blankDecision(),
        allocations: { pessimistic: 0, expected: 0, optimistic: 0 },
      },
    ],
  };
}

export default function Year2Page() {
  const { state, setState, ready } = useGame();
  const [open, setOpen] = useState(0);

  const year1 = runChain(
    emptyPosition(STARTING_CASH),
    state.year1.map((record) => ({
      decision: record.decision,
      unitsSold: record.unitsSold,
      rules: YEAR1_RULES,
    })),
  );
  // Year 2 opens on what the company actually is, which is the last season it has really played.
  // Seasons the team has only projected are not carried in as though they had happened.
  const played = playedCount(state.year1);
  const opening =
    (played > 0 ? year1[played - 1]?.closing : undefined) ?? emptyPosition(STARTING_CASH);
  const rules = state.year2Rules;

  if (!ready) return <p className="quiet">Loading your game&hellip;</p>;

  const options: Option[] = state.scenarios.map((scenario) => ({
    name: scenario.name,
    breakEven: breakEvenUnits(opening, scenario.decision, rules),
    pessimistic: runSeason(opening, scenario.decision, scenario.allocations.pessimistic, rules),
    expected: runSeason(opening, scenario.decision, scenario.allocations.expected, rules),
    optimistic: runSeason(opening, scenario.decision, scenario.allocations.optimistic, rules),
  }));

  const update = (index: number, changes: Partial<Scenario>) =>
    setState({
      ...state,
      scenarios: state.scenarios.map((s, i) => (i === index ? { ...s, ...changes } : s)),
    });

  const scenario = state.scenarios[open];
  const result = options[open];

  return (
    <>
      <h1>Year 2 winter</h1>
      <p className="advisory">
        The Year 2 rules are not published yet, so every price below is a Year 1 figure carried
        forward as an estimate. The opening position is where Year 1 stands after the {played}{" "}
        {played === 1 ? "season" : "seasons"} actually played, not after a full year, so compare the
        options against each other rather than against reality.
      </p>

      <OpeningPosition
        opening={opening}
        rules={rules}
        annualProfit={year1.slice(0, played).reduce((sum, r) => sum + r.pnl.netProfit, 0)}
      />

      <Year2Assumptions
        rules={rules}
        onChange={(year2Rules) => setState({ ...state, year2Rules })}
      />

      <section className="panel">
        <h2>The options</h2>
        <OptionsTable options={options} forecast={FORECAST.year2.winter} />
      </section>

      <section className="panel">
        <h2>What differs between two options</h2>
        <Differences options={options} />
      </section>

      <section className="panel">
        <h2>Edit an option</h2>
        <div className="grid">
          {state.scenarios.map((s, index) => (
            <button
              key={s.id}
              className={index === open ? "" : "secondary"}
              onClick={() => setOpen(index)}
            >
              {s.name}
            </button>
          ))}
          <button className="secondary" onClick={() => setState(withNewOption(state))}>
            Add an option
          </button>
        </div>

        {scenario !== undefined && result !== undefined && (
          <OptionEditor
            scenario={scenario}
            result={result}
            owned={opening.machines}
            rules={rules}
            onChange={(changes) => update(open, changes)}
          />
        )}
      </section>

      <Recommendation
        scenarios={state.scenarios}
        options={options}
        value={state.recommendation}
        onChange={(recommendation) => setState({ ...state, recommendation })}
      />
    </>
  );
}
