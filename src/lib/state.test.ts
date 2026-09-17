import { describe, expect, it } from "vitest";
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
    expect(winter.decision.loan).toEqual({ principal: 50000, termSeasons: 4 });
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

  it("should mark the Year 2 rules as an estimate", () => {
    // #then nothing on the Year 2 page can present a Year 1 price as a confirmed Year 2 one
    expect(defaultState().year2Rules.isEstimate).toBe(true);
  });
});
