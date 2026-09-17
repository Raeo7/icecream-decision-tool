import { describe, expect, it } from "vitest";
import { YEAR1_RULES } from "@/lib/rules";
import { validate } from "@/lib/engine/validate";
import type { Decision } from "@/lib/engine/types";
import type { MachineCopy } from "@/lib/engine/machines";

const owned: MachineCopy[] = [{ uid: "m1", typeId: "1", seasonsDepreciated: 0 }];

const base: Decision = {
  rentals: [{ premiseId: "D", installedUids: ["m1"], production: 70000 }],
  machinePurchases: [],
  milkTons: 3.5,
  marketInvestment: 5000,
  salesRequest: 70000,
  loan: null,
};

/** The same decision, making a different amount at its one premise. */
function making(production: number, extra: Partial<Decision> = {}): Decision {
  return {
    ...base,
    rentals: [{ premiseId: "D", installedUids: ["m1"], production }],
    ...extra,
  };
}

function messages(decision: Decision, unitsSold = 20000) {
  return validate(decision, owned, unitsSold, YEAR1_RULES, 0).map((f) => f.message);
}

function violations(decision: Decision, unitsSold = 20000) {
  return validate(decision, owned, unitsSold, YEAR1_RULES, 0).filter(
    (f) => f.severity === "violation",
  );
}

describe("validate", () => {
  it("accepts the team's real winter decision", () => {
    expect(violations(base)).toEqual([]);
  });

  it("warns when milk is bought that is not turned into ice cream", () => {
    // #given 3.5 tons, enough for 70,000, but only 40,000 planned
    const under = making(40000, { salesRequest: 40000 });

    // #then it says so, because milk becomes ice cream automatically and is paid for anyway
    expect(messages(under).some((m) => m.includes("automatically"))).toBe(true);
    expect(violations(under)).toEqual([]);
  });

  it("stays quiet when production already uses all the milk", () => {
    // #given production matched to the milk bought
    expect(messages(making(70000))).toEqual([]);
  });

  it("stays quiet when machine capacity is the binding limit, not the milk", () => {
    // #given more milk than the machine can process
    const capped = making(72000, { milkTons: 5, salesRequest: 70000 });

    // #then producing the machine's full 72,000 raises no complaint about the spare milk
    expect(messages(capped).some((m) => m.includes("automatically"))).toBe(false);
  });

  it("accepts fractional milk tons, which the trainer permits", () => {
    expect(messages({ ...base, milkTons: 3.5 })).toEqual([]);
    expect(violations(making(50000, { milkTons: 2.5, salesRequest: 50000 }))).toEqual(
      [],
    );
  });

  it("rejects more machines than the premise has slots", () => {
    const two: MachineCopy[] = [...owned, { uid: "m2", typeId: "1", seasonsDepreciated: 0 }];
    const flags = validate({ ...base, rentals: [{ premiseId: "D", installedUids: ["m1", "m2"], production: 70000 }] }, two, 20000, YEAR1_RULES, 0);
    expect(flags.some((f) => f.message.includes("slot"))).toBe(true);
  });

  it("rejects production above installed capacity", () => {
    expect(violations(making(80000)).length).toBeGreaterThan(0);
  });

  it("rejects production above the milk available", () => {
    expect(violations(making(60000, { milkTons: 1 })).length).toBeGreaterThan(0);
  });

  it("rejects a request that is not a whole 10,000 block", () => {
    expect(violations({ ...base, salesRequest: 65000 }).length).toBeGreaterThan(0);
  });

  it("rejects a request larger than production", () => {
    expect(violations({ ...base, salesRequest: 80000 }).length).toBeGreaterThan(0);
  });

  it("rejects units sold above units requested", () => {
    expect(violations(base, 80000).length).toBeGreaterThan(0);
  });

  it("rejects market investment below the minimum", () => {
    expect(violations({ ...base, marketInvestment: 500 }).length).toBeGreaterThan(0);
  });

  it("rejects milk below one ton, even when sitting out", () => {
    const sittingOut: Decision = {
      rentals: [],
      machinePurchases: [],
      milkTons: 0,
      marketInvestment: 1000,
      salesRequest: 0,
      loan: null,
    };
    expect(violations(sittingOut, 0).length).toBeGreaterThan(0);
  });

  it("accepts a legal sit-out season", () => {
    const sittingOut: Decision = {
      rentals: [],
      machinePurchases: [],
      milkTons: 1,
      marketInvestment: 1000,
      salesRequest: 0,
      loan: null,
    };
    expect(violations(sittingOut, 0)).toEqual([]);
  });

  it("rejects a loan term outside one to eight seasons", () => {
    expect(
      violations({ ...base, loan: { principal: 50000, termSeasons: 9 } }).length,
    ).toBeGreaterThan(0);
  });

  it("flags negative cash", () => {
    const flags = validate(base, owned, 20000, YEAR1_RULES, -500);
    expect(flags.some((f) => f.message.includes("Cash falls"))).toBe(true);
  });

  it("warns that Year 2 prices are estimates", () => {
    const flags = validate(base, owned, 20000, { ...YEAR1_RULES, isEstimate: true }, 0);
    expect(flags.some((f) => f.message.includes("estimate"))).toBe(true);
  });
});
