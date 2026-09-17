"use client";

import type { Option } from "@/components/Differences";
import { Figure, money } from "@/components/Results";
import type { RecommendationValue, Scenario } from "@/lib/state";

interface Props {
  scenarios: Scenario[];
  options: Option[];
  value: RecommendationValue;
  onChange: (next: RecommendationValue) => void;
}

/**
 * The share of the request that has to be allocated before the option stops losing money.
 *
 * It is the figure the whole decision turns on. Fixed costs are spread over the production run,
 * so a bigger run needs a smaller share of it to break even, but risks more when the share does
 * not arrive.
 */
function breakEvenShare(option: Option, request: number): number | null {
  if (option.breakEven === null || request <= 0) return null;
  return option.breakEven / request;
}

/**
 * The chosen strategy, written down beside what it would actually do.
 *
 * The assignment asks for a recommendation, the assumption under it, and an answer to what
 * happens if the trainer allocates fewer sales than hoped. The last of those is a number this
 * page already knows, so it is shown rather than left to be remembered.
 */
export function Recommendation({ scenarios, options, value, onChange }: Props) {
  const index = scenarios.findIndex((s) => s.id === value.scenarioId);
  const chosen = index >= 0 ? scenarios[index] : undefined;
  const outcome = index >= 0 ? options[index] : undefined;
  const share =
    outcome === undefined ? null : breakEvenShare(outcome, chosen?.decision.salesRequest ?? 0);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>My recommendation</h2>
        {chosen !== undefined && <span className="badge ok">{chosen.name}</span>}
      </div>

      <div className="grid">
        <div className="field">
          <label htmlFor="rec">Chosen strategy for Year 2 winter</label>
          <select
            id="rec"
            value={value.scenarioId ?? ""}
            onChange={(e) =>
              onChange({ ...value, scenarioId: e.target.value === "" ? null : e.target.value })
            }
          >
            <option value="">Not chosen yet</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chosen !== undefined && outcome !== undefined && (
        <>
          <p className="lede">
            {chosen.name} requests {money(chosen.decision.salesRequest)} ice creams. It stops losing
            money once the trainer allocates{" "}
            <strong>
              {outcome.breakEven === null ? "more than it can make" : money(outcome.breakEven)}
            </strong>
            {share !== null && <> of them, which is {Math.round(share * 100)}% of the request</>}.
          </p>
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>If the trainer allocates</th>
                  <th className="num">Ice creams</th>
                  <th className="num">Net profit</th>
                  <th className="num">Closing cash</th>
                </tr>
              </thead>
              <tbody>
                {(["pessimistic", "expected", "optimistic"] as const).map((c) => (
                  <tr key={c}>
                    <td>{c}</td>
                    <td className="num">{money(outcome[c].unitsSold)}</td>
                    <td className="num">
                      <Figure value={outcome[c].pnl.netProfit} />
                    </td>
                    <td className="num">
                      <Figure value={outcome[c].cash.closing} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div>
        <label htmlFor="why">Why this strategy</label>
        <textarea
          id="why"
          rows={4}
          placeholder="What this option does that the others do not, in figures from the table above…"
          value={value.why}
          onChange={(e) => onChange({ ...value, why: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="assumption">
          My most important assumption, and what happens if the trainer allocates fewer
        </label>
        <textarea
          id="assumption"
          rows={3}
          placeholder="The one thing that has to be true for this to work, and the figure it costs if it is not…"
          value={value.assumption}
          onChange={(e) => onChange({ ...value, assumption: e.target.value })}
        />
      </div>
    </section>
  );
}
