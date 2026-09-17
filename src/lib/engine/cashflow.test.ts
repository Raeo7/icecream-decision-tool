import { describe, expect, it } from "vitest";
import { computeCash } from "@/lib/engine/cashflow";

const section11 = {
  opening: 100000,
  loanReceived: 0,
  machinePurchases: 28000,
  milk: 40000,
  marketInvestment: 1000,
  salesReceipts: 80000,
  rent: 10000,
  maintenance: 1300,
  transport: 16000,
  salaries: 10000,
  bonus: 1760,
  bankPayment: 0,
  tax: 0,
};

describe("computeCash", () => {
  it("reproduces the handout's section 11 closing cash", () => {
    expect(computeCash(section11).closing).toBe(71940);
  });

  it("orders advance payments before season-end movements", () => {
    expect(computeCash(section11).steps.map((s) => s.label)).toEqual([
      "Loan received",
      "Machine purchases",
      "Milk",
      "Market investment",
      "Sales receipts",
      "Rent",
      "Maintenance",
      "Transport",
      "Salaries",
      "Bonus",
      "Bank payment",
      "Game tax",
    ]);
  });

  it("reports the lowest balance reached at any step", () => {
    // 50,000 - 28,000 - 40,000 - 1,000 bottoms out before the sales money arrives.
    expect(computeCash({ ...section11, opening: 50000 }).lowest).toBe(-19000);
  });
});
