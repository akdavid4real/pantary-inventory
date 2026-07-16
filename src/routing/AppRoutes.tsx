import { ComponentType, lazy, ReactNode, Suspense } from "react";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { Login } from "../pages/auth/Login";
import { PasswordRecovery } from "../pages/auth/PasswordRecovery";
import { SignUp } from "../pages/auth/SignUp";
import { LandingPage } from "../pages/public/LandingPage";
import { ScreenProps } from "../types/navigation";

type AppRoutesProps = ScreenProps & {
  page: string;
};

type LazyPage = ComponentType<ScreenProps>;

const Analytics = lazy(() =>
  import("../pages/dashboard/Analytics").then((module) => ({ default: module.Analytics })),
);
const CookingMode = lazy(() =>
  import("../pages/dashboard/CookingMode").then((module) => ({ default: module.CookingMode })),
);
const ExploreRecipes = lazy(() =>
  import("../pages/dashboard/ExploreRecipes").then((module) => ({ default: module.ExploreRecipes })),
);
const Favorites = lazy(() =>
  import("../pages/dashboard/Favorites").then((module) => ({ default: module.Favorites })),
);
const FoodScan = lazy(() =>
  import("../pages/dashboard/FoodScan").then((module) => ({ default: module.FoodScan })),
);
const Grocery = lazy(() =>
  import("../pages/dashboard/Grocery").then((module) => ({ default: module.Grocery })),
);
const Meals = lazy(() =>
  import("../pages/dashboard/Meals").then((module) => ({ default: module.Meals })),
);
const MyRecipes = lazy(() =>
  import("../pages/dashboard/MyRecipes").then((module) => ({ default: module.MyRecipes })),
);
const Notifications = lazy(() =>
  import("../pages/dashboard/Notifications").then((module) => ({ default: module.Notifications })),
);
const Pantry = lazy(() =>
  import("../pages/dashboard/Pantry").then((module) => ({ default: module.Pantry })),
);
const PantryItemEditor = lazy(() =>
  import("../pages/dashboard/PantryItemEditor").then((module) => ({ default: module.PantryItemEditor })),
);
const RecipeDetails = lazy(() =>
  import("../pages/dashboard/RecipeDetails").then((module) => ({ default: module.RecipeDetails })),
);
const RecipeEditor = lazy(() =>
  import("../pages/dashboard/RecipeEditor").then((module) => ({ default: module.RecipeEditor })),
);
const Settings = lazy(() =>
  import("../pages/dashboard/Settings").then((module) => ({ default: module.Settings })),
);
const ShoppingListGenerator = lazy(() =>
  import("../pages/dashboard/ShoppingListGenerator").then((module) => ({
    default: module.ShoppingListGenerator,
  })),
);
const Onboarding = lazy(() =>
  import("../pages/onboarding/Onboarding").then((module) => ({ default: module.Onboarding })),
);

const dashboardPages: Record<string, LazyPage | typeof Dashboard> = {
  Analytics,
  Explore: ExploreRecipes,
  Favorites,
  "Food Scan": FoodScan,
  Grocery,
  Home: Dashboard,
  Meals,
  "My Recipes": MyRecipes,
  Pantry,
  Settings,
};

const utilityPages: Record<string, LazyPage> = {
  "add-edit-pantry-item": PantryItemEditor,
  "add-edit-recipe": RecipeEditor,
  "cooking-mode": CookingMode,
  "generate-shopping-list": ShoppingListGenerator,
  notifications: Notifications,
  "recipe-details": RecipeDetails,
};

function RouteFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center bg-[#f5f0e7] px-6 text-center text-sm text-[#5f6862]">
      Loading page…
    </div>
  );
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export function AppRoutes({ page, onNavigate }: AppRoutesProps) {
  // Normalize so reloads and onNavigate("/recipes/…") both match deep routes.
  const route = page.replace(/^\/+/, "").replace(/\/+$/, "") || "landing";

  if (route === "landing") {
    return <LandingPage />;
  }

  const editRecipeMatch = route.match(/^my-recipes\/([^/]+)\/edit$/);
  if (editRecipeMatch) {
    return (
      <LazyRoute>
        <RecipeEditor recipeId={editRecipeMatch[1]} onNavigate={onNavigate} />
      </LazyRoute>
    );
  }
  if (route === "my-recipes/new") {
    return (
      <LazyRoute>
        <RecipeEditor onNavigate={onNavigate} />
      </LazyRoute>
    );
  }
  const recipeMatch = route.match(/^recipes\/([^/]+)$/);
  if (recipeMatch) {
    return (
      <LazyRoute>
        <RecipeDetails recipeId={recipeMatch[1]} onNavigate={onNavigate} />
      </LazyRoute>
    );
  }

  const mealWeekMatch = route.match(/^meals\/week\/([^/]+)$/);
  if (mealWeekMatch) {
    return (
      <LazyRoute>
        <Meals weekDate={mealWeekMatch[1]} onNavigate={onNavigate} />
      </LazyRoute>
    );
  }

  const shoppingListMatch = route.match(/^grocery\/lists\/([^/]+)$/);
  if (shoppingListMatch) {
    return (
      <LazyRoute>
        <Grocery listId={shoppingListMatch[1]} onNavigate={onNavigate} />
      </LazyRoute>
    );
  }

  const cookingMatch = route.match(/^cooking\/([^/]+)$/);
  if (cookingMatch) {
    return (
      <LazyRoute>
        <CookingMode sessionId={cookingMatch[1]} onNavigate={onNavigate} />
      </LazyRoute>
    );
  }
  if (route === "login") {
    return <Login onNavigate={onNavigate} />;
  }

  if (route === "sign-up") {
    return <SignUp onNavigate={onNavigate} />;
  }

  if (route === "forgot-password" || route === "reset-password") {
    return <PasswordRecovery mode={route} onNavigate={onNavigate} />;
  }

  if (route.startsWith("onboarding")) {
    const step = Number(route.split("-")[1] || 1);
    return (
      <LazyRoute>
        <Onboarding step={step} onNavigate={onNavigate} />
      </LazyRoute>
    );
  }

  // Dashboard labels may arrive as "Food Scan" or already be exact map keys.
  const dashboardKey =
    (Object.keys(dashboardPages).find(
      (key) => key.toLowerCase() === route.toLowerCase() || key.toLowerCase().replace(/ /g, "-") === route.toLowerCase(),
    ) as keyof typeof dashboardPages | undefined) ??
    (route in dashboardPages ? (route as keyof typeof dashboardPages) : undefined);

  const DashboardPage = dashboardKey ? dashboardPages[dashboardKey] : undefined;
  if (DashboardPage) {
    if (dashboardKey === "Home") {
      return <DashboardPage onNavigate={onNavigate} />;
    }
    return (
      <LazyRoute>
        <DashboardPage onNavigate={onNavigate} />
      </LazyRoute>
    );
  }

  const UtilityPage = utilityPages[route];
  if (UtilityPage) {
    return (
      <LazyRoute>
        <UtilityPage onNavigate={onNavigate} />
      </LazyRoute>
    );
  }

  return <LandingPage />;
}
