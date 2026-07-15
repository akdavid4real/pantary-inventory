import { useCallback, useEffect, useState } from "react";

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
  const [page, setPage] = useState(getPageFromPath);

  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromPath());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigate = useCallback((nextPage: string) => {
    const nextPath = getPathFromPage(nextPage);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPage(getPageFromPath(nextPath));
  }, []);

  return { page, navigate };
}
