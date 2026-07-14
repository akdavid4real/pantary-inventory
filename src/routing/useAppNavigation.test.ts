import { describe, expect, it } from "vitest";
import { getPageFromPath } from "./useAppNavigation";

describe("getPageFromPath", () => {
  it("maps known routes and removes leading slashes from generated routes", () => {
    expect(getPageFromPath("/pantry")).toBe("Pantry");
    expect(getPageFromPath("/recipes/recipe-1")).toBe("recipes/recipe-1");
    expect(getPageFromPath("/meal-week/2026-07-14")).toBe("meal-week/2026-07-14");
    expect(getPageFromPath("/shopping-lists/list-1/review")).toBe("shopping-lists/list-1/review");
    expect(getPageFromPath("/cooking/session-1")).toBe("cooking/session-1");
  });
});
