import { computeCash } from "@/lib/engine/cashflow";
import { advanceLoan, paymentFor, type Loan } from "@/lib/engine/loans";
import {
  advanceMachines,
  capacityFor,
  depreciationFor,
  maintenanceFor,
  purchasedMachines,
} from "@/lib/engine/machines";
import { sh } from "@/lib/engine/money";
import { computePnl, nextLossPool } from "@/lib/engine/pnl";
import {
  installedUids,
  totalProduction,
  type Decision,
  type Position,
  type SeasonResult,
} from "@/lib/engine/types";
import { validate } from "@/lib/engine/validate";
import { findMachine, findPremise, type Rules } from "@/lib/rules";

/**
 * What it costs to move the season's sales out of the premises that made them.
 *
 * Handout section 07: sales are split between premises in the ratio they produced, and transport
 * is charged only on the units actually sold from each. Its worked example makes 60,000 at A and
 * 40,000 at B, sells 70,000, and splits that 42,000 to A and 28,000 to B.
 *
 * The split is taken cumulatively rather than premise by premise, so the parts always add back up
 * to the units sold. Rounding each premise's share on its own and handing the remainder to the
 * last one over-allocates: six premises producing equally and nine sold would round to ten.
 */
function transportFor(decision: Decision, unitsSold: number, rules: Rules): number {
  const made = totalProduction(decision);
  if (made <= 0 || unitsSold <= 0) return 0;

  let cost = 0;
  let allocatedSoFar = 0;
  let producedSoFar = 0;

  for (const rental of decision.rentals) {
    producedSoFar += rental.production;
    const upToHere = Math.round((producedSoFar / made) * unitsSold);
    const sold = upToHere - allocatedSoFar;
    allocatedSoFar = upToHere;
    cost += sold * (findPremise(rules, rental.premiseId)?.transport ?? 0);
  }

  return sh(cost);
}

function purchaseCost(decision: Decision, rules: Rules): number {
  return decision.machinePurchases.reduce(
    (sum, p) => sum + (findMachine(rules, p.typeId)?.price ?? 0) * p.qty,
    0,
  );
}

export function runSeason(
  position: Position,
  decision: Decision,
  unitsSold: number,
  rules: Rules,
): SeasonResult {
  const owned = [
    ...position.machines,
    ...purchasedMachines(decision.machinePurchases, position.machines.length),
  ];
  const transport = transportFor(decision, unitsSold, rules);
  const rent = decision.rentals.reduce(
    (sum, rental) => sum + (findPremise(rules, rental.premiseId)?.rent ?? 0),
    0,
  );
  const maintenance = maintenanceFor(owned, rules);
  const depreciation = depreciationFor(owned, rules);

  const newLoan: Loan[] =
    decision.loan === null
      ? []
      : [
          {
            uid: `loan-${position.loans.length}`,
            original: decision.loan.principal,
            outstanding: decision.loan.principal,
            termSeasons: decision.loan.termSeasons,
            seasonsPaid: 0,
          },
        ];
  const activeLoans = [...position.loans, ...newLoan];
  const payments = activeLoans.map((loan) => paymentFor(loan, rules.loanRate));
  const interest = payments.reduce((sum, p) => sum + p.interest, 0);
  const bankPayment = payments.reduce((sum, p) => sum + p.total, 0);

  const pnl = computePnl(
    {
      unitsSold,
      milkTons: decision.milkTons,
      maintenance,
      depreciation,
      transport,
      marketInvestment: decision.marketInvestment,
      rent,
      interest,
      taxLossPool: position.taxLossPool,
    },
    rules,
  );

  const cash = computeCash({
    opening: position.cash,
    loanReceived: decision.loan?.principal ?? 0,
    machinePurchases: purchaseCost(decision, rules),
    milk: -pnl.milk,
    marketInvestment: -pnl.marketInvestment,
    salesReceipts: pnl.revenue,
    rent: -pnl.rent,
    maintenance: -pnl.maintenance,
    transport: -pnl.transport,
    salaries: -pnl.salaries,
    bonus: -pnl.bonus,
    bankPayment,
    tax: -pnl.tax,
  });

  const milkAvailable = decision.milkTons * rules.unitsPerTon;

  return {
    unitsSold,
    pnl,
    cash,
    capacity: capacityFor(installedUids(decision), owned, rules),
    spoiledIceCream: Math.max(0, totalProduction(decision) - unitsSold),
    unusedMilk: Math.max(0, milkAvailable - totalProduction(decision)),
    flags: validate(decision, owned, unitsSold, rules, cash.lowest),
    closing: {
      cash: cash.closing,
      machines: advanceMachines(owned, rules),
      loans: activeLoans
        .map((loan, i) => advanceLoan(loan, payments[i]!))
        .filter((loan) => loan.outstanding > 0),
      taxLossPool: nextLossPool(pnl, position.taxLossPool),
    },
  };
}
