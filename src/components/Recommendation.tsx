"use client";

import type { RecommendationValue, Scenario } from "@/lib/state";

interface Props {
  scenarios: Scenario[];
  value: RecommendationValue;
  onChange: (next: RecommendationValue) => void;
}

export function Recommendation({ scenarios, value, onChange }: Props) {
  return (
    <section className="panel">
      <h2>My recommendation</h2>
      <div>
        <label htmlFor="rec">Chosen option</label>
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
      <div>
        <label htmlFor="why">Why this option</label>
        <textarea
          id="why"
          rows={4}
          value={value.why}
          onChange={(e) => onChange({ ...value, why: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="assumption">
          My most important assumption, and what happens if the trainer allocates fewer sales
        </label>
        <textarea
          id="assumption"
          rows={3}
          value={value.assumption}
          onChange={(e) => onChange({ ...value, assumption: e.target.value })}
        />
      </div>
    </section>
  );
}
