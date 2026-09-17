"use client";

import { capacityFor, purchasedMachines, type MachineCopy } from "@/lib/engine/machines";
import { totalProduction, type Decision, type Rental } from "@/lib/engine/types";
import { findPremise, type Rules } from "@/lib/rules";

interface Props {
  decision: Decision;
  owned: MachineCopy[];
  rules: Rules;
  onChange: (next: Decision) => void;
}

/**
 * What each premise makes, worked out rather than typed.
 *
 * Milk turns into ice cream on its own, so a premise makes whatever its machines can get through
 * until the milk runs out. Where two premises could both make it, the cheaper one to move goods
 * out of is filled first, because sales are split in the ratio produced.
 *
 * Machines that no longer exist are dropped on the way past. Lowering a purchase renames the
 * machines after it, and a rental still pointing at one that has gone would quietly read as a
 * premise with no capacity at all.
 */
function worked(decision: Decision, owned: MachineCopy[], rules: Rules): Decision {
  const machines = [...owned, ...purchasedMachines(decision.machinePurchases, owned.length)];
  const exists = new Set(machines.map((m) => m.uid));
  const transportOf = (rental: Rental) => findPremise(rules, rental.premiseId)?.transport ?? 0;

  const rentals = decision.rentals.map((rental) => ({
    ...rental,
    installedUids: rental.installedUids.filter((uid) => exists.has(uid)),
  }));

  let milkLeft = decision.milkTons * rules.unitsPerTon;
  const made = new Map<string, number>();
  for (const rental of [...rentals].sort((a, b) => transportOf(a) - transportOf(b))) {
    const here = Math.min(milkLeft, capacityFor(rental.installedUids, machines, rules));
    milkLeft -= here;
    made.set(rental.premiseId, here);
  }

  return {
    ...decision,
    rentals: rentals.map((rental) => ({
      ...rental,
      production: made.get(rental.premiseId) ?? 0,
    })),
  };
}

export function SeasonForm({ decision, owned, rules, onChange }: Props) {
  const patch = (changes: Partial<Decision>) =>
    onChange(worked({ ...decision, ...changes }, owned, rules));

  const setPurchase = (typeId: string, qty: number) => {
    const others = decision.machinePurchases.filter((p) => p.typeId !== typeId);
    patch({ machinePurchases: qty > 0 ? [...others, { typeId, qty }] : others });
  };

  // Same helper the engine uses, so the names on these checkboxes always match.
  const machines = [...owned, ...purchasedMachines(decision.machinePurchases, owned.length)];
  const bought = purchasedMachines(decision.machinePurchases, owned.length).map((m) => m.uid);
  const installable = machines.map((m) => m.uid);

  const rentalOf = (premiseId: string): Rental | undefined =>
    decision.rentals.find((r) => r.premiseId === premiseId);

  const replace = (premiseId: string, next: Rental | null) => {
    const others = decision.rentals.filter((r) => r.premiseId !== premiseId);
    patch({ rentals: next === null ? others : [...others, next] });
  };

  const setRented = (premiseId: string, on: boolean) =>
    replace(premiseId, on ? { premiseId, installedUids: [], production: 0 } : null);

  /** A machine runs in one premise at a time, so installing it here takes it out of anywhere else. */
  const toggleMachine = (premiseId: string, uid: string, on: boolean) => {
    patch({
      rentals: decision.rentals.map((rental) => {
        if (rental.premiseId === premiseId) {
          return {
            ...rental,
            installedUids: on
              ? [...rental.installedUids, uid]
              : rental.installedUids.filter((u) => u !== uid),
          };
        }
        return on
          ? { ...rental, installedUids: rental.installedUids.filter((u) => u !== uid) }
          : rental;
      }),
    });
  };

  const runsIn = (uid: string) =>
    decision.rentals.find((r) => r.installedUids.includes(uid))?.premiseId;

  return (
    <div>
      <h4>Premises rented</h4>
      <p className="lede">
        Rent as many as you like, and put the machines where you ran them. What each premise makes
        follows from that and the milk you bought, so there is nothing to type: milk turns into ice
        cream on its own, and the premise that is cheapest to move goods out of is filled first.
        Sales are then split between premises in the ratio they produced.
      </p>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Premise</th>
              <th>Rented</th>
              <th className="num">Produced here</th>
              <th>Machines running here</th>
            </tr>
          </thead>
          <tbody>
            {rules.premises.map((premise) => {
              const rental = rentalOf(premise.id);
              return (
                <tr key={premise.id}>
                  <td>
                    {premise.id} — {premise.slots} slot(s), rent {premise.rent.toLocaleString()},
                    transport {premise.transport}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Rent premise ${premise.id}`}
                      style={{ width: "auto" }}
                      checked={rental !== undefined}
                      onChange={(e) => setRented(premise.id, e.target.checked)}
                    />
                  </td>
                  <td className="num">
                    {rental === undefined ? "—" : rental.production.toLocaleString()}
                  </td>
                  <td>
                    {rental === undefined
                      ? "—"
                      : installable.map((uid) => {
                          const elsewhere = runsIn(uid);
                          return (
                            <label key={uid} style={{ marginRight: 8, whiteSpace: "nowrap" }}>
                              <input
                                type="checkbox"
                                style={{ width: "auto", marginRight: 4 }}
                                checked={rental.installedUids.includes(uid)}
                                onChange={(e) =>
                                  toggleMachine(premise.id, uid, e.target.checked)
                                }
                              />
                              {uid}
                              {elsewhere !== undefined && elsewhere !== premise.id
                                ? ` (in ${elsewhere})`
                                : bought.includes(uid)
                                  ? " (new)"
                                  : " (owned)"}
                            </label>
                          );
                        })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid">
        <div>
          <label htmlFor="milk">
            Milk bought (tons) — makes {totalProduction(decision).toLocaleString()} ice creams
          </label>
          <input
            id="milk"
            type="number"
            min={0}
            step={0.5}
            value={decision.milkTons}
            onChange={(e) => patch({ milkTons: Number(e.target.value) })}
          />
        </div>
        <div>
          <label htmlFor="market">Market investment (Sh)</label>
          <input
            id="market"
            type="number"
            min={0}
            step={1000}
            value={decision.marketInvestment}
            onChange={(e) => patch({ marketInvestment: Number(e.target.value) })}
          />
        </div>
        <div>
          <label htmlFor="request">Ice creams requested</label>
          <input
            id="request"
            type="number"
            min={0}
            step={rules.requestBlock}
            value={decision.salesRequest}
            onChange={(e) => patch({ salesRequest: Number(e.target.value) })}
          />
        </div>
      </div>

      <h4>Machines bought this season</h4>
      <div className="grid">
        {rules.machines.map((machine) => (
          <div key={machine.id}>
            <label htmlFor={`buy-${machine.id}`}>
              Machine {machine.id} — {machine.capacity.toLocaleString()} units, Sh{" "}
              {machine.price.toLocaleString()}
            </label>
            <input
              id={`buy-${machine.id}`}
              type="number"
              min={0}
              value={decision.machinePurchases.find((p) => p.typeId === machine.id)?.qty ?? 0}
              onChange={(e) => setPurchase(machine.id, Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <h4>Borrowing</h4>
      <div className="grid">
        <div>
          <label htmlFor="loan">New loan this season (Sh)</label>
          <input
            id="loan"
            type="number"
            min={0}
            step={1000}
            value={decision.loan?.principal ?? 0}
            onChange={(e) => {
              const principal = Number(e.target.value);
              const termSeasons = decision.loan?.termSeasons ?? 4;
              patch({ loan: principal > 0 ? { principal, termSeasons } : null });
            }}
          />
        </div>
        <div>
          <label htmlFor="term">Repayment term (seasons)</label>
          <input
            id="term"
            type="number"
            min={1}
            max={rules.maxLoanTerm}
            value={decision.loan?.termSeasons ?? 4}
            onChange={(e) => {
              if (decision.loan === null) return;
              patch({ loan: { ...decision.loan, termSeasons: Number(e.target.value) } });
            }}
          />
        </div>
      </div>
    </div>
  );
}
