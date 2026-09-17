import { describe, expect, it } from "vitest";
import { YEAR1_RULES } from "@/lib/rules";
import { runSeason } from "@/lib/engine/season";
import { blankDecision, emptyPosition, type Decision } from "@/lib/engine/types";

describe("runSeason", () => {
  it("reproduces the handout's section 11 worked example", () => {
    const decision: Decision = {
      rentals: [{ premiseId: "B", installedUids: ["new-0"], production: 40000 }],
      machinePurchases: [{ typeId: "5", qty: 1 }],
      milkTons: 2,
      marketInvestment: 1000,
      salesRequest: 40000,
      loan: null,
    };

    const result = runSeason(emptyPosition(100000), decision, 40000, YEAR1_RULES);

    expect(result.pnl.grossProfit).toBe(35200);
    expect(result.pnl.netProfit).toBe(-3560);
    expect(result.cash.closing).toBe(71940);
    expect(result.closing.taxLossPool).toBe(3560);
    expect(result.closing.machines).toHaveLength(1);
    expect(result.closing.machines[0]!.seasonsDepreciated).toBe(1);
    expect(result.flags.filter((f) => f.severity === "violation")).toEqual([]);
  });

  it("reproduces the handout's transport worked example across two premises", () => {
    // #given the example from section 07: 60,000 made at A and 40,000 at B, on two machines
    const decision: Decision = {
      rentals: [
        { premiseId: "A", installedUids: ["new-0"], production: 60000 },
        { premiseId: "B", installedUids: ["new-1"], production: 40000 },
      ],
      machinePurchases: [{ typeId: "1", qty: 2 }],
      milkTons: 5,
      marketInvestment: 1000,
      salesRequest: 100000,
      loan: null,
    };

    // #when the company sells 70,000 of the 100,000 it made
    const result = runSeason(emptyPosition(400000), decision, 70000, YEAR1_RULES);

    // #then the sale splits 60:40 into 42,000 from A and 28,000 from B, and transport comes to
    // #then 42,000 x 0.3 plus 28,000 x 0.4, which is the 23,800 the handout gives
    expect(result.pnl.transport).toBe(-23800);
    expect(result.pnl.rent).toBe(-22000);
    expect(result.flags.filter((f) => f.severity === "violation")).toEqual([]);
  });

  it("should split a sale that does not divide evenly without inventing units", () => {
    // #given six premises producing the same amount, and nine ice creams sold between them
    const decision: Decision = {
      ...blankDecision(),
      rentals: YEAR1_RULES.premises.map((premise, i) => ({
        premiseId: premise.id,
        installedUids: [`new-${i}`],
        production: 10,
      })),
      machinePurchases: [{ typeId: "1", qty: 6 }],
      milkTons: 1,
      salesRequest: 60,
    };

    // #when the season is run
    const result = runSeason(emptyPosition(400000), decision, 9, YEAR1_RULES);

    // #then transport is charged on nine, not on ten. Rounding each premise's share on its own
    // #then and giving the remainder to the last would hand out one unit more than was sold.
    const perPremise = YEAR1_RULES.premises.map((p) => p.transport);
    const cheapest = Math.min(...perPremise) * 9;
    const dearest = Math.max(...perPremise) * 9;
    expect(-result.pnl.transport).toBeGreaterThanOrEqual(Math.round(cheapest));
    expect(-result.pnl.transport).toBeLessThanOrEqual(Math.round(dearest));
  });

  it("locks in the team's recorded Year 1 winter", () => {
    const decision: Decision = {
      rentals: [{ premiseId: "D", installedUids: ["new-0"], production: 70000 }],
      machinePurchases: [{ typeId: "1", qty: 1 }],
      milkTons: 3.5,
      marketInvestment: 5000,
      salesRequest: 70000,
      loan: { principal: 50000, termSeasons: 4 },
    };

    const result = runSeason(emptyPosition(100000), decision, 20000, YEAR1_RULES);

    expect(result.pnl.netProfit).toBe(-75175);
    expect(result.cash.closing).toBe(31700);
    expect(result.closing.taxLossPool).toBe(75175);
    expect(result.closing.loans[0]!.outstanding).toBe(37500);
    expect(result.spoiledIceCream).toBe(50000);
    expect(result.flags.filter((f) => f.severity === "violation")).toEqual([]);
  });

  it("still charges the minimums in a season that sits out", () => {
    const result = runSeason(emptyPosition(100000), blankDecision(), 0, YEAR1_RULES);

    expect(result.pnl.revenue).toBe(0);
    expect(result.pnl.milk).toBe(-20000);
    expect(result.pnl.salaries).toBe(-10000);
    expect(result.pnl.marketInvestment).toBe(-1000);
    expect(result.cash.closing).toBe(69000);
  });
});

describe("a season with nothing running", () => {
  it("should show no line as negative zero", () => {
    // #given a season with no premise, no machines, no loan and no sales
    const result = runSeason(emptyPosition(100000), blankDecision(), 0, YEAR1_RULES);

    // #when every profit-and-loss line and cash movement is inspected
    const figures = [
      ...Object.values(result.pnl),
      ...result.cash.steps.map((step) => step.movement),
    ];

    // #then none of them is negative zero, which would render to the user as "-0"
    expect(figures.filter((value) => Object.is(value, -0))).toEqual([]);
  });
});
