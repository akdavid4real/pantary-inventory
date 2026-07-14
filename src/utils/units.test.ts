import { describe, expect, it } from "vitest";
import { ingredientUnitOptions, unitHelp } from "./units";

describe("ingredient-aware unit options", () => {
  it("offers Nigerian dry measures only when the ingredient has conversions", () => {
    const rice = { defaultUnit: "g", conversions: [{ fromUnit: "cup", toUnit: "g", multiplier: 200 }, { fromUnit: "derica", toUnit: "g", multiplier: 750 }] };
    expect(ingredientUnitOptions(rice)).toEqual(["g", "kg", "cup", "derica"]);
    expect(unitHelp(rice)).toContain("1 derica ≈ 750 g");
  });

  it("keeps count-based food separate from mass and volume", () => {
    expect(ingredientUnitOptions({ defaultUnit: "piece", conversions: [] })).toEqual(["piece"]);
  });
});
