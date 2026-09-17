import { describe, expect, it } from "vitest";
import { YEAR1_RULES } from "@/lib/rules";
import { runChain, type ChainEntry } from "@/lib/engine/chain";
import { blankDecision, emptyPosition } from "@/lib/engine/types";

const sitOut: ChainEntry = { decision: blankDecision(), unitsSold: 0, rules: YEAR1_RULES };

describe("runChain", () => {
  it("feeds each season's closing position into the next", () => {
    const results = runChain(emptyPosition(100000), [sitOut, sitOut]);
    expect(results[0]!.cash.closing).toBe(69000);
    expect(results[1]!.cash.opening).toBe(69000);
    expect(results[1]!.cash.closing).toBe(38000);
  });

  it("accumulates the tax loss pool across seasons", () => {
    const results = runChain(emptyPosition(100000), [sitOut, sitOut]);
    expect(results[1]!.closing.taxLossPool).toBe(62000);
  });

  it("returns nothing for no seasons", () => {
    expect(runChain(emptyPosition(100000), [])).toEqual([]);
  });
});
