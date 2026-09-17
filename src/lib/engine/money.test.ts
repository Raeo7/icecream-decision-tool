import { describe, expect, it } from "vitest";
import { cost, sh } from "@/lib/engine/money";

describe("sh", () => {
  it("rounds to whole shekels", () => {
    expect(sh(1759.99)).toBe(1760);
    expect(sh(1760.4)).toBe(1760);
  });

  it("rounds halves away from zero, like Excel", () => {
    expect(sh(2.5)).toBe(3);
    expect(sh(-2.5)).toBe(-3);
  });

  it("leaves whole numbers and zero alone", () => {
    expect(sh(23800)).toBe(23800);
    expect(sh(0)).toBe(0);
  });
});

describe("cost", () => {
  it("should store a spend as a negative figure", () => {
    // #given a rounded cost
    const spend = 17000;

    // #when it is recorded on the statement
    const line = cost(spend);

    // #then it reads as a negative
    expect(line).toBe(-17000);
  });

  it("should round before negating", () => {
    // #given a cost with a fraction of a shekel
    const spend = 1759.99;

    // #when it is recorded
    const line = cost(spend);

    // #then it is a whole negative shekel figure
    expect(line).toBe(-1760);
  });

  it("should return a positive zero for a zero cost", () => {
    // #given a season with no premise, no machines and no loan
    const nothingSpent = 0;

    // #when the line is recorded
    const line = cost(nothingSpent);

    // #then it is plain zero, not negative zero, which would render as "-0"
    expect(Object.is(line, 0)).toBe(true);
  });

  it("should render a zero cost without a minus sign", () => {
    // #given a zero cost line
    const line = cost(0);

    // #when it is displayed
    const shown = line.toLocaleString("en-US");

    // #then the user sees no stray minus sign
    expect(shown).toBe("0");
  });
});
