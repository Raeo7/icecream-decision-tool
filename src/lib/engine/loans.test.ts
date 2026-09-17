import { describe, expect, it } from "vitest";
import { advanceLoan, paymentFor, type Loan } from "@/lib/engine/loans";

function loan(principal: number, term: number): Loan {
  return {
    uid: "L1",
    original: principal,
    outstanding: principal,
    termSeasons: term,
    seasonsPaid: 0,
  };
}

describe("loans", () => {
  it("reproduces the handout's Sh 60,000 over four seasons", () => {
    const first = loan(60000, 4);
    const p1 = paymentFor(first, 0.1);
    expect(p1.interest).toBe(6000);
    expect(p1.principal).toBe(15000);
    expect(p1.total).toBe(21000);
    expect(p1.outstandingAfter).toBe(45000);

    const p2 = paymentFor(advanceLoan(first, p1), 0.1);
    expect(p2.interest).toBe(4500);
  });

  it("clears the whole remaining balance in the final season", () => {
    let current = loan(10000, 3);
    let repaid = 0;
    for (let i = 0; i < 3; i += 1) {
      const payment = paymentFor(current, 0.1);
      repaid += payment.principal;
      current = advanceLoan(current, payment);
    }
    expect(repaid).toBe(10000);
    expect(current.outstanding).toBe(0);
  });

  it("charges nothing once settled", () => {
    const settled: Loan = { ...loan(10000, 1), outstanding: 0, seasonsPaid: 1 };
    expect(paymentFor(settled, 0.1).total).toBe(0);
  });
});
