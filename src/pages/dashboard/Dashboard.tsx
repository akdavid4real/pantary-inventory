import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, ChefHat, Clock3, Heart, Leaf, Menu, Search } from "lucide-react";
import akaraImage from "../../../assets/foods/33-akara.webp";
import beansImage from "../../../assets/foods/07-nigerian-beans-porridge.webp";
import egusiImage from "../../../assets/foods/09-egusi-soup.webp";
import jollofImage from "../../../assets/foods/01-nigerian-jollof-rice.webp";
import yamImage from "../../../assets/ingredients/04-yam-tuber.webp";
import { FoodImage } from "../../components/FoodImage";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { StatusPanel } from "../../components/dashboard/StatusPanel";
import { panelClassName } from "../../components/dashboard/styles";
import { cachedApi, getCachedApiValue, getSession } from "../../services/api";
import { routes } from "../../types/navigation";

type Recipe = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
};

type MealPlanEntry = {
  id: string;
  plannedDate: string;
  servings: number;
  mealType: string;
  recipe?: Recipe | null;
};

type Recommendation = {
  recipeId: string;
  recipeName: string;
  imageUrl?: string | null;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  matchPercentage: number;
  ingredientPresencePercentage: number;
  canCookNow: boolean;
  missingIngredients: unknown[];
  nutrition: {
    caloriesPerServing: number;
    proteinPerServing: number;
    carbsPerServing: number;
    fatPerServing: number;
  };
};

type DashboardSummary = {
  todayMeals: MealPlanEntry[];
  weekMeals: MealPlanEntry[];
  counts: {
    todayMeals: number;
    pantryItems: number;
    expiringItems: number;
    lowStockItems: number;
    pendingShoppingItems: number;
  };
  shoppingSummary: { title?: string | null; pendingItems: number; totalItems: number };
  weeklyNutrition: { calories: number; protein: number; carbs: number; fat: number };
  recommendedRecipes: Recommendation[];
};

type CurrentUser = {
  profile?: { displayName?: string | null };
  preferences?: { calorieGoal?: number | null };
};

const recipeImages: Record<string, string> = {
  "Jollof Rice": jollofImage,
  "Beans and Plantain": beansImage,
  "Yam Porridge": yamImage,
  "Egusi Soup and Garri": egusiImage,
  Akara: akaraImage,
};

const emptySummary: DashboardSummary = {
  todayMeals: [],
  weekMeals: [],
  counts: { todayMeals: 0, pantryItems: 0, expiringItems: 0, lowStockItems: 0, pendingShoppingItems: 0 },
  shoppingSummary: { pendingItems: 0, totalItems: 0 },
  weeklyNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  recommendedRecipes: [],
};
const dashboardSummaryPath = "/dashboard/summary";
const currentUserPath = "/users/me";

function startOfCurrentWeek() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function imageFor(name: string, imageUrl?: string | null) {
  return imageUrl || recipeImages[name] || jollofImage;
}

function sessionDisplayName() {
  return getSession()?.user?.user_metadata?.display_name?.trim() || "";
}

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedDay, setSelectedDay] = useState(() => Math.min((new Date().getDay() || 7) - 1, 6));
  const [favorites, setFavorites] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState(sessionDisplayName);
  const [calorieGoal, setCalorieGoal] = useState(0);
  const [summary, setSummary] = useState<DashboardSummary>(() => getCachedApiValue<DashboardSummary>(dashboardSummaryPath) ?? emptySummary);
  const [loading, setLoading] = useState(() => getCachedApiValue<DashboardSummary>(dashboardSummaryPath) === null);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(getCachedApiValue<DashboardSummary>(dashboardSummaryPath) === null);
    setLoadError("");
    Promise.all([
      cachedApi<CurrentUser>(currentUserPath, { ttlMs: 5 * 60_000, persist: true, force: loadAttempt > 0 }),
      cachedApi<DashboardSummary>(dashboardSummaryPath, { ttlMs: 30_000, persist: true, force: loadAttempt > 0 }),
    ])
      .then(([user, dashboard]) => {
        if (!active) return;
        setDisplayName(user.profile?.displayName?.trim() || sessionDisplayName() || "there");
        setCalorieGoal(user.preferences?.calorieGoal ?? 0);
        setSummary(dashboard);
      })
      .catch((caught) => {
        if (active) setLoadError(caught instanceof Error ? caught.message : "Unable to load dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadAttempt]);

  const weekDays = useMemo(() => {
    const monday = startOfCurrentWeek();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }, []);

  const selectedMeals = useMemo(() => {
    const selectedKey = dateKey(weekDays[selectedDay]);
    return summary.weekMeals.filter((meal) => dateKey(meal.plannedDate) === selectedKey);
  }, [selectedDay, summary.weekMeals, weekDays]);

  const featuredMeal = selectedMeals[0]?.recipe;
  const featuredRecommendation = summary.recommendedRecipes[0];
  const featuredName = featuredMeal?.name ?? featuredRecommendation?.recipeName;
  const nutrition = summary.weeklyNutrition;
  const macroTotal = nutrition.carbs + nutrition.protein + nutrition.fat;
  const carbsPercent = macroTotal ? Math.round((nutrition.carbs / macroTotal) * 100) : 0;
  const proteinPercent = macroTotal ? Math.round((nutrition.protein / macroTotal) * 100) : 0;
  const fatPercent = macroTotal ? Math.max(0, 100 - carbsPercent - proteinPercent) : 0;

  const toggleFavorite = (id: string) => {
    setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };

  if (loading || (loadError && summary === emptySummary)) {
    return (
      <DashboardPageShell activePage="Home" menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} onNavigate={onNavigate} mainClassName="px-4 py-5 sm:px-7 lg:px-8 xl:px-10">
        <header className="mb-6 flex items-start gap-3">
          <button className="mt-2 rounded-lg border border-[#d9d0c1] p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div><h1 className="m-0 font-serif text-4xl font-normal text-[#092e27] sm:text-[46px]">{greeting()}{displayName ? `, ${displayName}` : ""}</h1><p className="mt-1 text-lg text-[#303330]">{loading ? "Preparing your kitchen overview..." : "Your kitchen overview could not be loaded."}</p></div>
        </header>
        <div className={`${panelClassName} grid min-h-72 place-items-center p-8 text-center`} role={loadError ? "alert" : "status"}>
          <div className="max-w-md">
            <ChefHat className="mx-auto mb-4 text-[#17604a]" size={34} />
            <h2 className="font-serif text-2xl">{loading ? "Loading your kitchen" : "We could not reach your kitchen data"}</h2>
            <p className="mt-2 text-sm leading-6 text-[#696a65]">{loading ? "Pantry, meal, grocery, and nutrition details are being prepared." : loadError}</p>
            {loadError ? <button className="mt-5 rounded-lg bg-[#064536] px-6 py-3 text-sm text-white" onClick={() => setLoadAttempt((value) => value + 1)}>Try again</button> : null}
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell activePage="Home" menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} onNavigate={onNavigate} mainClassName="px-4 py-5 sm:px-7 lg:px-8 xl:px-10">
      <header data-dashboard-animate className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <button className="mt-2 rounded-lg border border-[#d9d0c1] p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div>
            <h1 className="m-0 max-w-3xl font-serif text-4xl font-normal leading-[1.02] text-[#092e27] sm:text-[46px] xl:text-[54px]">{greeting()}{displayName ? `, ${displayName}` : ""}</h1>
            <p className="mt-1 text-lg text-[#303330]">
              {loading ? "Preparing your kitchen overview..." : summary.counts.pantryItems ? `You have ${summary.counts.pantryItems} pantry items ready to inspire your next meal.` : "Add your first pantry items to unlock tailored meal ideas."}
            </p>
            {loadError ? <p className="mt-2 text-sm text-[#b33b32]" role="alert">{loadError}</p> : null}
            <span className="mt-2 flex items-center gap-2 text-[#eba91e]">— <Leaf size={15} fill="currentColor" /> —</span>
          </div>
        </div>
        <div className="hidden shrink-0 items-center justify-end gap-5 pt-2 md:flex">
          <label className="flex w-[360px] items-center gap-3 rounded-xl border border-[#d9d0c1] bg-white/40 px-5 py-3.5 text-[#656862] xl:w-[420px]"><Search size={21} /><input className="w-full border-0 bg-transparent text-sm outline-none" placeholder="Search meals, ingredients, or recipes" /></label>
          <button className="p-2" aria-label="Notifications" onClick={() => onNavigate("notifications")}><Bell size={25} /></button>
          <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dfe6dc] text-xl font-semibold shadow" aria-label="Open profile" onClick={() => onNavigate("Settings")}>{displayName.charAt(0).toUpperCase()}</button>
        </div>
      </header>

      <section data-dashboard-animate className={`${panelClassName} mb-4 grid grid-cols-7 overflow-hidden p-2`} aria-label="Choose date">
        {weekDays.map((date, index) => (
          <button key={date.toISOString()} className={`border-r border-[#e3dacb] py-2 text-center last:border-0 ${selectedDay === index ? "rounded-xl !border-0 bg-[#064536] text-white shadow" : ""}`} onClick={() => setSelectedDay(index)}>
            <span className="block text-xs">{date.toLocaleDateString(undefined, { weekday: "short" })}</span>
            <strong className="font-serif text-2xl font-normal">{date.getDate()}</strong>
          </button>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,1fr)]">
        <article className={`${panelClassName} overflow-hidden`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pt-6"><h2 className="m-0 font-serif text-[27px] leading-tight">Your plan for {weekDays[selectedDay].toLocaleDateString(undefined, { weekday: "long" })}</h2><span className="shrink-0 rounded-full bg-[#f0f3e9] px-3 py-1 text-xs text-[#4e635c]">{selectedMeals.length} planned</span></div>
          {featuredName ? (
            <>
              <div className="grid gap-5 p-5 pt-2 sm:grid-cols-[minmax(260px,.95fr)_1fr]">
                <FoodImage className="h-56 w-full rounded-xl object-cover" src={imageFor(featuredName, featuredMeal?.imageUrl ?? featuredRecommendation?.imageUrl)} alt={featuredName} variant="hero" priority />
                <div className="flex flex-col justify-center">
                  <small className="uppercase tracking-[.16em] text-[#926d17]">{featuredMeal ? selectedMeals[0].mealType.replace(/_/g, " ") : "Top pantry match"}</small>
                  <h3 className="font-serif text-[31px] leading-[1.05]">{featuredName}</h3>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs"><span className="flex items-center gap-1"><Clock3 size={15} />{(featuredMeal?.prepTimeMinutes ?? featuredRecommendation?.prepTimeMinutes ?? 0) + (featuredMeal?.cookTimeMinutes ?? featuredRecommendation?.cookTimeMinutes ?? 0)} min</span><span className="flex items-center gap-1"><Leaf size={15} fill="currentColor" />{featuredRecommendation?.ingredientPresencePercentage ?? 100}% ingredients owned</span></div>
                  <p className="my-3 max-w-sm text-xs leading-5 text-[#696a65]">{featuredMeal?.description ?? (featuredRecommendation?.canCookNow ? "You already have everything needed for this meal." : `${featuredRecommendation?.missingIngredients.length ?? 0} ingredient(s) left to add.`)}</p>
                  <button className="flex w-fit items-center gap-8 rounded-lg bg-[#ff614e] px-6 py-3 text-white shadow" onClick={() => onNavigate(featuredMeal?.id ? routes.recipe(featuredMeal.id) : "Meals")}>{featuredMeal ? "View recipe" : "Add to meal plan"}<ArrowRight size={18} /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[#f0f3e9] px-5 py-3 text-xs"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><Leaf size={17} /></span><span>Ingredients owned</span><i className="h-2 flex-1 overflow-hidden rounded-full bg-[#dce1d5]"><b className="block h-full rounded-full bg-[#277157]" style={{ width: `${featuredRecommendation?.ingredientPresencePercentage ?? 100}%` }} /></i><strong>{featuredRecommendation?.ingredientPresencePercentage ?? 100}%</strong></div>
            </>
          ) : (
            <div className="grid min-h-72 place-items-center px-6 py-10 text-center"><div className="mx-auto flex max-w-md flex-col items-center"><span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#edf2e8] text-[#17604a]"><ChefHat size={25} /></span><h3 className="m-0 font-serif text-2xl">Nothing planned yet</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#696a65]">Choose a pantry-matched recipe and build {weekDays[selectedDay].toLocaleDateString(undefined, { weekday: "long" })} around ingredients you already own.</p><button className="mt-5 rounded-lg bg-[#064536] px-6 py-3 text-sm text-white" onClick={() => onNavigate("Meals")}>Plan a meal</button></div></div>
          )}
        </article>

        <article className={`${panelClassName} flex flex-col p-5`}>
          <h2 className="font-serif text-[27px]">Weekly nutrition</h2>
          <div className="flex flex-1 flex-wrap items-center justify-around gap-7 py-4">
            <div className="grid h-44 w-44 place-items-center rounded-full" style={{ background: macroTotal ? `conic-gradient(#f2ad20 0 ${carbsPercent}%, #146146 ${carbsPercent}% ${carbsPercent + proteinPercent}%, #dc584e ${carbsPercent + proteinPercent}% 100%)` : "#e7e4dc" }}><span className="grid h-28 w-28 place-items-center rounded-full bg-[#fffdf8] text-center"><span><strong className="block font-serif text-3xl font-normal">{nutrition.calories.toLocaleString()}</strong>kcal{calorieGoal ? <small className="block text-[10px] text-[#70726d]">goal {calorieGoal.toLocaleString()}/day</small> : null}</span></span></div>
            <ul className="space-y-5 text-sm"><li><i className="mr-3 inline-block h-5 w-5 rounded-full bg-[#f2ad20] align-middle" />Carbs <b className="ml-4 font-normal">{carbsPercent}%</b></li><li><i className="mr-3 inline-block h-5 w-5 rounded-full bg-[#146146] align-middle" />Protein <b className="ml-4 font-normal">{proteinPercent}%</b></li><li><i className="mr-3 inline-block h-5 w-5 rounded-full bg-[#dc584e] align-middle" />Fats <b className="ml-4 font-normal">{fatPercent}%</b></li></ul>
          </div>
          <footer className="flex justify-between text-xs"><span>Based on {summary.weekMeals.length} planned meal{summary.weekMeals.length === 1 ? "" : "s"}</span><button className="flex items-center gap-4" onClick={() => onNavigate("Analytics")}>View details <ArrowRight size={18} /></button></footer>
        </article>

        <article className={`${panelClassName} p-4`}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3"><div><h2 className="m-0 font-serif text-[26px] leading-tight">Recommended from your pantry</h2><p className="mt-1 text-xs text-[#696a65]">Ranked using the ingredients currently saved in your pantry.</p></div><button className="shrink-0 text-xs font-medium text-[#17604a]" onClick={() => onNavigate("Explore")}>View all</button></div>
          {summary.recommendedRecipes.length ? <div className="space-y-1">{summary.recommendedRecipes.slice(0, 3).map((recipe) => (
            <div className="grid items-center overflow-hidden rounded-xl border border-[#e4daca] bg-white/25 sm:grid-cols-[200px_1fr_auto_auto]" key={recipe.recipeId}>
              <FoodImage className="h-24 w-full object-cover" src={imageFor(recipe.recipeName, recipe.imageUrl)} alt={recipe.recipeName} variant="card" />
              <div className="px-4 py-2"><h3 className="font-serif text-[16px]">{recipe.recipeName}</h3><div className="mt-2 flex gap-4 text-[11px]"><span className="flex items-center gap-1"><Clock3 size={13} />{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span><span className="flex items-center gap-1"><Leaf size={13} fill="currentColor" />{recipe.ingredientPresencePercentage}% owned</span></div></div>
              <button className="p-3" onClick={() => toggleFavorite(recipe.recipeId)} aria-label={`Favorite ${recipe.recipeName}`}><Heart size={20} fill={favorites.includes(recipe.recipeId) ? "currentColor" : "none"} /></button>
              <button className="flex items-center gap-3 whitespace-nowrap px-4 text-xs" onClick={() => onNavigate(routes.recipe(recipe.recipeId))}>View recipe <ArrowRight size={17} /></button>
            </div>
          ))}</div> : <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-[#d8cfbf] bg-[#fbfaf5] px-6 py-10 text-center"><div className="max-w-sm"><span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#edf2e8] text-[#17604a]"><Leaf size={22} /></span><h3 className="font-serif text-xl">Your recommendations start in the pantry</h3><p className="mt-2 text-sm leading-6 text-[#696a65]">Add a few ingredients and PlateSense will rank Nigerian meals by what you can cook now.</p><button className="mt-5 rounded-lg bg-[#064536] px-5 py-3 text-sm text-white" onClick={() => onNavigate("Pantry")}>Add pantry items</button></div></div>}
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatusPanel type="pantry" itemCount={summary.counts.pantryItems} secondaryCount={summary.counts.expiringItems} onAction={() => onNavigate("Pantry")} />
          <StatusPanel type="grocery" itemCount={summary.shoppingSummary.totalItems} secondaryCount={summary.shoppingSummary.pendingItems} onAction={() => onNavigate("Grocery")} />
        </div>
      </section>

    </DashboardPageShell>
  );
}
