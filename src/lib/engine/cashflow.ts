import { cost } from "@/lib/engine/money";
import type { Cash, CashStep } from "@/lib/engine/types";

export interface CashInputs {
  opening: number;
  loanReceived: number;
  machinePurchases: number;
  milk: number;
  marketInvestment: number;
  salesReceipts: number;
  rent: number;
  maintenance: number;
  transport: number;
  salaries: number;
  bonus: number;
  bankPayment: number;
  tax: number;
}

/** Advance payments first, then season end, exactly as handout section 10 sets it out. */
export function computeCash(inputs: CashInputs): Cash {
  const movements: Array<[string, number]> = [
    ["Loan received", inputs.loanReceived],
    ["Machine purchases", cost(inputs.machinePurchases)],
    ["Milk", cost(inputs.milk)],
    ["Market investment", cost(inputs.marketInvestment)],
    ["Sales receipts", inputs.salesReceipts],
    ["Rent", cost(inputs.rent)],
    ["Maintenance", cost(inputs.maintenance)],
    ["Transport", cost(inputs.transport)],
    ["Salaries", cost(inputs.salaries)],
    ["Bonus", cost(inputs.bonus)],
    ["Bank payment", cost(inputs.bankPayment)],
    ["Game tax", cost(inputs.tax)],
  ];

  const steps: CashStep[] = [];
  let balance = inputs.opening;
  let lowest = inputs.opening;

  for (const [label, movement] of movements) {
    balance += movement;
    lowest = Math.min(lowest, balance);
    steps.push({ label, movement });
  }

  return { opening: inputs.opening, steps, closing: balance, lowest };
}
