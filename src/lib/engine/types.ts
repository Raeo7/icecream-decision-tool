import type { Loan } from "@/lib/engine/loans";
import type { MachineCopy } from "@/lib/engine/machines";

export interface Position {
  cash: number;
  machines: MachineCopy[];
  loans: Loan[];
  taxLossPool: number;
}

export interface MachinePurchase {
  typeId: string;
  qty: number;
}

/**
 * One premise rented for the season, with the machines running in it and what they make there.
 *
 * Handout section 02: you may rent one, several, or no premises in a season. Production is
 * recorded per premise because sales are split between premises in the ratio they produced, and
 * transport is charged per premise on the units sold from it.
 */
export interface Rental {
  premiseId: string;
  installedUids: string[];
  production: number;
}

export interface Decision {
  /** Empty for a season sat out, which rents nothing. */
  rentals: Rental[];
  machinePurchases: MachinePurchase[];
  milkTons: number;
  marketInvestment: number;
  salesRequest: number;
  loan: { principal: number; termSeasons: number } | null;
}

/** Everything the company makes this season, across however many premises it rents. */
export function totalProduction(decision: Decision): number {
  return decision.rentals.reduce((sum, rental) => sum + rental.production, 0);
}

/** Every machine the company has running this season, wherever it is installed. */
export function installedUids(decision: Decision): string[] {
  return decision.rentals.flatMap((rental) => rental.installedUids);
}

export interface Flag {
  severity: "violation" | "advisory";
  message: string;
}

export interface Pnl {
  revenue: number;
  milk: number;
  maintenance: number;
  depreciation: number;
  grossProfit: number;
  transport: number;
  marketInvestment: number;
  bonus: number;
  salaries: number;
  rent: number;
  interest: number;
  profitBeforeTax: number;
  lossPoolUsed: number;
  taxableProfit: number;
  tax: number;
  netProfit: number;
}

export interface CashStep {
  label: string;
  movement: number;
}

export interface Cash {
  opening: number;
  steps: CashStep[];
  closing: number;
  lowest: number;
}

export interface SeasonResult {
  unitsSold: number;
  pnl: Pnl;
  cash: Cash;
  capacity: number;
  spoiledIceCream: number;
  unusedMilk: number;
  flags: Flag[];
  closing: Position;
}

export function emptyPosition(cash: number): Position {
  return { cash, machines: [], loans: [], taxLossPool: 0 };
}

export function blankDecision(): Decision {
  return {
    rentals: [],
    machinePurchases: [],
    milkTons: 1,
    marketInvestment: 1000,
    salesRequest: 0,
    loan: null,
  };
}
