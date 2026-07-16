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

export function getPathFromPage(page: string) {
  if (page.startsWith("/")) {
    return page;
  }
  if (page === "Home") {
    return "/dashboard";
  }
  if (page === "landing") {
    return "/";
  }

  return `/${page.toLowerCase().replace(/ /g, "-")}`;
}

export function getPageFromPath(currentPath = window.location.pathname) {
  const normalized = currentPath.replace(/\/+$/, "") || "/";
  if (pageByPath[normalized]) {
    return pageByPath[normalized];
  }

  const bare = normalized.replace(/^\/+/, "");
  if (!bare) {
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

export function resolvePageForAuth(page: string, authenticated = hasAuthSession()) {
  if (authenticated && (page === "login" || page === "sign-up")) {
    return "Home";
  }

  return page;
}

export function useAppNavigation() {
  const [page, setPage] = useState(() => resolvePageForAuth(getPageFromPath()));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

  useEffect(() => {
    const syncRouteFromLocation = () => {
      const requestedPage = getPageFromPath();
      const resolvedPage = resolvePageForAuth(requestedPage);
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
