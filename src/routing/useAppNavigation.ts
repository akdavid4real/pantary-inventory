import { useCallback, useEffect, useState } from "react";

const pageByPath: Record<string, string> = {
  "/": "Home",
  "/meals": "Meals",
  "/pantry": "Pantry",
  "/grocery": "Grocery",
  "/favorites": "Favorites",
  "/explore": "Explore",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

function getPageFromPath() {
  const currentPath = window.location.pathname;

  return pageByPath[currentPath] ?? currentPath.slice(1);
}

function getPathFromPage(page: string) {
  if (page === "Home") {
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

    setPage(nextPage);
  }, []);

  return { page, navigate };
}
