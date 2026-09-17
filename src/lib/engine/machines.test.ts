import { describe, expect, it } from "vitest";
import { YEAR1_RULES } from "@/lib/rules";
import {
  advanceMachines,
  capacityFor,
  depreciationFor,
  isOperable,
  maintenanceFor,
  purchasedMachines,
  type MachineCopy,
} from "@/lib/engine/machines";

const owned: MachineCopy[] = [
  { uid: "m1", typeId: "1", seasonsDepreciated: 0 },
  { uid: "m2", typeId: "5", seasonsDepreciated: 0 },
];

const spent: MachineCopy[] = [{ uid: "old", typeId: "1", seasonsDepreciated: 8 }];

describe("machine register", () => {
  it("charges maintenance on every owned machine, installed or idle", () => {
    expect(maintenanceFor(owned, YEAR1_RULES)).toBe(1800 + 1300);
  });

  it("charges depreciation on every machine inside its eight-season life", () => {
    expect(depreciationFor(owned, YEAR1_RULES)).toBe(4375 + 3500);
  });

  it("counts capacity only for machines named as installed", () => {
    expect(capacityFor(["m1"], owned, YEAR1_RULES)).toBe(72000);
    expect(capacityFor(["m1", "m2"], owned, YEAR1_RULES)).toBe(117000);
    expect(capacityFor([], owned, YEAR1_RULES)).toBe(0);
  });

  it("stops depreciating and stops producing after eight seasons", () => {
    expect(isOperable(spent[0]!, YEAR1_RULES)).toBe(false);
    expect(depreciationFor(spent, YEAR1_RULES)).toBe(0);
    expect(capacityFor(["old"], spent, YEAR1_RULES)).toBe(0);
  });

  it("still charges maintenance on a fully depreciated machine you own", () => {
    expect(maintenanceFor(spent, YEAR1_RULES)).toBe(1800);
  });

  it("ages machines by one season and never past their life", () => {
    expect(advanceMachines(owned, YEAR1_RULES)[0]!.seasonsDepreciated).toBe(1);
    expect(advanceMachines(spent, YEAR1_RULES)[0]!.seasonsDepreciated).toBe(8);
  });

  it("names new machines without colliding with machines bought in an earlier season", () => {
    expect(purchasedMachines([{ typeId: "1", qty: 2 }], 0).map((m) => m.uid)).toEqual([
      "new-0",
      "new-1",
    ]);
    expect(purchasedMachines([{ typeId: "1", qty: 1 }], 1).map((m) => m.uid)).toEqual(["new-1"]);
    expect(
      purchasedMachines(
        [
          { typeId: "1", qty: 1 },
          { typeId: "5", qty: 1 },
        ],
        2,
      ).map((m) => m.uid),
    ).toEqual(["new-2", "new-3"]);
  });

  it("carries the bought machine's type", () => {
    expect(purchasedMachines([{ typeId: "5", qty: 1 }], 0)[0]!.typeId).toBe("5");
  });
});
