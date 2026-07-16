import { Ingredient, Paginated, RecipeSummary } from "../types/inventory";
import { cachedApi, getCachedApiValue, invalidateApiCache } from "./api";

const RECIPE_CATALOG_PATH = "/recipes?page=1&limit=250";
const INGREDIENT_CATALOG_PATH = "/ingredients?page=1&limit=250";

export function sortImageFirst<T extends { imageUrl?: string | null }>(items: T[]) {
  return [...items].sort((left, right) =>
    Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl)),
  );
}

export function getCachedRecipeCatalog() {
  const cached = getCachedApiValue<Paginated<RecipeSummary>>(RECIPE_CATALOG_PATH);
  return cached ? sortImageFirst(cached.items) : [];
}

export async function loadRecipeCatalog(force = false) {
  const page = await cachedApi<Paginated<RecipeSummary>>(RECIPE_CATALOG_PATH, {
    ttlMs: 5 * 60_000,
    persist: true,
    force,
  });
  return sortImageFirst(page.items);
}

export function invalidateRecipeCatalog() {
  invalidateApiCache(RECIPE_CATALOG_PATH);
}

export function getCachedIngredientCatalog() {
  const cached = getCachedApiValue<Paginated<Ingredient>>(INGREDIENT_CATALOG_PATH);
  return cached ? sortImageFirst(cached.items) : [];
}

export async function loadIngredientCatalog(force = false) {
  const page = await cachedApi<Paginated<Ingredient>>(INGREDIENT_CATALOG_PATH, {
    ttlMs: 15 * 60_000,
    persist: true,
    force,
  });
  return sortImageFirst(page.items);
}
