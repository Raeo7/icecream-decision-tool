import { describe, expect, it } from "vitest";
import { runChain, type ChainEntry } from "@/lib/engine/chain";
import type { MachineCopy } from "@/lib/engine/machines";
import { runSeason } from "@/lib/engine/season";
import { blankDecision, emptyPosition, type Decision, type Position } from "@/lib/engine/types";
import { YEAR1_RULES } from "@/lib/rules";

function owning(cash: number, machines: MachineCopy[], taxLossPool = 0): Position {
  return { cash, machines, loans: [], taxLossPool };
}

const machine5: MachineCopy = { uid: "m5", typeId: "5", seasonsDepreciated: 0 };
const machine1: MachineCopy = { uid: "m1", typeId: "1", seasonsDepreciated: 0 };

/** A profitable season: premise D's cheap transport against Machine 1's capacity. */
const profitable: Decision = {
  rentals: [{ premiseId: "D", installedUids: ["m1"], production: 70000 }],
  machinePurchases: [],
  milkTons: 3.5,
  marketInvestment: 1000,
  salesRequest: 70000,
  loan: null,
};

describe("handout section 2, an idle owned machine", () => {
  it("should still cost maintenance and depreciation in a season that sits out", () => {
    // #given a machine owned but installed nowhere, because no premise is rented
    const position = owning(100000, [machine5]);

    // #when the season is run with no premise at all
    const result = runSeason(position, blankDecision(), 0, YEAR1_RULES);

    // #then both charges still fall, exactly as the handout requires
    expect(result.pnl.maintenance).toBe(-1300);
    expect(result.pnl.depreciation).toBe(-3500);
  });
});

describe("handout section 2, a machine past its eight seasons", () => {
  it("should stop producing but keep costing maintenance", () => {
    // #given a machine that has been depreciated for its full life
    const spent: MachineCopy = { uid: "old", typeId: "1", seasonsDepreciated: 8 };
    const position = owning(100000, [spent]);
    const decision: Decision = {
      ...blankDecision(),
      rentals: [{ premiseId: "D", installedUids: ["old"], production: 0 }],
    };

    // #when the season is run with it installed
    const result = runSeason(position, decision, 0, YEAR1_RULES);

    // #then it makes nothing, is no longer depreciated, and is still maintained
    expect(result.capacity).toBe(0);
    expect(result.pnl.depreciation).toBe(0);
    expect(result.pnl.maintenance).toBe(-1800);
  });
});

describe("handout section 8, borrowing again while a loan is outstanding", () => {
  it("should service both loans in the same season", () => {
    // #given a season that already carries one loan and takes another
    const carrying: Position = {
      cash: 100000,
      machines: [],
      loans: [
        { uid: "first", original: 50000, outstanding: 37500, termSeasons: 4, seasonsPaid: 1 },
      ],
      taxLossPool: 0,
    };
    const decision: Decision = { ...blankDecision(), loan: { principal: 20000, termSeasons: 4 } };

    // #when the season runs
    const result = runSeason(carrying, decision, 0, YEAR1_RULES);

    // #then interest is charged on both balances: 10% of 37,500 plus 10% of 20,000
    expect(result.pnl.interest).toBe(-(3750 + 2000));
  });

  it("should carry both loans forward with their own balances", () => {
    // #given the same season
    const carrying: Position = {
      cash: 100000,
      machines: [],
      loans: [
        { uid: "first", original: 50000, outstanding: 37500, termSeasons: 4, seasonsPaid: 1 },
      ],
      taxLossPool: 0,
    };
    const decision: Decision = { ...blankDecision(), loan: { principal: 20000, termSeasons: 4 } };

    // #when the season closes
    const result = runSeason(carrying, decision, 0, YEAR1_RULES);

    // #then each loan is reduced by its own equal share of principal
    expect(result.closing.loans.map((l) => l.outstanding)).toEqual([25000, 15000]);
  });
});

describe("handout section 8, cash before an advance payment", () => {
  it("should flag a season that dips negative even though it closes positive", () => {
    // #given a plan whose milk is paid before the sales money arrives
    const position = owning(30000, [machine5]);
    const decision: Decision = {
      rentals: [{ premiseId: "B", installedUids: ["m5"], production: 40000 }],
      machinePurchases: [],
      milkTons: 2,
      marketInvestment: 1000,
      salesRequest: 40000,
      loan: null,
    };

    // #when the season is run and every sale lands
    const result = runSeason(position, decision, 40000, YEAR1_RULES);

    // #then closing cash is positive but the season still broke the rule on the way through
    expect(result.cash.closing).toBeGreaterThan(0);
    expect(result.cash.lowest).toBeLessThan(0);
    expect(result.flags.some((f) => f.message.includes("Cash falls"))).toBe(true);
  });
});

describe("handout section 10, what never touches the profit and loss", () => {
  it("should charge a machine purchase to cash only", () => {
    // #given two identical seasons, one buying the machine the other already owns
    const buys = runSeason(
      emptyPosition(100000),
      { ...blankDecision(), machinePurchases: [{ typeId: "5", qty: 1 }] },
      0,
      YEAR1_RULES,
    );
    const owns = runSeason(owning(100000, [machine5]), blankDecision(), 0, YEAR1_RULES);

    // #when their statements are compared
    // #then the profit is identical and only the cash differs, by the purchase price
    expect(buys.pnl.netProfit).toBe(owns.pnl.netProfit);
    expect(owns.cash.closing - buys.cash.closing).toBe(28000);
  });

  it("should charge loan principal to cash only, never to profit", () => {
    // #given a season that borrows 50,000 over four seasons
    const decision: Decision = {
      ...blankDecision(),
      loan: { principal: 50000, termSeasons: 4 },
    };

    // #when the season is run
    const result = runSeason(emptyPosition(100000), decision, 0, YEAR1_RULES);
    const bank = result.cash.steps.find((s) => s.label === "Bank payment");

    // #then only the interest reduces profit, while cash pays interest plus principal
    expect(result.pnl.interest).toBe(-5000);
    expect(bank?.movement).toBe(-17500);
  });
});

describe("handout section 9, the carried loss pool", () => {
  it("should shelter a later profit and leave the remainder for next time", () => {
    // #given unused tax losses of 50,000 carried into a profitable season
    const position = owning(200000, [machine1], 50000);

    // #when the season makes 25,634 before tax
    const result = runSeason(position, profitable, 70000, YEAR1_RULES);

    // #then the pool covers it, no tax falls, and the pool shrinks by what it used
    expect(result.pnl.profitBeforeTax).toBe(25634);
    expect(result.pnl.taxableProfit).toBe(0);
    expect(result.pnl.tax).toBe(0);
    expect(result.closing.taxLossPool).toBe(50000 - 25634);
  });

  it("should tax a profit at ten per cent when no losses are carried", () => {
    // #given the same season with no pool behind it
    const position = owning(200000, [machine1]);

    // #when it is run
    const result = runSeason(position, profitable, 70000, YEAR1_RULES);

    // #then the whole profit is taxable at ten per cent
    expect(result.pnl.taxableProfit).toBe(25634);
    expect(result.pnl.tax).toBe(-2563);
    expect(result.pnl.netProfit).toBe(25634 - 2563);
  });
});

describe("handout section 5, revenue and spoilage", () => {
  it("should pay nothing for ice cream produced but not allocated", () => {
    // #given a season that produces and requests 70,000 but is allocated only 20,000
    const position = owning(200000, [machine1]);

    // #when the trainer's allocation is applied
    const result = runSeason(position, profitable, 20000, YEAR1_RULES);

    // #then revenue follows units sold alone, and the rest spoils
    expect(result.pnl.revenue).toBe(40000);
    expect(result.spoiledIceCream).toBe(50000);
  });

  it("should charge the whole milk purchase once, with no second spoilage cost", () => {
    // #given 3.5 tons bought at 20,000 a ton
    const position = owning(200000, [machine1]);

    // #when only a fraction of the ice cream sells
    const result = runSeason(position, profitable, 20000, YEAR1_RULES);

    // #then the milk line is the full purchase and nothing further is charged for spoilage
    expect(result.pnl.milk).toBe(-70000);
  });
});

describe("handout section 2, starting cash", () => {
  it("should be received once, not at the start of every season", () => {
    // #given two seasons chained from the opening 100,000
    const sitOut: ChainEntry = { decision: blankDecision(), unitsSold: 0, rules: YEAR1_RULES };

    // #when both are run
    const results = runChain(emptyPosition(100000), [sitOut, sitOut]);

    // #then the second season opens on the first season's closing cash
    expect(results[1]?.cash.opening).toBe(results[0]?.cash.closing);
  });
});
