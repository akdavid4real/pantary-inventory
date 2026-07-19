import { useCallback, useEffect, useState } from "react";
import { hasAuthSession } from "../services/api";

/** Canonical dashboard/utility page labels keyed by URL path. */
const pageByPath: Record<string, string> = {
  "/": "landing",
  "/dashboard": "Home",
  "/home": "Home",
  "/meals": "Meals",
  "/pantry": "Pantry",
  "/grocery": "Grocery",
  "/favorites": "Favorites",
  "/my-recipes": "My Recipes",
  "/explore": "Explore",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/food-scan": "Food Scan",
  "/login": "login",
  "/sign-up": "sign-up",
  "/forgot-password": "forgot-password",
  "/reset-password": "reset-password",
  "/notifications": "notifications",
  "/add-edit-pantry-item": "add-edit-pantry-item",
  "/add-edit-recipe": "add-edit-recipe",
  "/cooking-mode": "cooking-mode",
  "/generate-shopping-list": "generate-shopping-list",
  "/recipe-details": "recipe-details",
  "/onboarding": "onboarding-1",
  "/onboarding-1": "onboarding-1",
  "/onboarding-2": "onboarding-2",
  "/onboarding-3": "onboarding-3",
  "/onboarding-4": "onboarding-4",
};

/** Multi-word dashboard labels that must survive slug → page reverse mapping. */
const titledDashboardPages = [
  "Food Scan",
  "My Recipes",
] as const;

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Page ids never include a leading slash.
 * Browser URLs always do (except landing "/").
 * Accept both so reloads and onNavigate("/recipes/…") stay in sync.
 */
export function normalizePageId(page: string) {
  const trimmed = page.trim();
  if (!trimmed || trimmed === "/") {
    return "landing";
  }
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "") || "landing";
}

/** Return a valid onboarding step for route labels, slugs, and URL paths. */
export function getOnboardingStep(page: string): number | null {
  const normalized = normalizePageId(page)
    .toLowerCase()
    .replace(/\s+/g, "-");
  const match = normalized.match(/^onboarding(?:-([1-4]))?$/);
  return match ? Number(match[1] ?? 1) : null;
}

export function getPathFromPage(page: string) {
  const id = normalizePageId(page);

  const onboardingStep = getOnboardingStep(id);
  if (onboardingStep !== null) {
    return `/onboarding-${onboardingStep}`;
  }

  if (id === "landing") {
    return "/";
  }
  if (id === "Home" || id === "home") {
    return "/dashboard";
  }

  // Deep links already look like recipes/:id, meals/week/:date, etc.
  if (id.includes("/")) {
    return `/${id}`;
  }

  const knownTitle = titledDashboardPages.find(
    (label) => label.toLowerCase() === id.toLowerCase(),
  );
  if (knownTitle) {
    return `/${knownTitle.toLowerCase().replace(/ /g, "-")}`;
  }

  return `/${id.toLowerCase().replace(/ /g, "-")}`;
}

export function getPageFromPath(currentPath = window.location.pathname) {
  const pathname = currentPath.replace(/\/+$/, "") || "/";
  if (pageByPath[pathname]) {
    return pageByPath[pathname];
  }

  const bare = normalizePageId(pathname);
  if (bare === "landing") {
    return "landing";
  }

  // Keep deep links like recipes/:id, cooking/:id, meals/week/:date intact.
  if (bare.includes("/")) {
    return bare;
  }

  // Reverse /food-scan → "Food Scan", /pantry → "Pantry", etc.
  const titled = titleCaseSlug(bare);
  const knownTitle = titledDashboardPages.find(
    (label) => label.toLowerCase() === titled.toLowerCase(),
  );
  return knownTitle ?? titled;
}

/**
 * Resolve any navigate target (label, slug, or absolute path) into a page id.
 */
export function resolvePageForAuth(page: string, authenticated = hasAuthSession()) {
  const asPath = page.startsWith("/") ? page : getPathFromPage(page);
  const id = getPageFromPath(asPath);

  if (authenticated && (id === "login" || id === "sign-up")) {
    return "Home";
  }

  return id;
}

export function useAppNavigation() {
  const [page, setPage] = useState(() => resolvePageForAuth(getPageFromPath()));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

  useEffect(() => {
    const syncRouteFromLocation = () => {
      const resolvedPage = resolvePageForAuth(getPageFromPath());
      const canonicalPath = getPathFromPage(resolvedPage);

      if (window.location.pathname !== canonicalPath) {
        window.history.replaceState({}, "", canonicalPath);
      }

      setPage(resolvedPage);
    };

    window.addEventListener("popstate", syncRouteFromLocation);
    syncRouteFromLocation();

    return () => {
      window.removeEventListener("popstate", syncRouteFromLocation);
    };
  }, []);

  const navigate = useCallback((nextPage: string) => {
    const resolvedPage = resolvePageForAuth(nextPage);
    const nextPath = getPathFromPage(resolvedPage);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPage(resolvedPage);
  }, []);

  return { page, navigate };
}
