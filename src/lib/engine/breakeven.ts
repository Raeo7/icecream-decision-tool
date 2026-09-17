import { runSeason } from "@/lib/engine/season";
import type { Decision, Position } from "@/lib/engine/types";
import type { Rules } from "@/lib/rules";

/**
 * The fewest ice creams that must actually be allocated for a plan to stop losing money.
 *
 * Net profit rises with every unit sold: Sh 2 of revenue against at most Sh 0.4 of transport,
 * a 5% bonus and 10% tax, so the search can bisect. Returns null when even a full fill of the
 * request loses money, and 0 when the plan profits with no sales at all.
 */
export function breakEvenUnits(
  position: Position,
  decision: Decision,
  rules: Rules,
): number | null {
  const profitAt = (units: number) => runSeason(position, decision, units, rules).pnl.netProfit;

  if (profitAt(decision.salesRequest) < 0) return null;
  if (profitAt(0) >= 0) return 0;

  let low = 0;
  let high = decision.salesRequest;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (profitAt(mid) >= 0) high = mid;
    else low = mid + 1;
  }
  return low;
}
