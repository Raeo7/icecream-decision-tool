import { describe, expect, it } from "vitest";
import { breakEvenUnits } from "@/lib/engine/breakeven";
import { runSeason } from "@/lib/engine/season";
import { emptyPosition, type Decision, type Position } from "@/lib/engine/types";
import { YEAR1_RULES } from "@/lib/rules";

const position: Position = {
  cash: 200000,
  machines: [{ uid: "m1", typeId: "1", seasonsDepreciated: 1 }],
  loans: [],
  taxLossPool: 0,
};

const plan: Decision = {
  rentals: [{ premiseId: "D", installedUids: ["m1"], production: 70000 }],
  machinePurchases: [],
  milkTons: 3.5,
  marketInvestment: 1000,
  salesRequest: 70000,
  loan: null,
};

describe("breakEvenUnits", () => {
  it("should find the fewest units that stop the season losing money", () => {
    // #given a plan that is profitable at a full fill
    const units = breakEvenUnits(position, plan, YEAR1_RULES);

    // #when the season is run at exactly that allocation
    const at = runSeason(position, plan, units!, YEAR1_RULES);

    // #then it is not losing money
    expect(at.pnl.netProfit).toBeGreaterThanOrEqual(0);
  });

  it("should be the lowest such figure, not merely one that works", () => {
    // #given the break-even figure
    const units = breakEvenUnits(position, plan, YEAR1_RULES);

    // #when one fewer ice cream is sold
    const below = runSeason(position, plan, units! - 1, YEAR1_RULES);

    // #then the season loses money again
    expect(below.pnl.netProfit).toBeLessThan(0);
  });

  it("should return null when even a full fill loses money", () => {
    // #given a plan whose market spend swamps any possible revenue
    const hopeless: Decision = { ...plan, marketInvestment: 500000 };

    // #when break-even is sought
    const units = breakEvenUnits(position, hopeless, YEAR1_RULES);

    // #then there is none
    expect(units).toBeNull();
  });

  it("should return zero when the plan costs nothing to run", () => {
    // #given a season with no premise, no machines, no milk cost and no salaries
    const units = breakEvenUnits(
      emptyPosition(100000),
      {
        rentals: [],
        machinePurchases: [],
        milkTons: 0,
        marketInvestment: 0,
        salesRequest: 0,
        loan: null,
      },
      { ...YEAR1_RULES, salaries: 0, milkPricePerTon: 0 },
    );

    // #then no sales are needed to avoid a loss
    expect(units).toBe(0);
  });

  it("should never exceed the sales request, since nothing more can be allocated", () => {
    // #given any plan
    const units = breakEvenUnits(position, plan, YEAR1_RULES);

    // #then break-even sits inside what could actually be allocated
    expect(units!).toBeLessThanOrEqual(plan.salesRequest);
  });

  it("should answer for the plan as it stands, with the milk already bought", () => {
    // #given 70,000 produced at premise D: the milk is a sunk 70,000 whatever now sells,
    // #given so each unit sold brings 2 revenue less 0.1 transport less the 5% bonus
    const units = breakEvenUnits(position, plan, YEAR1_RULES);

    // #when the algebra is worked by hand, profit before tax is 1.8Q - 100,366, from
    // #when 70,000 milk + 1,000 market + 10,000 salaries + 17,000 rent + 6,175 machine
    // #when costs, less the 3,809 the bonus gives back
    // #then break-even is 55,759 - far above the 44,300 you would need if you also chose
    // #then production, which is the cost of buying milk you cannot sell
    expect(units).toBe(55759);
  });
});
