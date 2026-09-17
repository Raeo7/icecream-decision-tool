export interface Premise {
  id: string;
  slots: number;
  transport: number;
  rent: number;
}

export interface Machine {
  id: string;
  capacity: number;
  price: number;
  maintenance: number;
  depreciation: number;
}

export interface Rules {
  premises: Premise[];
  machines: Machine[];
  unitPrice: number;
  milkPricePerTon: number;
  unitsPerTon: number;
  minMilkTons: number;
  salaries: number;
  bonusRate: number;
  taxRate: number;
  loanRate: number;
  minMarket: number;
  requestBlock: number;
  depreciationSeasons: number;
  maxLoanTerm: number;
  /** True for Year 2, whose prices are Year 1 figures carried forward, not confirmed. */
  isEstimate: boolean;
}

export const STARTING_CASH = 100000;

/** Six companies play the market every season, including yours. */
export const TEAMS_IN_CLASS = 6;

/** So there are always this many others to rank against. */
export const RIVAL_COUNT = TEAMS_IN_CLASS - 1;

/** You are Team 7. The numbers are fixed for the whole game, so they carry between seasons. */
export const OUR_TEAM = "Team 7";

/** The other five, in their permanent order. */
export const RIVAL_TEAMS = ["Team 8", "Team 9", "Team 10", "Team 11", "Team 12"];

export const PREMISES: Premise[] = [
  { id: "A", slots: 1, transport: 0.3, rent: 12000 },
  { id: "B", slots: 1, transport: 0.4, rent: 10000 },
  { id: "C", slots: 1, transport: 0.3, rent: 12000 },
  { id: "D", slots: 1, transport: 0.1, rent: 17000 },
  { id: "E", slots: 2, transport: 0.2, rent: 15000 },
  { id: "F", slots: 3, transport: 0.2, rent: 16000 },
];

export const MACHINES: Machine[] = [
  { id: "1", capacity: 72000, price: 35000, maintenance: 1800, depreciation: 4375 },
  { id: "2", capacity: 120000, price: 95000, maintenance: 2900, depreciation: 11875 },
  { id: "3", capacity: 68000, price: 38000, maintenance: 2100, depreciation: 4750 },
  { id: "4", capacity: 95000, price: 70000, maintenance: 2900, depreciation: 8750 },
  { id: "5", capacity: 45000, price: 28000, maintenance: 1300, depreciation: 3500 },
  { id: "6", capacity: 110000, price: 90000, maintenance: 2900, depreciation: 11250 },
];

export const FORECAST = {
  year1: { winter: 280000, spring: 360000, summer: 400000, autumn: 320000 },
  year2: { winter: 410000, spring: 550000, summer: 650000, autumn: 470000 },
};

export const YEAR1_RULES: Rules = {
  premises: PREMISES,
  machines: MACHINES,
  unitPrice: 2,
  milkPricePerTon: 20000,
  unitsPerTon: 20000,
  minMilkTons: 1,
  salaries: 10000,
  bonusRate: 0.05,
  taxRate: 0.1,
  loanRate: 0.1,
  minMarket: 1000,
  requestBlock: 10000,
  depreciationSeasons: 8,
  maxLoanTerm: 8,
  isEstimate: false,
};

/**
 * The Year 2 rules are not published. The trainer supplies them in class.
 * Everything here is a Year 1 price carried forward as a placeholder, which is why
 * isEstimate is true and the Year 2 page lets the user edit these figures.
 */
export function year2Estimate(): Rules {
  return { ...YEAR1_RULES, premises: [...PREMISES], isEstimate: true };
}

export function findPremise(rules: Rules, id: string | null): Premise | undefined {
  return id === null ? undefined : rules.premises.find((p) => p.id === id);
}

export function findMachine(rules: Rules, id: string): Machine | undefined {
  return rules.machines.find((m) => m.id === id);
}
