import { describe, expect, it } from "vitest";
import {
  getPageFromPath,
  getPathFromPage,
  resolvePageForAuth,
} from "./useAppNavigation";

describe("getPageFromPath", () => {
  it("maps known routes and removes leading slashes from generated routes", () => {
    expect(getPageFromPath("/")).toBe("landing");
    expect(getPageFromPath("/dashboard")).toBe("Home");
    expect(getPageFromPath("/pantry")).toBe("Pantry");
    expect(getPageFromPath("/recipes/recipe-1")).toBe("recipes/recipe-1");
    expect(getPageFromPath("/meals/week/2026-07-14")).toBe("meals/week/2026-07-14");
    expect(getPageFromPath("/grocery/lists/list-1")).toBe("grocery/lists/list-1");
    expect(getPageFromPath("/cooking/session-1")).toBe("cooking/session-1");
  });

  it("restores multi-word dashboard pages from URL slugs on reload", () => {
    expect(getPageFromPath("/food-scan")).toBe("Food Scan");
    expect(getPageFromPath("/my-recipes")).toBe("My Recipes");
    expect(getPathFromPage("Food Scan")).toBe("/food-scan");
    expect(getPathFromPage("My Recipes")).toBe("/my-recipes");
  });
});

describe("resolvePageForAuth", () => {
  it("redirects authenticated users away from guest-only auth pages", () => {
    expect(resolvePageForAuth("login", true)).toBe("Home");
    expect(resolvePageForAuth("sign-up", true)).toBe("Home");
    expect(resolvePageForAuth("landing", true)).toBe("landing");
    expect(resolvePageForAuth("login", false)).toBe("login");
    expect(resolvePageForAuth("Food Scan", true)).toBe("Food Scan");
  });
});
