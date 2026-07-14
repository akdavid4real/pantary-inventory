import { describe, expect, it } from "vitest";
import { buildOnboardingPayload, filterOnboardingIngredients, recommendedNutrition } from "./Onboarding";
import type { Ingredient } from "../../types/inventory";

const ingredients: Ingredient[] = [
  { id: "rice", name: "Rice", category: "Staples", defaultUnit: "g", storageLocation: "PANTRY" },
  { id: "egg", name: "Egg", category: "Proteins", defaultUnit: "piece", storageLocation: "FRIDGE" },
];

describe("onboarding state helpers", () => {
  it("uses the required recommended nutrition values", () => {
    expect(recommendedNutrition).toEqual({ calories: 2000, protein: 120, carbs: 230, fat: 65 });
  });

  it("filters the catalog by search and category", () => {
    expect(filterOnboardingIngredients(ingredients, "rice", "All").map((item) => item.id)).toEqual(["rice"]);
    expect(filterOnboardingIngredients(ingredients, "", "Fridge").map((item) => item.id)).toEqual(["egg"]);
  });

  it("builds the structured onboarding payload without losing custom values or quantities", () => {
    const payload = buildOnboardingPayload({
      displayName: "Ada Test",
      diet: "Balanced",
      allergies: ["Tiger nuts"],
      avoidedIngredients: ["Okra"],
      nutrition: recommendedNutrition,
      minutes: "30",
      preferNigerianMeals: false,
      comfort: "Adventurous",
      servings: 4,
      pantrySelections: [{ ingredientId: "rice", name: "Rice", category: "Staples", storageLocation: "PANTRY", quantity: 2, unit: "kg" }],
    });
    expect(payload).toMatchObject({ displayName: "Ada Test", allergyList: ["Tiger nuts"], preferNigerianMeals: false, cookingComfort: "Adventurous", defaultServings: 4 });
    expect(payload.pantryItems).toEqual([{ ingredientId: "rice", quantity: 2, unit: "kg" }]);
  });
});
