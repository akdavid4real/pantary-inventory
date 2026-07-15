import { useCallback, useEffect, useMemo, useState } from "react";
import { ChefHat, Heart, Plus, RefreshCw, Search } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import { Paginated, Recipe, RecipeMatch } from "../../types/inventory";
import { routes, ScreenProps } from "../../types/navigation";

type Favorite = { id: string; recipe: Recipe };

const pageSize = 24;

async function loadAllRecipes() {
  const firstPage = await api<Paginated<Recipe>>("/recipes?page=1&limit=100");
  const pageCount = Math.ceil(firstPage.meta.total / firstPage.meta.limit);
  if (pageCount <= 1) return firstPage.items;

  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      api<Paginated<Recipe>>(`/recipes?page=${index + 2}&limit=100`),
    ),
  );
  return [firstPage, ...remaining].flatMap((page) => page.items);
}

function categoryLabel(value: string) {
  return value.replace(/_/g, " ").toLowerCase();
}

export function ExploreRecipes({ onNavigate }: ScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [maxMinutes, setMaxMinutes] = useState("ALL");
  const [readyOnly, setReadyOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [favoriteBusy, setFavoriteBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recipeRows, matchRows, favoriteRows] = await Promise.all([
        loadAllRecipes(),
        api<RecipeMatch[]>("/recipe-matcher/from-pantry"),
        api<Favorite[]>("/favorites"),
      ]);
      setRecipes(recipeRows);
      setMatches(matchRows);
      setFavoriteIds(new Set(favoriteRows.map((favorite) => favorite.recipe.id)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load recipes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, maxMinutes, query, readyOnly]);

  const matchMap = useMemo(
    () => new Map(matches.map((item) => [item.recipeId, item])),
    [matches],
  );

  const categories = useMemo(
    () => Array.from(new Set(recipes.map((recipe) => recipe.category).filter(Boolean))) as string[],
    [recipes],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const timeLimit = maxMinutes === "ALL" ? Infinity : Number(maxMinutes);

    return recipes.filter((recipe) => {
      const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
      const matchesQuery = !normalizedQuery || [recipe.name, recipe.description, recipe.region]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      const matchesCategory = category === "ALL" || recipe.category === category;
      const matchesTime = totalMinutes <= timeLimit;
      const matchesPantry = !readyOnly || matchMap.get(recipe.id)?.canCookNow;
      return matchesQuery && matchesCategory && matchesTime && matchesPantry;
    });
  }, [category, matchMap, maxMinutes, query, readyOnly, recipes]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleFavorite = async (recipeId: string) => {
    const isFavorite = favoriteIds.has(recipeId);
    setFavoriteBusy(recipeId);
    setError("");
    try {
      await api(`/favorites/${recipeId}`, { method: isFavorite ? "DELETE" : "POST" });
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (isFavorite) next.delete(recipeId);
        else next.add(recipeId);
        return next;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update that favorite.");
    } finally {
      setFavoriteBusy("");
    }
  };

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
        subtitle={`${recipes.length} approved recipes connected to your live pantry.`}
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <div className="flex gap-2">
            <button onClick={() => onNavigate("add-edit-recipe")} className="flex items-center gap-2 rounded-lg bg-[#07513f] px-4 py-3 text-sm text-white">
              <Plus size={17} /> Add your recipe
            </button>
            <button aria-label="Refresh recipes" onClick={() => void load()} className="rounded-lg border p-3">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 rounded-2xl border border-[#ded5c5] bg-[#fffdf8] p-4 md:grid-cols-[minmax(240px,1fr)_180px_150px_auto]">
        <label className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes, regions, or ingredients" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border bg-white px-3 py-3 text-sm capitalize">
          <option value="ALL">All meal types</option>
          {categories.map((item) => <option key={item} value={item}>{categoryLabel(item)}</option>)}
        </select>
        <select value={maxMinutes} onChange={(event) => setMaxMinutes(event.target.value)} className="rounded-xl border bg-white px-3 py-3 text-sm">
          <option value="ALL">Any time</option>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
        </select>
        <button type="button" onClick={() => setReadyOnly((current) => !current)} className={`rounded-xl border px-4 py-3 text-sm ${readyOnly ? "border-[#07513f] bg-[#07513f] text-white" : "bg-white"}`}>
          Pantry-ready
        </button>
      </div>

      {error ? (
        <div className="grid min-h-64 place-items-center rounded-xl border border-red-100 bg-red-50 p-8 text-center text-red-700" role="alert">
          <div><p>{error}</p><button type="button" className="mt-4 rounded-lg bg-[#064536] px-5 py-2.5 text-sm text-white" onClick={() => void load()}>Try again</button></div>
        </div>
      ) : loading ? (
        <p className="p-12 text-center">Loading the full recipe catalog…</p>
      ) : !visible.length ? (
        <p className="rounded-xl border bg-[#fffdf8] p-12 text-center">No recipes match these filters.</p>
      ) : (
        <>
          <div className="mb-3 text-xs text-[#68706a]">Showing {visible.length} of {filtered.length} matching recipes</div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((recipe) => {
              const match = matchMap.get(recipe.id);
              const isFavorite = favoriteIds.has(recipe.id);
              return (
                <article key={recipe.id} className="relative overflow-hidden rounded-2xl border bg-[#fffdf8] text-left shadow-sm transition hover:-translate-y-1">
                  <button type="button" onClick={() => onNavigate(routes.recipe(recipe.id))} className="block w-full text-left">
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.name} loading="lazy" className="h-44 w-full object-cover" />
                    ) : (
                      <div className="grid h-44 place-items-center bg-[#edf2e8] text-[#769282]"><ChefHat size={36} /></div>
                    )}
                    <div className="p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a6b36]">{categoryLabel(recipe.category ?? "OTHER")} {recipe.region ? `· ${recipe.region}` : ""}</p>
                      <h2 className="mt-1 font-serif text-xl">{recipe.name}</h2>
                      <p className="mt-1 text-xs text-[#68706a]">{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min · {recipe.servings} servings</p>
                      <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs ${match?.canCookNow ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                        {match?.canCookNow ? "Ready to cook" : match?.insufficientIngredients.length ? "Some quantities are low" : "Missing ingredients"} · {match?.ingredientPresencePercentage ?? 0}% owned
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={favoriteBusy === recipe.id}
                    onClick={() => void toggleFavorite(recipe.id)}
                    aria-label={isFavorite ? `Remove ${recipe.name} from favorites` : `Save ${recipe.name} to favorites`}
                    className={`absolute right-3 top-3 rounded-full bg-white p-2 shadow ${isFavorite ? "text-[#ef5d4b]" : "text-[#315d55]"}`}
                  >
                    <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                </article>
              );
            })}
          </div>
          {pageCount > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Previous</button>
              <span className="text-sm">Page {currentPage} of {pageCount}</span>
              <button disabled={currentPage === pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Next</button>
            </div>
          ) : null}
        </>
      )}
    </DashboardPageShell>
  );
}
