import { describe, expect, it } from "vitest";
import {
  getPageFromPath,
  getOnboardingStep,
  getPathFromPage,
  normalizePageId,
  resolvePageForAuth,
} from "./useAppNavigation";

describe("getPageFromPath", () => {
  it("maps known routes and keeps deep links intact", () => {
    expect(getPageFromPath("/")).toBe("landing");
    expect(getPageFromPath("/dashboard")).toBe("Home");
    expect(getPageFromPath("/pantry")).toBe("Pantry");
    // Any recipe id should pass through as a deep link page id.
    expect(getPageFromPath("/recipes/recipe-1")).toBe("recipes/recipe-1");
    expect(getPageFromPath("/meals/week/2026-07-14")).toBe("meals/week/2026-07-14");
    expect(getPageFromPath("/grocery/lists/list-1")).toBe("grocery/lists/list-1");
    expect(getPageFromPath("/cooking/session-1")).toBe("cooking/session-1");
    expect(getPageFromPath("/auth/callback")).toBe("auth/callback");
  });

  it("restores multi-word dashboard pages from URL slugs on reload", () => {
    expect(getPageFromPath("/food-scan")).toBe("Food Scan");
    expect(getPageFromPath("/my-recipes")).toBe("My Recipes");
    expect(getPathFromPage("Food Scan")).toBe("/food-scan");
    expect(getPathFromPage("My Recipes")).toBe("/my-recipes");
  });

  it("maps onboarding routes correctly", () => {
    expect(getPageFromPath("/onboarding")).toBe("onboarding-1");
    expect(getPageFromPath("/onboarding-2")).toBe("onboarding-2");
    expect(getPathFromPage("onboarding-2")).toBe("/onboarding-2");
    expect(getPathFromPage("Onboarding 1")).toBe("/onboarding-1");
    expect(getOnboardingStep("/onboarding-4/")).toBe(4);
    expect(getOnboardingStep("Onboarding 2")).toBe(2);
    expect(getOnboardingStep("onboarding-5")).toBeNull();
  });
});

describe("normalizePageId / getPathFromPage", () => {
  it("accepts leading-slash navigate targets used by routes.recipe()", () => {
    expect(normalizePageId("/recipes/abc")).toBe("recipes/abc");
    expect(getPathFromPage("/recipes/abc")).toBe("/recipes/abc");
    expect(getPathFromPage("recipes/abc")).toBe("/recipes/abc");
    expect(resolvePageForAuth("/recipes/any-id")).toBe("recipes/any-id");
  });
});

describe("resolvePageForAuth", () => {
  it("redirects authenticated users away from guest-only auth pages", () => {
    expect(resolvePageForAuth("login", true)).toBe("Home");
    expect(resolvePageForAuth("sign-up", true)).toBe("Home");
    expect(resolvePageForAuth("landing", true)).toBe("landing");
    expect(resolvePageForAuth("login", false)).toBe("login");
    expect(resolvePageForAuth("Food Scan", true)).toBe("Food Scan");
    expect(resolvePageForAuth("/food-scan", true)).toBe("Food Scan");
  });
});
