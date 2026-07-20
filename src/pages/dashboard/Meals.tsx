import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBasket,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { FoodImage } from "../../components/FoodImage";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { api, cachedApi, getSession } from "../../services/api";
import { getCachedRecipeCatalog, loadRecipeCatalog } from "../../services/catalog";
import {
  AiMealPlanPreview,
  MealEntry,
  MealType,
  RecipeMatch,
  RecipeSummary,
} from "../../types/inventory";
import { routes } from "../../types/navigation";

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
const panel = "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-sm";
const dayMs = 86_400_000;
const lastMealWeekPrefix = "pantry-to-plate-last-meal-week:";

function sortMeals(entries: MealEntry[]) {
  return [...entries].sort((left, right) => {
    const dateDifference = left.plannedDate.localeCompare(right.plannedDate);
    return dateDifference || mealTypes.indexOf(left.mealType) - mealTypes.indexOf(right.mealType);
  });
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}
function startOfWeek(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}
function mealWeekStorageKey() {
  const userId = getSession()?.user?.id;
  return userId ? `${lastMealWeekPrefix}${userId}` : "";
}
function initialMealWeek(requestedWeek?: string) {
  if (requestedWeek) return requestedWeek;
  const key = mealWeekStorageKey();
  if (!key) return isoDay(new Date());
  const savedWeek = localStorage.getItem(key);
  return savedWeek && /^\d{4}-\d{2}-\d{2}$/.test(savedWeek)
    ? savedWeek
    : isoDay(new Date());
}
function matchLabel(match?: RecipeMatch) {
  if (!match) return "Checking pantry";
  if (match.canCookNow) return "Ready to cook";
  if (match.insufficientIngredients.length > 0) return "Some quantities are low";
  if (match.ingredientPresencePercentage > 0) return "Partially available";
  return "Missing ingredients";
}

export function Meals({
  onNavigate,
  weekDate,
}: {
  onNavigate: (page: string) => void;
  weekDate?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [recipes, setRecipes] = useState<RecipeSummary[]>(getCachedRecipeCatalog);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [recipeCategory, setRecipeCategory] = useState("ALL");
  const [recipeMaxMinutes, setRecipeMaxMinutes] = useState("ALL");
  const [editor, setEditor] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [aiPreview, setAiPreview] = useState<AiMealPlanPreview | null>(null);
  const resolvedWeekDate = useMemo(() => initialMealWeek(weekDate), [weekDate]);
  const weekStart = useMemo(() => startOfWeek(resolvedWeekDate), [resolvedWeekDate]);
  const days = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, index) => new Date(weekStart.getTime() + index * dayMs),
      ),
    [weekStart],
  );

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError("");
    setNotice("");
    const entriesRequest = api<MealEntry[]>(`/meal-planner/week?date=${isoDay(weekStart)}`);
    const catalogRequest = loadRecipeCatalog(force).then(setRecipes);
    const matchesRequest = cachedApi<RecipeMatch[]>("/recipe-matcher/from-pantry", {
      ttlMs: 60_000,
      force,
    }).then(setMatches);

    try {
      const entries = await entriesRequest;
      setMeals(entries);
      setSelectedId((current) =>
        entries.some((item) => item.id === current)
          ? current
          : (entries[0]?.id ?? ""),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load this week.",
      );
    } finally {
      setLoading(false);
    }
    await Promise.allSettled([catalogRequest, matchesRequest]);
  }, [weekStart]);
  useEffect(() => {
    void load(false);
  }, [load]);
  useEffect(() => {
    const key = mealWeekStorageKey();
    if (key) localStorage.setItem(key, isoDay(weekStart));
  }, [weekStart]);

  const saveMeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const form = new FormData(event.currentTarget);
    setBusy("add");
    setError("");
    setNotice("");
    try {
      const createdMeal = await api<MealEntry>("/meal-planner", {
        method: "POST",
        body: JSON.stringify({
          recipeId: form.get("recipeId"),
          plannedDate: `${editor.date}T12:00:00.000Z`,
          mealType: editor.mealType,
          servings: Number(form.get("servings")),
          notes: form.get("notes") || undefined,
        }),
      });
      setMeals((current) =>
        sortMeals([
          ...current.filter((meal) => meal.id !== createdMeal.id),
          createdMeal,
        ]),
      );
      setSelectedId(createdMeal.id);
      setEditor(null);
      setNotice(`${createdMeal.recipe?.name ?? "Meal"} was saved to your account. It will still be here after you sign out.`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not add meal.",
      );
    } finally {
      setBusy("");
    }
  };
  const updateMeal = async (id: string, change: Partial<MealEntry>) => {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      const updatedMeal = await api<MealEntry>(`/meal-planner/${id}`, {
        method: "PATCH",
        body: JSON.stringify(change),
      });
      const weekEnd = new Date(weekStart.getTime() + 7 * dayMs);
      const updatedDate = new Date(updatedMeal.plannedDate);
      const remainsInWeek = updatedDate >= weekStart && updatedDate < weekEnd;

      setMeals((current) =>
        sortMeals(
          remainsInWeek
            ? current.map((meal) => (meal.id === id ? updatedMeal : meal))
            : current.filter((meal) => meal.id !== id),
        ),
      );
      setSelectedId(remainsInWeek ? updatedMeal.id : "");
      setNotice(remainsInWeek ? "Meal updated." : "Meal moved to another week.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not update meal.",
      );
    } finally {
      setBusy("");
    }
  };
  const removeMeal = async (id: string) => {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      await api(`/meal-planner/${id}`, { method: "DELETE" });
      setMeals((current) => current.filter((meal) => meal.id !== id));
      setSelectedId((current) =>
        current === id ? (meals.find((meal) => meal.id !== id)?.id ?? "") : current,
      );
      setNotice("Meal removed from your plan.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not remove meal.",
      );
    } finally {
      setBusy("");
    }
  };
  const generateGroceries = async () => {
    setBusy("grocery");
    setError("");
    try {
      const list = await api<{ id: string }>(
        "/shopping-list/generate/from-meal-plan",
        {
          method: "POST",
          body: JSON.stringify({
            startDate: days[0].toISOString(),
            endDate: new Date(days[6].getTime() + dayMs - 1).toISOString(),
          }),
        },
      );
      onNavigate(routes.shoppingList(list.id));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not refresh grocery list.",
      );
    } finally {
      setBusy("");
    }
  };
  const generateAiPlan = async () => {
    setBusy("ai-preview");
    setError("");
    setNotice("");
    try {
      const preview = await api<AiMealPlanPreview>("/meal-planner/ai/preview", {
        method: "POST",
        body: JSON.stringify({ weekDate: isoDay(weekStart), mealCount: 7 }),
      });
      setAiPreview(preview);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create an AI meal plan.");
    } finally {
      setBusy("");
    }
  };
  const applyAiPlan = async () => {
    if (!aiPreview) return;
    setBusy("ai-apply");
    setError("");
    try {
      const created = await api<MealEntry[]>("/meal-planner/ai/apply", {
        method: "POST",
        body: JSON.stringify({
          entries: aiPreview.entries.map(({ recipeId, plannedDate, mealType, servings, reason }) => ({
            recipeId,
            plannedDate,
            mealType,
            servings,
            reason,
          })),
        }),
      });
      setMeals((current) => sortMeals([...current, ...created]));
      setSelectedId(created[0]?.id ?? "");
      setAiPreview(null);
      setNotice(`${created.length} smart meal${created.length === 1 ? "" : "s"} saved to your account for this week.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add the AI plan.");
    } finally {
      setBusy("");
    }
  };
  const selected = meals.find((item) => item.id === selectedId);
  const matchByRecipe = useMemo(
    () => new Map(matches.map((item) => [item.recipeId, item])),
    [matches],
  );
  const recipeCategories = useMemo(
    () => Array.from(new Set(recipes.map((recipe) => recipe.category).filter(Boolean))) as string[],
    [recipes],
  );
  const filteredRecipes = useMemo(() => {
    const query = recipeQuery.trim().toLowerCase();
    const timeLimit = recipeMaxMinutes === "ALL" ? Infinity : Number(recipeMaxMinutes);

    return recipes.filter((recipe) => {
      const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
      const matchesQuery = !query || [recipe.name, recipe.description, recipe.region]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesCategory = recipeCategory === "ALL" || recipe.category === recipeCategory;
      return matchesQuery && matchesCategory && totalMinutes <= timeLimit;
    });
  }, [recipeCategory, recipeMaxMinutes, recipeQuery, recipes]);
  const changeWeek = (offset: number) =>
    onNavigate(
      routes.mealWeek(
        isoDay(new Date(weekStart.getTime() + offset * 7 * dayMs)),
      ),
    );

  return (
    <DashboardPageShell
      activePage="Meals"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
      mainClassName="px-4 py-5 sm:px-7 xl:px-8"
    >
      <DashboardPageHeader
        title="Weekly meal plan"
        subtitle="Plan with real recipes and see what your pantry can cover."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => void generateAiPlan()}
              disabled={busy === "ai-preview" || loading}
              className="flex items-center gap-2 rounded-xl border border-[#07513f] bg-[#edf4ef] px-4 py-3 text-sm font-medium text-[#07513f] disabled:opacity-50"
            >
              <Sparkles size={18} /> {busy === "ai-preview" ? "Planning..." : "Plan with Gemini"}
            </button>
            <button
              onClick={() =>
                setEditor({ date: isoDay(days[0]), mealType: "DINNER" })
              }
              className="flex items-center gap-2 rounded-xl bg-[#ff5f4b] px-5 py-3 text-sm text-white"
            >
              <Plus size={18} /> Add meal
            </button>
          </div>
        }
      />
      {error ? (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => void load(true)}>Retry</button>
        </div>
      ) : null}
      {notice ? (
        <div
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
      ) : null}
      <div className="mb-4 rounded-xl border border-[#d6e2da] bg-[#edf4ef] px-4 py-3 text-xs text-[#285a4a]">
        <strong>How saving works:</strong> select an empty day/meal cell, choose a recipe, then press <strong>Add meal</strong>. Added meals are saved to your account and reload after you sign back in. Gemini plans are previews until you press <strong>Add meals to this week</strong>.
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => changeWeek(-1)}
          className="rounded-lg border p-2"
          aria-label="Previous week"
        >
          <ArrowLeft size={17} />
        </button>
        <button
          onClick={() => changeWeek(1)}
          className="rounded-lg border p-2"
          aria-label="Next week"
        >
          <ArrowRight size={17} />
        </button>
        <strong className="font-serif text-xl">
          {days[0].toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}{" "}
          –{" "}
          {days[6].toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </strong>
        <button
          onClick={() => onNavigate(routes.mealWeek(isoDay(new Date())))}
          className="ml-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
        >
          <CalendarDays size={14} /> Today
        </button>
        <button
          onClick={() => void load(true)}
          disabled={loading}
          className="rounded-lg border p-2"
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
        <button
          onClick={() => void generateGroceries()}
          disabled={busy === "grocery"}
          className="flex items-center gap-2 rounded-lg bg-[#07513f] px-4 py-2 text-xs text-white disabled:opacity-50"
        >
          <ShoppingBasket size={15} />{" "}
          {busy === "grocery" ? "Refreshing…" : "Grocery list"}
        </button>
      </div>
      {loading ? (
        <div className={`${panel} p-12 text-center`}>
          Loading your meal plan…
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className={`${panel} overflow-x-auto`}>
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[100px_repeat(7,minmax(115px,1fr))] border-b">
                <span />
                {days.map((day) => (
                  <strong key={isoDay(day)} className="p-3 text-center text-xs">
                    {day.toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </strong>
                ))}
              </div>
              {mealTypes.map((mealType) => (
                <div
                  key={mealType}
                  className="grid min-h-36 grid-cols-[100px_repeat(7,minmax(115px,1fr))] border-b last:border-0"
                >
                  <strong className="grid place-items-center border-r text-xs capitalize">
                    {mealType.toLowerCase()}
                  </strong>
                  {days.map((day) => {
                    const date = isoDay(day);
                    const entry = meals.find(
                      (item) =>
                        item.mealType === mealType &&
                        item.plannedDate.slice(0, 10) === date,
                    );
                    const match = entry?.recipeId
                      ? matchByRecipe.get(entry.recipeId)
                      : undefined;
                    return (
                      <div key={date} className="border-r p-1.5 last:border-0">
                        {entry ? (
                          <button
                            onClick={() => setSelectedId(entry.id)}
                            className={`h-full w-full rounded-lg border p-2 text-left ${selectedId === entry.id ? "border-[#07513f] bg-[#edf4ef]" : "bg-[#faf7f0]"}`}
                          >
                            {entry.recipe?.imageUrl ? (
                              <FoodImage
                                src={entry.recipe.imageUrl}
                                alt=""
                                variant="thumb"
                                className="mb-2 h-12 w-full rounded-md object-cover"
                              />
                            ) : null}
                            <strong className="block font-serif text-xs font-normal">
                              {entry.recipe?.name ?? entry.externalTitle}
                            </strong>
                            <span className="mt-2 block text-[10px]">
                              {entry.servings} servings
                            </span>
                            <span
                              className={`mt-1 block text-[10px] ${match?.canCookNow ? "text-emerald-700" : "text-amber-700"}`}
                            >
                              {entry.recipeSource === "EXTERNAL"
                                ? "External recipe · grocery unavailable"
                                : matchLabel(match)}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditor({ date, mealType })}
                            className="grid h-full w-full place-items-center rounded-lg border border-dashed text-xs text-[#777]"
                          >
                            <span className="flex items-center gap-1">
                              <Plus size={13} /> Add
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
          <aside className={`${panel} h-fit p-4`}>
            {selected ? (
              <>
                <h2 className="font-serif text-xl">
                  {selected.recipe?.name ?? selected.externalTitle}
                </h2>
                <p className="mt-1 text-xs text-[#68706a]">
                  {new Date(selected.plannedDate).toLocaleDateString()} ·{" "}
                  {selected.mealType.toLowerCase()}
                </p>
                <div className="mt-4 flex items-center justify-between rounded-lg border">
                  <button
                    disabled={busy === selected.id}
                    onClick={() =>
                      void updateMeal(selected.id, {
                        servings: Math.max(1, selected.servings - 1),
                      })
                    }
                    className="p-2"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs">{selected.servings} servings</span>
                  <button
                    disabled={busy === selected.id}
                    onClick={() =>
                      void updateMeal(selected.id, {
                        servings: selected.servings + 1,
                      })
                    }
                    className="p-2"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <label className="mt-3 block text-xs">
                  Move to date
                  <input
                    type="date"
                    value={selected.plannedDate.slice(0, 10)}
                    onChange={(event) =>
                      void updateMeal(selected.id, {
                        plannedDate: `${event.target.value}T12:00:00.000Z`,
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                  />
                </label>
                {selected.recipeId ? (
                  <button
                    onClick={() =>
                      onNavigate(routes.recipe(selected.recipeId!))
                    }
                    className="mt-4 w-full rounded-lg bg-[#07513f] py-2 text-xs text-white"
                  >
                    View recipe
                  </button>
                ) : (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    External recipe ingredients are not supported yet, so
                    grocery generation is disabled for this meal.
                  </p>
                )}
                <button
                  disabled={busy === selected.id}
                  onClick={() => void removeMeal(selected.id)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 py-2 text-xs text-red-600"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </>
            ) : (
              <p className="text-sm text-[#6d746f]">
                Select a meal to edit it.
              </p>
            )}
          </aside>
        </div>
      )}
      {editor ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#052d25]/60 p-4">
          <form
            onSubmit={saveMeal}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fffdf8] p-6 shadow-2xl"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="font-serif text-2xl">
                  Add {editor.mealType.toLowerCase()}
                </h2>
                <p className="text-xs">{editor.date}</p>
              </div>
              <button type="button" onClick={() => setEditor(null)}>
                <X />
              </button>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_140px]">
              <label className="flex items-center gap-2 rounded-lg border bg-white px-3">
                <Search size={16} />
                <input
                  value={recipeQuery}
                  onChange={(event) => setRecipeQuery(event.target.value)}
                  placeholder="Search recipes"
                  className="w-full bg-transparent py-3 text-xs outline-none"
                />
              </label>
              <select
                value={recipeCategory}
                onChange={(event) => setRecipeCategory(event.target.value)}
                className="rounded-lg border bg-white p-3 text-xs capitalize"
              >
                <option value="ALL">All food types</option>
                {recipeCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, " ").toLowerCase()}
                  </option>
                ))}
              </select>
              <select
                value={recipeMaxMinutes}
                onChange={(event) => setRecipeMaxMinutes(event.target.value)}
                className="rounded-lg border bg-white p-3 text-xs"
              >
                <option value="ALL">Any time</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {["RICE_MEAL", "SWALLOW", "SOUP", "BEANS_MEAL", "BREAKFAST", "SNACK"].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setRecipeCategory(recipeCategory === category ? "ALL" : category)}
                  className={`rounded-full border px-3 py-1 text-[10px] capitalize ${recipeCategory === category ? "border-[#07513f] bg-[#07513f] text-white" : "bg-white"}`}
                >
                  {category.replace(/_/g, " ").toLowerCase()}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-[#68706a]">
              {filteredRecipes.length} of {recipes.length} recipes match these filters.
            </p>
            <label className="mt-2 block text-xs">
              Local recipe
              <select
                name="recipeId"
                required
                className="mt-1 w-full rounded-lg border p-3"
              >
                {filteredRecipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} · {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
                  </option>
                ))}
              </select>
            </label>
            {!filteredRecipes.length ? (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">No recipes are available yet. <button type="button" className="font-semibold underline" onClick={() => onNavigate("add-edit-recipe")}>Create your first recipe</button>.</div>
            ) : null}
            <label className="mt-3 block text-xs">
              Servings
              <input
                name="servings"
                type="number"
                min="1"
                defaultValue="2"
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            <label className="mt-3 block text-xs">
              Notes
              <textarea
                name="notes"
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            <button
              disabled={busy === "add" || !filteredRecipes.length}
              className="mt-5 w-full rounded-lg bg-[#07513f] p-3 text-sm text-white disabled:opacity-50"
            >
              {busy === "add" ? "Adding…" : "Add meal"}
            </button>
          </form>
        </div>
      ) : null}
      {aiPreview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#052d25]/65 p-4">
          <section
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#fffdf8] p-5 shadow-2xl sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-plan-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#e8f2eb] px-3 py-1 text-[11px] font-medium text-[#07513f]">
                  <Sparkles size={13} /> {aiPreview.source === "GEMINI" ? "Gemini plan" : "PlateSense fallback"}
                </span>
                <span className="mb-2 ml-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-800">
                  Preview only · not saved yet
                </span>
                <h2 id="ai-plan-title" className="font-serif text-3xl text-[#092e27]">Your smart week</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68706a]">{aiPreview.summary}</p>
              </div>
              <button type="button" onClick={() => setAiPreview(null)} className="rounded-lg border p-2" aria-label="Close smart plan"><X size={18} /></button>
            </div>

            {aiPreview.source === "PLATESENSE_FALLBACK" ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                Gemini was not configured or could not respond, so PlateSense prepared a safe pantry-ranked plan instead. You can still review and use it.
              </p>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {aiPreview.entries.map((entry) => (
                <article key={`${entry.plannedDate}-${entry.mealType}`} className="grid grid-cols-[76px_1fr] gap-3 rounded-xl border border-[#ded5c5] bg-white/60 p-3">
                  {entry.recipe.imageUrl ? (
                    <FoodImage src={entry.recipe.imageUrl} alt="" variant="thumb" className="h-20 w-[76px] rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-20 w-[76px] place-items-center rounded-lg bg-[#edf4ef] text-[#07513f]"><Sparkles size={20} /></span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#8a6a22]">
                      {new Date(entry.plannedDate).toLocaleDateString(undefined, { weekday: "long" })} · {entry.mealType.toLowerCase()}
                    </p>
                    <h3 className="mt-1 truncate font-serif text-lg text-[#092e27]">{entry.recipe.name}</h3>
                    <p className="mt-1 text-[11px] leading-4 text-[#68706a]">{entry.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#285a4a]">
                      <span>{entry.ingredientPresencePercentage}% pantry</span>
                      <span>·</span>
                      <span>{entry.recipe.prepTimeMinutes + entry.recipe.cookTimeMinutes} min</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setAiPreview(null)} className="rounded-xl border px-5 py-3 text-sm">Keep my current plan</button>
              <button type="button" onClick={() => void applyAiPlan()} disabled={busy === "ai-apply"} className="flex items-center justify-center gap-2 rounded-xl bg-[#07513f] px-6 py-3 text-sm text-white disabled:opacity-50">
                <Sparkles size={17} /> {busy === "ai-apply" ? "Adding plan..." : `Add ${aiPreview.entries.length} meals to this week`}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardPageShell>
  );
}
