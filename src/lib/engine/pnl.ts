import { cost, sh } from "@/lib/engine/money";
import type { Pnl } from "@/lib/engine/types";
import type { Rules } from "@/lib/rules";

export interface PnlInputs {
  unitsSold: number;
  milkTons: number;
  maintenance: number;
  depreciation: number;
  transport: number;
  marketInvestment: number;
  rent: number;
  interest: number;
  taxLossPool: number;
}

export function computePnl(inputs: PnlInputs, rules: Rules): Pnl {
  const revenue = sh(inputs.unitsSold * rules.unitPrice);
  const milk = cost(inputs.milkTons * rules.milkPricePerTon);
  const maintenance = cost(inputs.maintenance);
  const depreciation = cost(inputs.depreciation);
  const grossProfit = revenue + milk + maintenance + depreciation;

  const transport = cost(inputs.transport);
  const marketInvestment = cost(inputs.marketInvestment);
  const bonus = grossProfit > 0 ? cost(grossProfit * rules.bonusRate) : 0;
  const salaries = cost(rules.salaries);
  const rent = cost(inputs.rent);
  const interest = cost(inputs.interest);

  const profitBeforeTax =
    grossProfit + transport + marketInvestment + bonus + salaries + rent + interest;

  const lossPoolUsed = profitBeforeTax > 0 ? Math.min(profitBeforeTax, inputs.taxLossPool) : 0;
  const taxableProfit = Math.max(0, profitBeforeTax - lossPoolUsed);
  const tax = cost(taxableProfit * rules.taxRate);

  return {
    revenue,
    milk,
    maintenance,
    depreciation,
    grossProfit,
    transport,
    marketInvestment,
    bonus,
    salaries,
    rent,
    interest,
    profitBeforeTax,
    lossPoolUsed,
    taxableProfit,
    tax,
    netProfit: profitBeforeTax + tax,
  };
}

/** A loss grows the pool; a profit consumes what it used. */
export function nextLossPool(pnl: Pnl, pool: number): number {
  return pnl.profitBeforeTax < 0 ? pool - pnl.profitBeforeTax : pool - pnl.lossPoolUsed;
}
