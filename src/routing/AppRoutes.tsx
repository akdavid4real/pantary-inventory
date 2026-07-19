import { Component, ComponentType, ErrorInfo, lazy, ReactNode, Suspense } from "react";
import { GoogleAuthCallback } from "../pages/auth/GoogleAuthCallback";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { Login } from "../pages/auth/Login";
import { PasswordRecovery } from "../pages/auth/PasswordRecovery";
import { SignUp } from "../pages/auth/SignUp";
import { LandingPage } from "../pages/public/LandingPage";
import { ScreenProps } from "../types/navigation";
import { getOnboardingStep, normalizePageId } from "./useAppNavigation";

type AppRoutesProps = ScreenProps & {
  page: string;
};

type LazyPage = ComponentType<ScreenProps>;

type RouteErrorBoundaryProps = { children: ReactNode };
type RouteErrorBoundaryState = { error: Error | null };

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route failed to render", { error, errorInfo });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="route-error" role="alert">
        <h1>That page couldn’t load</h1>
        <p>{this.state.error.message || "Please refresh and try again."}</p>
        <button type="button" onClick={() => window.location.reload()}>Refresh page</button>
      </main>
    );
  }
}

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

function RouteFallback({ isDashboard = true }: { isDashboard?: boolean }) {
  if (!isDashboard) {
    return (
      <div className="min-h-screen bg-[#faf7f0] p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg space-y-4 animate-pulse">
          <div className="h-8 bg-[#e4e9e1] rounded w-1/3 mx-auto" />
          <div className="h-4 bg-[#e4e9e1] rounded w-2/3 mx-auto" />
          <div className="h-64 bg-[#edf2e8] rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#faf7f0] text-[#103a31] font-sans overflow-hidden">
      {/* Skeleton Sidebar - Hidden on mobile, shown on lg screens */}
      <aside className="hidden lg:flex flex-col w-[222px] shrink-0 bg-gradient-to-b from-[#073f32] to-[#06382d] p-5 space-y-6 animate-pulse">
        <div className="h-10 bg-white/10 rounded-xl w-3/4 mx-auto" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-white/10 rounded-lg w-full" />
          ))}
        </div>
        <div className="mt-auto h-28 bg-white/5 rounded-2xl w-full" />
      </aside>

      {/* Skeleton Content */}
      <main className="flex-1 p-6 md:p-8 space-y-6 animate-pulse overflow-hidden">
        {/* Toolbar skeleton */}
        <div className="flex justify-between items-center">
          <div className="lg:hidden h-10 w-10 bg-[#e4e9e1] rounded-lg" />
          <div className="hidden md:block h-12 w-[360px] bg-[#e4e9e1] rounded-xl" />
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-[#e4e9e1] rounded-full" />
            <div className="h-10 w-10 bg-[#e4e9e1] rounded-full" />
          </div>
        </div>

        {/* Header Title skeleton */}
        <div className="space-y-2">
          <div className="h-10 bg-[#e4e9e1] rounded-lg w-1/3" />
          <div className="h-4 bg-[#e4e9e1] rounded w-1/2" />
        </div>

        {/* Main Grid skeleton */}
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="h-64 bg-[#fffdf8] border border-[#ded5c5] rounded-2xl p-6 space-y-4">
              <div className="h-6 bg-[#e4e9e1] rounded w-1/4" />
              <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                <div className="h-40 bg-[#e4e9e1] rounded-xl" />
                <div className="space-y-3 py-2">
                  <div className="h-3 bg-[#e4e9e1] rounded w-1/4" />
                  <div className="h-8 bg-[#e4e9e1] rounded w-3/4" />
                  <div className="h-4 bg-[#e4e9e1] rounded w-1/2" />
                  <div className="h-10 bg-[#e4e9e1] rounded w-1/3" />
                </div>
              </div>
            </div>
            <div className="h-48 bg-[#fffdf8] border border-[#ded5c5] rounded-2xl p-6 space-y-3">
              <div className="h-6 bg-[#e4e9e1] rounded w-1/3" />
              <div className="h-4 bg-[#e4e9e1] rounded w-2/3" />
              <div className="h-20 bg-[#e4e9e1] rounded-xl w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-80 bg-[#fffdf8] border border-[#ded5c5] rounded-2xl p-6 space-y-4">
              <div className="h-6 bg-[#e4e9e1] rounded w-1/2" />
              <div className="h-40 bg-[#e4e9e1] rounded-full w-40 mx-auto" />
              <div className="space-y-2">
                <div className="h-3 bg-[#e4e9e1] rounded w-3/4" />
                <div className="h-3 bg-[#e4e9e1] rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LazyRoute({ children, isDashboard = true }: { children: ReactNode; isDashboard?: boolean }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback isDashboard={isDashboard} />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

export function AppRoutes({ page, onNavigate }: AppRoutesProps) {
  // Normalize so reloads and onNavigate("/recipes/…") both match deep routes.
  const route = normalizePageId(page);

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
      <LazyRoute isDashboard={false}>
        <CookingMode sessionId={cookingMatch[1]} onNavigate={onNavigate} />
      </LazyRoute>
    );
  }
  if (route === "login") {
    return <Login onNavigate={onNavigate} />;
  }

  if (route === "auth/callback") {
    return <GoogleAuthCallback onNavigate={onNavigate} />;
  }

  if (route === "sign-up") {
    return <SignUp onNavigate={onNavigate} />;
  }

  if (route === "forgot-password" || route === "reset-password") {
    return <PasswordRecovery mode={route} onNavigate={onNavigate} />;
  }

  const onboardingStep = getOnboardingStep(route);
  if (onboardingStep !== null) {
    return (
      <LazyRoute isDashboard={false}>
        <Onboarding step={onboardingStep} onNavigate={onNavigate} />
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

  return (
    <main className="route-error" role="alert">
      <h1>Page not found</h1>
      <p>The route “/{route}” is not available.</p>
      <button type="button" onClick={() => onNavigate("landing")}>Go to home page</button>
    </main>
  );
}
