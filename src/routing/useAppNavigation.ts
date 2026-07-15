import { useCallback, useEffect, useState } from "react";
import { hasAuthSession } from "../services/api";

const pageByPath: Record<string, string> = {
  "/": "landing",
  "/dashboard": "Home",
  "/meals": "Meals",
  "/pantry": "Pantry",
  "/grocery": "Grocery",
  "/favorites": "Favorites",
  "/my-recipes": "My Recipes",
  "/explore": "Explore",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export function getPageFromPath(currentPath = window.location.pathname) {
  return pageByPath[currentPath] ?? currentPath.replace(/^\/+/, "");
}

export function resolvePageForAuth(page: string, authenticated = hasAuthSession()) {
  if (authenticated && (page === "login" || page === "sign-up")) {
    return "Home";
  }

  return page;
}

function getPathFromPage(page: string) {
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

export function useAppNavigation() {
  const [page, setPage] = useState(() => resolvePageForAuth(getPageFromPath()));

  useEffect(() => {
    const redirectAuthenticatedGuestRoute = () => {
      const requestedPage = getPageFromPath();
      const resolvedPage = resolvePageForAuth(requestedPage);

      if (resolvedPage !== requestedPage) {
        window.history.replaceState({}, "", getPathFromPage(resolvedPage));
      }

      setPage(resolvedPage);
    };

    const handlePopState = () => {
      redirectAuthenticatedGuestRoute();
    };

    window.addEventListener("popstate", handlePopState);
    redirectAuthenticatedGuestRoute();

    return () => {
      window.removeEventListener("popstate", handlePopState);
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
