"use client";

import type { Option } from "@/components/Differences";
import { Flags } from "@/components/Flags";
import { Results } from "@/components/Results";
import { SeasonForm } from "@/components/SeasonForm";
import type { MachineCopy } from "@/lib/engine/machines";
import type { Rules } from "@/lib/rules";
import type { Scenario } from "@/lib/state";

const CASES = ["pessimistic", "expected", "optimistic"] as const;

interface Props {
  scenario: Scenario;
  result: Option;
  owned: MachineCopy[];
  rules: Rules;
  onChange: (changes: Partial<Scenario>) => void;
}

export function OptionEditor({ scenario, result, owned, rules, onChange }: Props) {
  return (
    <div>
      <div className="grid">
        <div>
          <label htmlFor="option-name">Option name</label>
          <input
            id="option-name"
            value={scenario.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        {CASES.map((c) => (
          <div key={c}>
            <label htmlFor={`alloc-${c}`}>{c} allocation (units)</label>
            <input
              id={`alloc-${c}`}
              type="number"
              min={0}
              value={scenario.allocations[c]}
              onChange={(e) =>
                onChange({ allocations: { ...scenario.allocations, [c]: Number(e.target.value) } })
              }
            />
          </div>
        ))}
      </div>

      <SeasonForm
        decision={scenario.decision}
        owned={owned}
        rules={rules}
        onChange={(decision) => onChange({ decision })}
      />

      <h3>Rule checks, expected allocation</h3>
      <Flags flags={result.expected.flags} />

      <h3>Full results, expected allocation</h3>
      <Results result={result.expected} />
    </div>
  );
}
