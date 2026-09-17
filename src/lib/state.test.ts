import { describe, expect, it } from "vitest";
import { runChain } from "@/lib/engine/chain";
import { runSeason } from "@/lib/engine/season";
import { emptyPosition } from "@/lib/engine/types";
import { STARTING_CASH, YEAR1_RULES } from "@/lib/rules";
import { defaultState, deserialize, serialize, SEASONS } from "@/lib/state";

describe("state", () => {
  it("should round-trip through JSON", () => {
    // #given a fresh game
    const state = defaultState();

    // #then saving and loading it changes nothing
    expect(deserialize(serialize(state))).toEqual(state);
  });

  it("should refuse malformed JSON rather than returning a broken game", () => {
    expect(deserialize("not json")).toBeNull();
  });

  it("should refuse a save written by an incompatible version", () => {
    // #given a save claiming a version this build does not know
    const future = JSON.stringify({ ...defaultState(), version: 999 });

    // #then it is not believed
    expect(deserialize(future)).toBeNull();
  });

  it("should refuse a save that is missing seasons", () => {
    // #given a save with a short year
    const short = JSON.stringify({ ...defaultState(), year1: [] });

    // #then it is not believed, because the pages index every season
    expect(deserialize(short)).toBeNull();
  });

  it("should seed winter with the season the team actually played", () => {
    // #given a fresh game
    const winter = defaultState().year1[0]!;

    // #then it carries the team's own recorded winter, not a blank
    expect(winter.played).toBe(true);
    expect(winter.unitsSold).toBe(20000);
    expect(winter.decision.rentals[0]?.premiseId).toBe("D");
    expect(winter.decision.milkTons).toBe(3.5);
    expect(winter.decision.loan).toEqual({ principal: 50000, termSeasons: 8 });
  });

  it("should leave the seasons still to come for the team to fill in", () => {
    // #given a fresh game
    const later = defaultState().year1.slice(1);

    // #then spring, summer and autumn are the team's own projection, not an assumption
    expect(later.map((r) => r.season)).toEqual([...SEASONS.slice(1)]);
    expect(later.every((r) => !r.played)).toBe(true);
    expect(later.every((r) => r.unitsSold === 0)).toBe(true);
  });

  it("should start with two Year 2 options to compare", () => {
    // #then the assignment's minimum is there from the first load
    expect(defaultState().scenarios.length).toBeGreaterThanOrEqual(2);
  });

  it("should start with two options that actually differ", () => {
    // #given the two options a fresh game offers
    const [a, b] = defaultState().scenarios;

    // #then they are not the same decision under two names, which would compare nothing
    expect(a!.decision).not.toEqual(b!.decision);
    expect(a!.allocations).not.toEqual(b!.allocations);
  });

  it("should offer options that break no rule at any allocation", () => {
    // #given each seeded option run from the position winter closes at
    const state = defaultState();
    const winter = state.year1[0]!;
    const opening = runChain(emptyPosition(STARTING_CASH), [
      { decision: winter.decision, unitsSold: winter.unitsSold, rules: YEAR1_RULES },
    ])[0]!.closing;

    // #then none of them starts the user off with a plan the rules forbid
    for (const scenario of state.scenarios) {
      for (const allocated of Object.values(scenario.allocations)) {
        const result = runSeason(opening, scenario.decision, allocated, state.year2Rules);
        expect(result.flags.filter((f) => f.severity === "violation")).toEqual([]);
      }
    }
  });

  it("should ship the workbook figures and the recommendation with the app", () => {
    // #given a fresh visitor, who has no saved game of their own
    const state = defaultState();

    // #then the submission is on the page rather than only in my browser. A local storage save
    // #then is per visitor, so anything typed in here would be invisible to anyone else opening
    // #then the site, and the assignment asks for the recommendation to be on the page.
    expect(state.verification).toEqual({ netProfit: -75175, closingCash: 37950 });
    expect(state.recommendation.scenarioId).not.toBeNull();
    expect(state.recommendation.why.length).toBeGreaterThan(80);
    expect(state.recommendation.assumption.length).toBeGreaterThan(80);
  });

  it("should reconcile against my workbook, not against a figure it invented", () => {
    // #given the seeded workbook figures and the season the engine computes from the decision
    const state = defaultState();
    const winter = state.year1[0]!;
    const result = runChain(emptyPosition(STARTING_CASH), [
      { decision: winter.decision, unitsSold: winter.unitsSold, rules: YEAR1_RULES },
    ])[0]!;

    // #then the two agree, which is what the assignment asks to be shown
    expect(result.pnl.netProfit).toBe(state.verification.netProfit);
    expect(result.cash.closing).toBe(state.verification.closingCash);
  });

  it("should point the recommendation at an option that exists", () => {
    // #given the chosen strategy
    const state = defaultState();

    // #then it names one of the options on the page, so the panel can show its figures
    expect(state.scenarios.map((s) => s.id)).toContain(state.recommendation.scenarioId);
  });

  it("should mark the Year 2 rules as an estimate", () => {
    // #then nothing on the Year 2 page can present a Year 1 price as a confirmed Year 2 one
    expect(defaultState().year2Rules.isEstimate).toBe(true);
  });
});
