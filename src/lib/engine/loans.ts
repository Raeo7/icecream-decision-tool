import { sh } from "@/lib/engine/money";

export interface Loan {
  uid: string;
  original: number;
  outstanding: number;
  termSeasons: number;
  seasonsPaid: number;
}

export interface Payment {
  interest: number;
  principal: number;
  total: number;
  outstandingAfter: number;
}

export function paymentFor(loan: Loan, rate: number): Payment {
  if (loan.outstanding <= 0) {
    return { interest: 0, principal: 0, total: 0, outstandingAfter: 0 };
  }
  const interest = sh(loan.outstanding * rate);
  const isFinal = loan.seasonsPaid + 1 >= loan.termSeasons;
  const scheduled = sh(loan.original / loan.termSeasons);
  const principal = isFinal ? loan.outstanding : Math.min(scheduled, loan.outstanding);
  return {
    interest,
    principal,
    total: interest + principal,
    outstandingAfter: loan.outstanding - principal,
  };
}

export function advanceLoan(loan: Loan, payment: Payment): Loan {
  return { ...loan, outstanding: payment.outstandingAfter, seasonsPaid: loan.seasonsPaid + 1 };
}
