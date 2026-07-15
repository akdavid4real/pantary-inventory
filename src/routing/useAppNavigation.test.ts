import { describe, expect, it } from "vitest";
import { getPageFromPath, resolvePageForAuth } from "./useAppNavigation";

describe("getPageFromPath", () => {
  it("maps known routes and removes leading slashes from generated routes", () => {
    expect(getPageFromPath("/")).toBe("landing");
    expect(getPageFromPath("/dashboard")).toBe("Home");
    expect(getPageFromPath("/pantry")).toBe("Pantry");
    expect(getPageFromPath("/recipes/recipe-1")).toBe("recipes/recipe-1");
    expect(getPageFromPath("/meal-week/2026-07-14")).toBe("meal-week/2026-07-14");
    expect(getPageFromPath("/shopping-lists/list-1/review")).toBe("shopping-lists/list-1/review");
    expect(getPageFromPath("/cooking/session-1")).toBe("cooking/session-1");
  });
});

describe("resolvePageForAuth", () => {
  it("redirects authenticated users away from guest-only auth pages", () => {
    expect(resolvePageForAuth("login", true)).toBe("Home");
    expect(resolvePageForAuth("sign-up", true)).toBe("Home");
    expect(resolvePageForAuth("landing", true)).toBe("landing");
    expect(resolvePageForAuth("login", false)).toBe("login");
  });
});
