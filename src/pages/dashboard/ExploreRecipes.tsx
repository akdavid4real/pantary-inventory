import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import { Paginated, Recipe, RecipeMatch } from "../../types/inventory";
import { routes, ScreenProps } from "../../types/navigation";

export function ExploreRecipes({ onNavigate }: ScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [page, matchRows] = await Promise.all([
        api<Paginated<Recipe>>("/recipes?limit=100"),
        api<RecipeMatch[]>("/recipe-matcher/from-pantry"),
      ]);
      setRecipes(page.items);
      setMatches(matchRows);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load recipes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const matchMap = useMemo(
    () => new Map(matches.map((item) => [item.recipeId, item])),
    [matches],
  );
  const visible = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <DashboardPageShell
      activePage="Explore"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
      mainClassName="px-4 py-5 sm:px-7"
    >
      <DashboardPageHeader
        title="Explore recipes"
        subtitle="Local recipes connected to your live Pantry."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <div className="flex gap-2">
            <button onClick={() => onNavigate("add-edit-recipe")} className="flex items-center gap-2 rounded-lg bg-[#07513f] px-4 py-3 text-sm text-white"><Plus size={17} /> Add your recipe</button>
            <button aria-label="Refresh recipes" onClick={() => void load()} className="rounded-lg border p-3"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
          </div>
        }
      />
      <label className="mb-5 flex max-w-lg items-center gap-2 rounded-xl border bg-white px-4 py-3">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search local recipes"
          className="w-full outline-none"
        />
      </label>
      {error ? (
        <div className="grid min-h-64 place-items-center rounded-xl border border-red-100 bg-red-50 p-8 text-center text-red-700" role="alert">
          <div><p>{error}</p><button type="button" className="mt-4 rounded-lg bg-[#064536] px-5 py-2.5 text-sm text-white" onClick={() => void load()}>Try again</button></div>
        </div>
      ) : loading ? (
        <p className="p-12 text-center">Loading recipes…</p>
      ) : !visible.length ? (
        <p className="rounded-xl border bg-[#fffdf8] p-12 text-center">
          No local recipes match.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((recipe) => {
            const match = matchMap.get(recipe.id);
            return (
              <button
                key={recipe.id}
                onClick={() => onNavigate(routes.recipe(recipe.id))}
                className="overflow-hidden rounded-2xl border bg-[#fffdf8] text-left shadow-sm transition hover:-translate-y-1"
              >
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt=""
                    className="h-44 w-full object-cover"
                  />
                ) : null}
                <div className="p-4">
                  <h2 className="font-serif text-xl">{recipe.name}</h2>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a6b36]">{recipe.createdByUserId ? `Community · ${recipe.createdBy?.profile?.displayName ?? "Home cook"}` : "Pantry-to-Plate recipe"}</p>
                  <p className="mt-1 text-xs text-[#68706a]">
                    {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min ·{" "}
                    {recipe.servings} servings
                  </p>
                  <span
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-xs ${match?.canCookNow ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
                  >
                    {match?.canCookNow
                      ? "Ready to cook"
                      : match?.insufficientIngredients.length
                        ? "Some quantities are low"
                        : "Missing ingredients"}{" "}
                    · {match?.ingredientPresencePercentage ?? 0}% owned
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </DashboardPageShell>
  );
}
