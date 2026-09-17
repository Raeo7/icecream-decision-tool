import { describe, expect, it } from "vitest";
import { YEAR1_RULES } from "@/lib/rules";
import { computePnl } from "@/lib/engine/pnl";

const section11 = {
  unitsSold: 40000,
  milkTons: 2,
  maintenance: 1300,
  depreciation: 3500,
  transport: 16000,
  marketInvestment: 1000,
  rent: 10000,
  interest: 0,
  taxLossPool: 0,
};

describe("computePnl", () => {
  it("reproduces the handout's section 11 statement", () => {
    const pnl = computePnl(section11, YEAR1_RULES);
    expect(pnl.revenue).toBe(80000);
    expect(pnl.grossProfit).toBe(35200);
    expect(pnl.bonus).toBe(-1760);
    expect(pnl.profitBeforeTax).toBe(-3560);
    expect(pnl.tax).toBe(0);
    expect(pnl.netProfit).toBe(-3560);
  });

  it("pays no bonus when gross profit is negative", () => {
    const pnl = computePnl({ ...section11, unitsSold: 0 }, YEAR1_RULES);
    expect(pnl.grossProfit).toBeLessThan(0);
    expect(pnl.bonus).toBe(0);
  });

  it("reproduces the handout's section 9 tax example", () => {
    // Engineered so profit before tax is exactly 100,000 against a 50,000 pool:
    // revenue 160,000 - milk 20,000 = gross 140,000, less salaries 40,000.
    const pnl = computePnl(
      {
        unitsSold: 80000,
        milkTons: 1,
        maintenance: 0,
        depreciation: 0,
        transport: 0,
        marketInvestment: 0,
        rent: 0,
        interest: 0,
        taxLossPool: 50000,
      },
      { ...YEAR1_RULES, salaries: 40000, bonusRate: 0 },
    );
    expect(pnl.profitBeforeTax).toBe(100000);
    expect(pnl.lossPoolUsed).toBe(50000);
    expect(pnl.taxableProfit).toBe(50000);
    expect(pnl.tax).toBe(-5000);
    expect(pnl.netProfit).toBe(95000);
  });

  it("grows the loss pool figure it reports when the season loses money", () => {
    const pnl = computePnl(section11, YEAR1_RULES);
    expect(pnl.lossPoolUsed).toBe(0);
    expect(pnl.taxableProfit).toBe(0);
  });
});
