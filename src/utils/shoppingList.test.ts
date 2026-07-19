import { describe, expect, it } from "vitest";
import { normalizePurchaseReview, normalizeShoppingList } from "./shoppingList";

describe("shopping-list response normalization", () => {
  it("supplies an empty items array when an older list response omits it", () => {
    const response = { id: "list-1", title: "My list", status: "ACTIVE" };
    expect(normalizeShoppingList(response as never)?.items).toEqual([]);
  });

  it("supplies an empty items array when a purchase review omits it", () => {
    const response = { listId: "list-1" };
    expect(normalizePurchaseReview(response as never).items).toEqual([]);
  });
});
