import { sh } from "@/lib/engine/money";
import { findMachine, type Rules } from "@/lib/rules";

export interface MachineCopy {
  uid: string;
  typeId: string;
  seasonsDepreciated: number;
}

export function isOperable(machine: MachineCopy, rules: Rules): boolean {
  return machine.seasonsDepreciated < rules.depreciationSeasons;
}

export function remainingLife(machine: MachineCopy, rules: Rules): number {
  return Math.max(0, rules.depreciationSeasons - machine.seasonsDepreciated);
}

/** Every owned machine, every season of ownership, idle or not. */
export function maintenanceFor(machines: MachineCopy[], rules: Rules): number {
  return sh(machines.reduce((sum, m) => sum + (findMachine(rules, m.typeId)?.maintenance ?? 0), 0));
}

/** Every owned machine still inside its depreciation life. */
export function depreciationFor(machines: MachineCopy[], rules: Rules): number {
  return sh(
    machines.reduce(
      (sum, m) =>
        sum + (isOperable(m, rules) ? (findMachine(rules, m.typeId)?.depreciation ?? 0) : 0),
      0,
    ),
  );
}

/** Only installed machines still inside their life make ice cream. */
export function capacityFor(
  installedUids: string[],
  machines: MachineCopy[],
  rules: Rules,
): number {
  return installedUids.reduce((sum, uid) => {
    const machine = machines.find((m) => m.uid === uid);
    if (machine === undefined || !isOperable(machine, rules)) return sum;
    return sum + (findMachine(rules, machine.typeId)?.capacity ?? 0);
  }, 0);
}

export function advanceMachines(machines: MachineCopy[], rules: Rules): MachineCopy[] {
  return machines.map((m) => ({
    ...m,
    seasonsDepreciated: Math.min(m.seasonsDepreciated + 1, rules.depreciationSeasons),
  }));
}

/**
 * The machines bought this season, named by continuing from the count already owned.
 * A uid belongs to a machine for its whole life, so numbering each season from zero would
 * make a machine bought in spring collide with one bought in winter, and the engine would
 * then find only the first of the two.
 *
 * Both the engine and the decision form call this, so the names always agree.
 */
export function purchasedMachines(
  purchases: { typeId: string; qty: number }[],
  ownedCount: number,
): MachineCopy[] {
  const machines: MachineCopy[] = [];
  for (const purchase of purchases) {
    for (let i = 0; i < purchase.qty; i += 1) {
      machines.push({
        uid: `new-${ownedCount + machines.length}`,
        typeId: purchase.typeId,
        seasonsDepreciated: 0,
      });
    }
  }
  return machines;
}
