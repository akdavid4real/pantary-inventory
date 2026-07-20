import { Ingredient } from "../types/inventory";

export const unitLabels: Record<string, string> = {
  g: "grams (g)",
  kg: "kilograms (kg)",
  ml: "millilitres (ml)",
  l: "litres (L)",
  cup: "cups",
  derica: "derica (approx.)",
  tbsp: "tablespoons",
  tsp: "teaspoons",
  piece: "pieces",
  tuber: "tubers (approx.)",
};

export function ingredientUnitOptions(ingredient?: Pick<Ingredient, "defaultUnit" | "conversions"> | null) {
  if (!ingredient) return ["g"];
  const units = new Set<string>([ingredient.defaultUnit]);
  const normalized = ingredient.defaultUnit.toLowerCase();
  if (["g", "kg"].includes(normalized)) {
    units.add("g");
    units.add("kg");
  }
  if (["ml", "l"].includes(normalized)) {
    units.add("ml");
    units.add("l");
    units.add("cup");
    units.add("tbsp");
    units.add("tsp");
  }
  if (["piece", "pieces", "pcs"].includes(normalized)) units.add("piece");
  ingredient.conversions?.forEach((conversion) => units.add(conversion.fromUnit));
  return [...units];
}

export function defaultIngredientQuantity(unit: string) {
  if (unit === "g" || unit === "ml") return 500;
  if (unit === "kg" || unit === "l" || unit === "cup" || unit === "derica" || unit === "tuber") return 1;
  if (unit === "piece") return 6;
  return 1;
}

export function quantityInputConstraints(unit: string) {
  const normalized = unit.trim().toLowerCase();
  const isWholeItem = ["item", "items", "piece", "pieces", "pc", "pcs"].includes(normalized);
  return isWholeItem
    ? { min: 1, step: 1 }
    : { min: 0.01, step: 0.01 };
}

export function unitHelp(ingredient?: Pick<Ingredient, "conversions"> | null) {
  const local = ingredient?.conversions?.filter((conversion) => !["g", "kg", "ml", "l"].includes(conversion.fromUnit));
  if (!local?.length) return "Choose the unit you actually use at home.";
  return local
    .map((conversion) => `1 ${conversion.fromUnit} ≈ ${Number(conversion.multiplier.toFixed(2))} ${conversion.toUnit}`)
    .join(" · ");
}
