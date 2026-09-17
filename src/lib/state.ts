import { blankDecision, type Decision } from "@/lib/engine/types";
import { year2Estimate, type Rules } from "@/lib/rules";

export const STATE_VERSION = 1;
const STORAGE_KEY = "icecream-decision-tool";

export const SEASONS = ["winter", "spring", "summer", "autumn"] as const;
export type Season = (typeof SEASONS)[number];

export interface SeasonRecord {
  season: Season;
  /** True for a season actually played, where unitsSold is the trainer's real allocation. */
  played: boolean;
  decision: Decision;
  /** Ice creams the trainer allocated, or my own projection for a season still to come. */
  unitsSold: number;
}

/** Three allocations to judge a Year 2 option against, since the trainer decides the real one. */
export interface Allocations {
  pessimistic: number;
  expected: number;
  optimistic: number;
}

export interface Scenario {
  id: string;
  name: string;
  decision: Decision;
  allocations: Allocations;
}

export interface RecommendationValue {
  scenarioId: string | null;
  why: string;
  assumption: string;
}

export interface GameState {
  version: number;
  year1: SeasonRecord[];
  year2Rules: Rules;
  scenarios: Scenario[];
  /** My own workbook figures for winter, to check this app against. */
  verification: { netProfit: number | null; closingCash: number | null };
  recommendation: RecommendationValue;
}

/** Year 1 winter as the company actually played it, recorded from my own workbook. */
function recordedWinter(): SeasonRecord {
  return {
    season: "winter",
    played: true,
    unitsSold: 20000,
    decision: {
      rentals: [{ premiseId: "D", installedUids: ["new-0"], production: 70000 }],
      machinePurchases: [{ typeId: "1", qty: 1 }],
      milkTons: 3.5,
      marketInvestment: 5000,
      salesRequest: 70000,
      loan: { principal: 50000, termSeasons: 8 },
    },
  };
}

/**
 * How many seasons have actually been played.
 *
 * A season can only be played after the one before it, so this is the leading run rather than a
 * count of ticked boxes. Everything after it is my own projection and is not counted
 * towards the year or carried into Year 2.
 */
export function playedCount(seasons: SeasonRecord[]): number {
  let played = 0;
  for (const season of seasons) {
    if (!season.played) break;
    played += 1;
  }
  return played;
}

/**
 * Two Year 2 winter options to start from, so the comparison has something in it on first load.
 *
 * They are starting points, not advice: every figure is editable and both are meant to be changed
 * once the trainer publishes the Year 2 rules. What they are chosen to do is differ in the way
 * that matters, which is scale. One runs the machine the company already owns; the other buys a
 * second and borrows to do it. Both keep cash legal at every allocation below.
 *
 * The allocations are set at roughly four tenths, seven tenths and all of the request, because
 * the trainer decides the real one and the point of three cases is to see how far the answer
 * moves between them.
 */
function steadyOption(): Scenario {
  return {
    id: "a",
    name: "Steady",
    decision: {
      rentals: [{ premiseId: "D", installedUids: ["new-0"], production: 70000 }],
      machinePurchases: [],
      milkTons: 3.5,
      marketInvestment: 5000,
      salesRequest: 70000,
      loan: { principal: 38000, termSeasons: 8 },
    },
    allocations: { pessimistic: 30000, expected: 50000, optimistic: 70000 },
  };
}

function scaleUpOption(): Scenario {
  return {
    id: "b",
    name: "Scale up",
    decision: {
      rentals: [{ premiseId: "E", installedUids: ["new-0", "new-1"], production: 140000 }],
      machinePurchases: [{ typeId: "1", qty: 1 }],
      milkTons: 7,
      marketInvestment: 8000,
      salesRequest: 140000,
      loan: { principal: 146000, termSeasons: 8 },
    },
    allocations: { pessimistic: 60000, expected: 100000, optimistic: 140000 },
  };
}

export function defaultState(): GameState {
  return {
    version: STATE_VERSION,
    year1: [
      recordedWinter(),
      ...SEASONS.slice(1).map((season) => ({
        season,
        played: false,
        decision: blankDecision(),
        unitsSold: 0,
      })),
    ],
    year2Rules: year2Estimate(),
    scenarios: [steadyOption(), scaleUpOption()],
    verification: { netProfit: null, closingCash: null },
    recommendation: { scenarioId: null, why: "", assumption: "" },
  };
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/** Returns null for anything untrustworthy, so the caller can fall back to a fresh game. */
export function deserialize(raw: string): GameState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Partial<GameState>;
    if (candidate.version !== STATE_VERSION) return null;
    if (!Array.isArray(candidate.year1) || candidate.year1.length !== 4) return null;
    if (!Array.isArray(candidate.scenarios) || candidate.scenarios.length < 2) return null;
    return candidate as GameState;
  } catch {
    return null;
  }
}

/** Where a save is put aside when it cannot be read, instead of being written over. */
const SALVAGE_KEY = `${STORAGE_KEY}-unreadable`;

export function loadState(): GameState {
  if (typeof window === "undefined") return defaultState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return defaultState();

  const state = deserialize(raw);
  if (state !== null) return state;

  // A save this version cannot read is still my own work. Falling through to a fresh game
  // would be written straight over it by the next keystroke, so the original is kept aside.
  try {
    window.localStorage.setItem(SALVAGE_KEY, raw);
  } catch {
    // Nothing more can be done for it here; the fresh game below still works.
  }
  return defaultState();
}

export function saveState(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(state));
  } catch {
    // Private windows and full quotas both throw. The app still works in memory.
  }
}
