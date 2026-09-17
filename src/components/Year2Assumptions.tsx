"use client";

import type { Rules } from "@/lib/rules";

/** The Year 2 prices the trainer is most likely to change. */
const EDITABLE = [
  ["unitPrice", "Selling price per ice cream (Sh)"],
  ["milkPricePerTon", "Milk price per ton (Sh)"],
  ["salaries", "Fixed salaries per season (Sh)"],
  ["minMarket", "Minimum market investment (Sh)"],
] as const;

interface Props {
  rules: Rules;
  onChange: (next: Rules) => void;
}

export function Year2Assumptions({ rules, onChange }: Props) {
  return (
    <section className="panel">
      <h2>
        Year 2 assumptions <span className="badge">estimate</span>
      </h2>
      <p>Replace these with the real figures when the trainer publishes the Year 2 rules.</p>
      <div className="grid">
        {EDITABLE.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`y2-${key}`}>{label}</label>
            <input
              id={`y2-${key}`}
              type="number"
              value={rules[key]}
              onChange={(e) => onChange({ ...rules, [key]: Number(e.target.value) })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
