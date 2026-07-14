import { Analytics } from "../pages/dashboard/Analytics";
import { CookingMode } from "../pages/dashboard/CookingMode";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { ExploreRecipes } from "../pages/dashboard/ExploreRecipes";
import { Favorites } from "../pages/dashboard/Favorites";
import { Grocery } from "../pages/dashboard/Grocery";
import { Meals } from "../pages/dashboard/Meals";
import { Notifications } from "../pages/dashboard/Notifications";
import { Pantry } from "../pages/dashboard/Pantry";
import { PantryItemEditor } from "../pages/dashboard/PantryItemEditor";
import { RecipeDetails } from "../pages/dashboard/RecipeDetails";
import { RecipeEditor } from "../pages/dashboard/RecipeEditor";
import { MyRecipes } from "../pages/dashboard/MyRecipes";
import { Settings } from "../pages/dashboard/Settings";
import { ShoppingListGenerator } from "../pages/dashboard/ShoppingListGenerator";
import { Login } from "../pages/auth/Login";
import { PasswordRecovery } from "../pages/auth/PasswordRecovery";
import { SignUp } from "../pages/auth/SignUp";
import { Onboarding } from "../pages/onboarding/Onboarding";
import { LandingPage } from "../pages/public/LandingPage";
import { ScreenProps } from "../types/navigation";

type AppRoutesProps = ScreenProps & {
  page: string;
};

const dashboardPages = {
  Analytics,
  Explore: ExploreRecipes,
  Favorites,
  Grocery,
  Home: Dashboard,
  Meals,
  "My Recipes": MyRecipes,
  Pantry,
  Settings,
} as const;

const utilityPages = {
  "add-edit-pantry-item": PantryItemEditor,
  "add-edit-recipe": RecipeEditor,
  "cooking-mode": CookingMode,
  "generate-shopping-list": ShoppingListGenerator,
  notifications: Notifications,
  "recipe-details": RecipeDetails,
} as const;

export function AppRoutes({ page, onNavigate }: AppRoutesProps) {
  if (page === "landing") {
    return <LandingPage />;
  }

  const editRecipeMatch = page.match(/^my-recipes\/([^/]+)\/edit$/);
  if (editRecipeMatch) return <RecipeEditor recipeId={editRecipeMatch[1]} onNavigate={onNavigate} />;
  if (page === "my-recipes/new") return <RecipeEditor onNavigate={onNavigate} />;
  const recipeMatch = page.match(/^recipes\/([^/]+)$/);
  if (recipeMatch) return <RecipeDetails recipeId={recipeMatch[1]} onNavigate={onNavigate} />;

  const mealWeekMatch = page.match(/^meals\/week\/([^/]+)$/);
  if (mealWeekMatch) return <Meals weekDate={mealWeekMatch[1]} onNavigate={onNavigate} />;

  const shoppingListMatch = page.match(/^grocery\/lists\/([^/]+)$/);
  if (shoppingListMatch) return <Grocery listId={shoppingListMatch[1]} onNavigate={onNavigate} />;

  const cookingMatch = page.match(/^cooking\/([^/]+)$/);
  if (cookingMatch) return <CookingMode sessionId={cookingMatch[1]} onNavigate={onNavigate} />;
  if (page === "login") {
    return <Login onNavigate={onNavigate} />;
  }

  if (page === "sign-up") {
    return <SignUp onNavigate={onNavigate} />;
  }

  if (page === "forgot-password" || page === "reset-password") {
    return (
      <PasswordRecovery mode={page} onNavigate={onNavigate} />
    );
  }

  if (page.startsWith("onboarding")) {
    const step = Number(page.split("-")[1] || 1);

    return <Onboarding step={step} onNavigate={onNavigate} />;
  }

  const DashboardPage = dashboardPages[page as keyof typeof dashboardPages];

  if (DashboardPage) {
    return <DashboardPage onNavigate={onNavigate} />;
  }

  const UtilityPage = utilityPages[page as keyof typeof utilityPages];

  if (UtilityPage) {
    return <UtilityPage onNavigate={onNavigate} />;
  }

  return <LandingPage />;
}
