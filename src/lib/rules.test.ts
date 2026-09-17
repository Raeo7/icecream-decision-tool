import { describe, expect, it } from "vitest";
import { FORECAST, MACHINES, PREMISES, YEAR1_RULES, year2Estimate } from "@/lib/rules";

describe("rules", () => {
  it("matches the handout's premise table", () => {
    expect(PREMISES).toEqual([
      { id: "A", slots: 1, transport: 0.3, rent: 12000 },
      { id: "B", slots: 1, transport: 0.4, rent: 10000 },
      { id: "C", slots: 1, transport: 0.3, rent: 12000 },
      { id: "D", slots: 1, transport: 0.1, rent: 17000 },
      { id: "E", slots: 2, transport: 0.2, rent: 15000 },
      { id: "F", slots: 3, transport: 0.2, rent: 16000 },
    ]);
  });

  it("matches the handout's machine table", () => {
    expect(MACHINES).toEqual([
      { id: "1", capacity: 72000, price: 35000, maintenance: 1800, depreciation: 4375 },
      { id: "2", capacity: 120000, price: 95000, maintenance: 2900, depreciation: 11875 },
      { id: "3", capacity: 68000, price: 38000, maintenance: 2100, depreciation: 4750 },
      { id: "4", capacity: 95000, price: 70000, maintenance: 2900, depreciation: 8750 },
      { id: "5", capacity: 45000, price: 28000, maintenance: 1300, depreciation: 3500 },
      { id: "6", capacity: 110000, price: 90000, maintenance: 2900, depreciation: 11250 },
    ]);
  });

  it("depreciates every machine over exactly eight seasons", () => {
    for (const m of MACHINES) {
      expect(m.depreciation).toBe(m.price / YEAR1_RULES.depreciationSeasons);
    }
  });

  it("carries both demand forecasts", () => {
    expect(FORECAST.year1).toEqual({
      winter: 280000,
      spring: 360000,
      summer: 400000,
      autumn: 320000,
    });
    expect(FORECAST.year2).toEqual({
      winter: 410000,
      spring: 550000,
      summer: 650000,
      autumn: 470000,
    });
  });

  it("marks Year 1 confirmed and Year 2 an estimate", () => {
    expect(YEAR1_RULES.isEstimate).toBe(false);
    expect(year2Estimate().isEstimate).toBe(true);
  });

  it("starts Year 2 from Year 1 prices", () => {
    expect(year2Estimate().milkPricePerTon).toBe(YEAR1_RULES.milkPricePerTon);
    expect(year2Estimate().premises).toEqual(PREMISES);
  });
});
