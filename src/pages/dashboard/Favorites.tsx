import { useEffect, useMemo, useState } from "react";
import { ChefHat, Clock3, Heart, Search, Users } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { MetricSummaryCard } from "../../components/dashboard/MetricSummaryCard";
import { api, cachedApi, getCachedApiValue, invalidateApiCache } from "../../services/api";
import { Recipe } from "../../types/inventory";
import { routes } from "../../types/navigation";

type Favorite = {
  id: string;
  createdAt: string;
  recipe: Recipe;
};

const panel = "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-sm";
const favoritesPath = "/favorites";

function totalMinutes(recipe: Recipe) {
  return recipe.prepTimeMinutes + recipe.cookTimeMinutes;
}

function categoryLabel(category?: string) {
  return (category ?? "Other").replace(/_/g, " ").toLowerCase();
}

export function Favorites({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>(() => getCachedApiValue<Favorite[]>(favoritesPath) ?? []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(() => getCachedApiValue<Favorite[]>(favoritesPath) === null);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");

  const loadFavorites = async (force = false) => {
    setLoading(true);
    setError("");
    try {
      setFavorites(await cachedApi<Favorite[]>(favoritesPath, { ttlMs: 60_000, force }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load your favorites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFavorites();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(favorites.map((item) => item.recipe.category).filter(Boolean))) as string[],
    [favorites],
  );

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return favorites.filter(({ recipe }) => {
      const matchesQuery = !normalizedQuery || [recipe.name, recipe.description, recipe.region]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      const matchesCategory = category === "ALL" || recipe.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, favorites, query]);

  const removeFavorite = async (recipeId: string) => {
    setRemoving(recipeId);
    setError("");
    try {
      await api(`/favorites/${recipeId}`, { method: "DELETE" });
      invalidateApiCache(favoritesPath);
      setFavorites((current) => current.filter((item) => item.recipe.id !== recipeId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove that favorite.");
    } finally {
      setRemoving("");
    }
  };

  const quickMeals = favorites.filter((item) => totalMinutes(item.recipe) <= 30).length;
  const highProtein = favorites.filter((item) => item.recipe.proteinPerServing >= 25).length;

  return (
    <DashboardPageShell
      activePage="Favorites"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
    >
      <DashboardPageHeader
        title="Favorite recipes"
        subtitle="The recipes you have saved, synced to your account."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <button
            onClick={() => onNavigate("Explore")}
            className="rounded-xl bg-[#ff5f4b] px-6 py-3 text-sm text-white"
          >
            Explore recipes
          </button>
        }
      />

      {error ? (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => void loadFavorites(true)} className="font-semibold">Retry</button>
        </div>
      ) : null}

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <MetricSummaryCard icon={<Heart />} value={favorites.length} label="Saved recipes" />
        <MetricSummaryCard icon={<Clock3 />} value={quickMeals} label="Ready in 30 minutes" tone="yellow" />
        <MetricSummaryCard icon={<ChefHat />} value={highProtein} label="High-protein meals" tone="coral" />
      </section>

      <section className={`${panel} p-4`}>
        <div className="mb-4 flex flex-wrap gap-3">
          <label className="flex min-w-56 flex-1 items-center gap-2 rounded-xl border border-[#ded5c5] bg-white px-3 py-2.5">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search saved recipes"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-[#ded5c5] bg-white px-4 py-2.5 text-sm capitalize"
          >
            <option value="ALL">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{categoryLabel(item)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid min-h-72 place-items-center text-sm text-[#6b746f]">Loading favorites…</div>
        ) : visible.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map(({ id, recipe }) => (
              <article key={id} className="overflow-hidden rounded-2xl border border-[#ded5c5] bg-white">
                <div className="relative">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.name} loading="lazy" className="h-44 w-full object-cover" />
                  ) : (
                    <div className="grid h-44 place-items-center bg-[#edf2e8] text-[#71917f]">
                      <ChefHat size={34} />
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${recipe.name} from favorites`}
                    disabled={removing === recipe.id}
                    onClick={() => void removeFavorite(recipe.id)}
                    className="absolute right-3 top-3 rounded-full bg-white p-2 text-[#ef5d4b] shadow disabled:opacity-50"
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#688178]">
                    {categoryLabel(recipe.category)} {recipe.region ? `· ${recipe.region}` : ""}
                  </p>
                  <h2 className="mt-1 font-serif text-xl text-[#164a41]">{recipe.name}</h2>
                  <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-[#68706c]">
                    {recipe.description ?? "A saved Pantry-to-Plate recipe."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-[#52635d]">
                    <span><Clock3 className="mr-1 inline" size={13} />{totalMinutes(recipe)} min</span>
                    <span><Users className="mr-1 inline" size={13} />{recipe.servings} servings</span>
                    <span>{recipe.difficulty ?? "Easy"}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate(routes.recipe(recipe.id))}
                      className="rounded-lg bg-[#07513f] py-2.5 text-xs text-white"
                    >
                      View recipe
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate("Meals")}
                      className="rounded-lg border border-[#4f8574] py-2.5 text-xs text-[#07513f]"
                    >
                      Plan meal
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center text-center">
            <div>
              <Heart className="mx-auto text-[#83a293]" size={38} />
              <h2 className="mt-3 font-serif text-2xl text-[#164a41]">
                {favorites.length ? "No favorites match those filters" : "No favorites yet"}
              </h2>
              <p className="mt-1 text-sm text-[#68706c]">Save recipes from Explore and they will appear here.</p>
              <button onClick={() => onNavigate("Explore")} className="mt-4 rounded-xl bg-[#07513f] px-5 py-3 text-sm text-white">
                Explore recipes
              </button>
            </div>
          </div>
        )}
      </section>
    </DashboardPageShell>
  );
}
