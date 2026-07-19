import { PurchaseReview, ShoppingList } from "../types/inventory";

/** Keep the UI compatible with older API responses that omitted relations. */
export function normalizeShoppingList(value: ShoppingList | null): ShoppingList | null {
  if (!value) return null;
  return {
    ...value,
    items: Array.isArray(value.items) ? value.items : [],
  };
}

export function normalizePurchaseReview(value: PurchaseReview): PurchaseReview {
  return {
    ...value,
    items: Array.isArray(value.items) ? value.items : [],
  };
}
