import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import {
  MealEntry,
  MealType,
  Paginated,
  Recipe,
  RecipeMatch,
} from "../../types/inventory";
import { routes } from "../../types/navigation";

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
const panel = "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-sm";
const dayMs = 86_400_000;

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}
function startOfWeek(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
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
  weekDate = isoDay(new Date()),
}: {
  onNavigate: (page: string) => void;
  weekDate?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [editor, setEditor] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const weekStart = useMemo(() => startOfWeek(weekDate), [weekDate]);
  const days = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, index) => new Date(weekStart.getTime() + index * dayMs),
      ),
    [weekStart],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [entries, recipePage, matchRows] = await Promise.all([
        api<MealEntry[]>(`/meal-planner/week?date=${isoDay(weekStart)}`),
        api<Paginated<Recipe>>("/recipes?limit=100"),
        api<RecipeMatch[]>("/recipe-matcher/from-pantry"),
      ]);
      setMeals(entries);
      setRecipes(recipePage.items);
      setMatches(matchRows);
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
  }, [weekStart]);
  useEffect(() => {
    void load();
  }, [load]);

  const saveMeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const form = new FormData(event.currentTarget);
    setBusy("add");
    setError("");
    try {
      await api("/meal-planner", {
        method: "POST",
        body: JSON.stringify({
          recipeId: form.get("recipeId"),
          plannedDate: `${editor.date}T12:00:00.000Z`,
          mealType: editor.mealType,
          servings: Number(form.get("servings")),
          notes: form.get("notes") || undefined,
        }),
      });
      setEditor(null);
      await load();
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
    try {
      await api(`/meal-planner/${id}`, {
        method: "PATCH",
        body: JSON.stringify(change),
      });
      await load();
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
    try {
      await api(`/meal-planner/${id}`, { method: "DELETE" });
      await load();
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
  const selected = meals.find((item) => item.id === selectedId);
  const matchByRecipe = useMemo(
    () => new Map(matches.map((item) => [item.recipeId, item])),
    [matches],
  );
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
          <button
            onClick={() =>
              setEditor({ date: isoDay(days[0]), mealType: "DINNER" })
            }
            className="flex items-center gap-2 rounded-xl bg-[#ff5f4b] px-5 py-3 text-sm text-white"
          >
            <Plus size={18} /> Add meal
          </button>
        }
      />
      {error ? (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => void load()}>Retry</button>
        </div>
      ) : null}
      <div className="mb-4 rounded-xl border border-[#d6e2da] bg-[#edf4ef] px-4 py-3 text-xs text-[#285a4a]">
        <strong>How to add a meal:</strong> select any empty day/meal cell below, or use <strong>Add meal</strong> to start with Monday dinner. You will choose a built-in or community recipe, servings, and notes.
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
          onClick={() => void load()}
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
                              <img
                                src={entry.recipe.imageUrl}
                                alt=""
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
            className="w-full max-w-md rounded-2xl bg-[#fffdf8] p-6 shadow-2xl"
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
            <label className="mt-5 block text-xs">
              Local recipe
              <select
                name="recipeId"
                required
                className="mt-1 w-full rounded-lg border p-3"
              >
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </label>
            {!recipes.length ? (
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
              disabled={busy === "add" || !recipes.length}
              className="mt-5 w-full rounded-lg bg-[#07513f] p-3 text-sm text-white disabled:opacity-50"
            >
              {busy === "add" ? "Adding…" : "Add meal"}
            </button>
          </form>
        </div>
      ) : null}
    </DashboardPageShell>
  );
}
