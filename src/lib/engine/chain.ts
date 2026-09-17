import { runSeason } from "@/lib/engine/season";
import type { Decision, Position, SeasonResult } from "@/lib/engine/types";
import type { Rules } from "@/lib/rules";

export interface ChainEntry {
  decision: Decision;
  unitsSold: number;
  rules: Rules;
}

/** Runs seasons in order, each opening from the previous season's closing position. */
export function runChain(start: Position, entries: ChainEntry[]): SeasonResult[] {
  const results: SeasonResult[] = [];
  let position = start;
  for (const entry of entries) {
    const result = runSeason(position, entry.decision, entry.unitsSold, entry.rules);
    results.push(result);
    position = result.closing;
  }
  return results;
}
