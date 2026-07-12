import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChefHat,
  Clock3,
  Grid2X2,
  Heart,
  Leaf,
  List,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { MetricSummaryCard } from "../../components/dashboard/MetricSummaryCard";
import { assets } from "../../data/assets";
import { recipes } from "../../features/dashboard/data";

type FavoriteRecipe = {
  id: number;
  name: string;
  category: string;
  region: string;
  time: number;
  difficulty: string;
  servings: number;
  match: number;
  image: string;
  tags: string[];
};
const favoritesSeed: FavoriteRecipe[] = [
  {
    id: 1,
    name: "Lemon Herb Chickpea Bowl",
    category: "Bowls",
    region: "Mediterranean",
    time: 25,
    difficulty: "Easy",
    servings: 2,
    match: 90,
    image: recipes[0].image,
    tags: ["Vegetarian", "High protein", "Gluten-free"],
  },
  {
    id: 2,
    name: "Roasted Veg & Quinoa Salad",
    category: "Salads",
    region: "Mediterranean",
    time: 30,
    difficulty: "Easy",
    servings: 2,
    match: 88,
    image: recipes[1].image,
    tags: ["Vegetarian", "High fiber", "Whole grain"],
  },
  {
    id: 3,
    name: "Garlic Tomato Pasta",
    category: "Dinner",
    region: "Italian",
    time: 25,
    difficulty: "Easy",
    servings: 2,
    match: 85,
    image: recipes[2].image,
    tags: ["Vegetarian", "Quick", "Comfort food"],
  },
  {
    id: 4,
    name: "Greek Yogurt Berry Parfait",
    category: "Breakfast",
    region: "Mediterranean",
    time: 10,
    difficulty: "Easy",
    servings: 1,
    match: 95,
    image: recipes[0].image,
    tags: ["Vegetarian", "High protein", "Gluten-free"],
  },
  {
    id: 5,
    name: "Chickpea Coconut Curry",
    category: "Dinner",
    region: "Indian",
    time: 35,
    difficulty: "Medium",
    servings: 2,
    match: 82,
    image: recipes[1].image,
    tags: ["Vegetarian", "High fiber", "Dairy-free"],
  },
  {
    id: 6,
    name: "Mediterranean Tuna Salad",
    category: "Salads",
    region: "Mediterranean",
    time: 20,
    difficulty: "Easy",
    servings: 2,
    match: 89,
    image: recipes[2].image,
    tags: ["High protein", "Quick", "Gluten-free"],
  },
];
const panel =
  "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-[0_2px_8px_rgba(30,70,50,0.06)]";
const chips = [
  "All",
  "High pantry match",
  "Under 30 min",
  "High protein",
  "Vegetarian",
];

export function Favorites({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [favorites, setFavorites] = useState(favoritesSeed);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [region, setRegion] = useState("All regions");
  const [chip, setChip] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const visible = useMemo(
    () =>
      favorites.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(query.toLowerCase()) &&
          (category === "All categories" || recipe.category === category) &&
          (region === "All regions" || recipe.region === region) &&
          (chip === "All" ||
            (chip === "High pantry match" && recipe.match >= 90) ||
            (chip === "Under 30 min" && recipe.time < 30) ||
            recipe.tags.includes(chip)),
      ),
    [favorites, query, category, region, chip],
  );
  const removeFavorite = (id: number) =>
    setFavorites((items) => items.filter((item) => item.id !== id));
  const act = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <DashboardPageShell
      activePage="Favorites"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
    >
      <DashboardPageHeader
        title="Favorite recipes"
        subtitle="The meals you always want to come back to."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <button
            onClick={() => act("Recipe explorer opened.")}
            className="rounded-xl bg-[#ff5f4b] px-6 py-3 text-sm text-white"
          >
            Explore recipes
          </button>
        }
      />
        <section className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricSummaryCard
            icon={<Heart />}
            value={favorites.length}
            label="Saved recipes"
          />
          <MetricSummaryCard
            icon={<ChefHat />}
            value={favorites.filter((item) => item.match >= 90).length}
            label="Pantry-perfect"
          />
          <MetricSummaryCard
            icon={<Clock3 />}
            value={favorites.filter((item) => item.time < 30).length}
            label="Quick meals"
            tone="yellow"
          />
          <MetricSummaryCard
            icon={<CalendarDays />}
            value={3}
            label="Planned this week"
            tone="coral"
          />
        </section>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_275px]">
          <section className={`${panel} min-w-0 p-3`}>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-[#ded5c5] px-3 py-2">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                  placeholder="Search favorites"
                />
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-lg border bg-transparent px-3 py-2 text-xs"
              >
                <option>All categories</option>
                <option>Bowls</option>
                <option>Salads</option>
                <option>Dinner</option>
                <option>Breakfast</option>
              </select>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="rounded-lg border bg-transparent px-3 py-2 text-xs"
              >
                <option>All regions</option>
                <option>Mediterranean</option>
                <option>Italian</option>
                <option>Indian</option>
              </select>
              <select className="rounded-lg border bg-transparent px-3 py-2 text-xs">
                <option>Recently saved</option>
                <option>Pantry match</option>
                <option>Quickest</option>
              </select>
              <div className="flex rounded-lg border">
                <button className="bg-[#eef3ec] p-2">
                  <Grid2X2 size={16} />
                </button>
                <button className="p-2">
                  <List size={16} />
                </button>
              </div>
            </div>
            <div className="my-3 flex gap-2 overflow-x-auto">
              {chips.map((item) => (
                <button
                  key={item}
                  onClick={() => setChip(item)}
                  className={`flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] ${chip === item ? "border-[#07513f] bg-[#07513f] text-white" : "border-[#ded5c5]"}`}
                >
                  <SlidersHorizontal className="mr-1" size={12} />
                  {item}
                </button>
              ))}
            </div>
            <article className="mb-3 grid overflow-hidden rounded-xl border border-[#ded5c5] sm:grid-cols-[38%_1fr]">
              <div className="relative">
                <img
                  src={assets.cooking}
                  alt="Grilled Salmon and Herb Quinoa"
                  className="h-full min-h-48 w-full object-cover"
                />
                <Heart
                  className="absolute left-3 top-3 rounded-full bg-white p-1 text-[#f05242]"
                  size={28}
                  fill="currentColor"
                />
              </div>
              <div className="grid content-center p-4">
                <small className="tracking-wider text-[#6f716b]">
                  COOK THIS NEXT
                </small>
                <h2 className="mt-1 font-serif text-2xl">
                  Grilled Salmon & Herb Quinoa
                </h2>
                <p className="mt-1 text-[11px] text-[#666862]">
                  Flaky grilled salmon over herbed quinoa with roasted
                  vegetables and lemon vinaigrette.
                </p>
                <div className="my-3 flex flex-wrap gap-5 text-xs">
                  <span>
                    <Leaf className="inline" size={15} /> 92% pantry match
                  </span>
                  <span>
                    <Clock3 className="inline" size={15} /> 30 min
                  </span>
                  <span>
                    <ChefHat className="inline" size={15} /> Medium
                  </span>
                  <span>
                    <Users className="inline" size={15} /> 2 servings
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => act("Recipe opened.")}
                    className="rounded-lg bg-[#07513f] py-2 text-xs text-white"
                  >
                    View recipe
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("Meals");
                    }}
                    className="rounded-lg border border-[#4f8574] py-2 text-xs"
                  >
                    Add to meal plan
                  </button>
                </div>
              </div>
            </article>
            {visible.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onRemove={() => removeFavorite(recipe.id)}
                    onView={() => act(`${recipe.name} opened.`)}
                    onPlan={() => onNavigate("Meals")}
                  />
                ))}
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <Heart className="mx-auto text-[#8aa89a]" size={36} />
                  <h2 className="mt-3 font-serif text-2xl">
                    No favorites found
                  </h2>
                  <p className="mt-1 text-xs text-[#666862]">
                    Try another filter or explore recipes to save more.
                  </p>
                </div>
              </div>
            )}
          </section>
          <aside className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <section className={`${panel} p-4`}>
              <h2 className="font-serif text-lg">Your favorites</h2>
              <p className="mt-1 text-[10px] text-[#666862]">
                Recipe categories
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className="grid h-24 w-24 place-items-center rounded-full border-[14px] border-[#5d963e]">
                  <BarChart3 size={21} />
                </div>
                <ul className="space-y-2 text-xs">
                  <li>4 Bowls</li>
                  <li>3 Dinner</li>
                  <li>2 Breakfast</li>
                  <li>3 Other</li>
                </ul>
              </div>
              <p className="mt-3 text-xs">{favorites.length} saved recipes</p>
            </section>
            <section className={`${panel} p-4`}>
              <h2 className="font-serif text-lg">Ready from your pantry</h2>
              <p className="text-[10px] text-[#666862]">
                Top matches you can make now
              </p>
              <div className="mt-2 divide-y">
                {favorites.slice(0, 3).map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => act(`${recipe.name} opened.`)}
                    className="flex w-full items-center gap-2 py-2 text-left"
                  >
                    <img
                      src={recipe.image}
                      alt=""
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                    <span className="flex-1 font-serif text-xs">
                      {recipe.name}
                      <small className="mt-1 block font-sans text-[9px]">
                        {recipe.time} min · {recipe.servings} servings
                      </small>
                    </span>
                    <b className="rounded-lg bg-[#e4efe1] p-2 text-[9px]">
                      {recipe.match}%
                    </b>
                  </button>
                ))}
              </div>
            </section>
            <section
              className={`${panel} flex items-center gap-4 p-5 sm:col-span-2 lg:col-span-1`}
            >
              <Heart className="shrink-0 text-[#23634e]" size={34} />
              <p className="text-xs">
                <strong className="block">
                  Save recipes with the heart icon while you explore.
                </strong>
                <span className="mt-2 block text-[10px] text-[#666862]">
                  Your favorites will appear here so you can find them anytime.
                </span>
              </p>
            </section>
          </aside>
        </div>
      {notice && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#07513f] px-5 py-3 text-sm text-white shadow-xl">
          {notice}
        </div>
      )}
    </DashboardPageShell>
  );
}

function RecipeCard({
  recipe,
  onRemove,
  onView,
  onPlan,
}: {
  recipe: FavoriteRecipe;
  onRemove: () => void;
  onView: () => void;
  onPlan: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#ded5c5] bg-[#fffdf8]">
      <div className="relative">
        <img src={recipe.image} alt="" className="h-28 w-full object-cover" />
        <button
          onClick={onRemove}
          aria-label="Remove favorite"
          className="absolute left-2 top-2 rounded-full bg-white p-1 text-[#f05242]"
        >
          <Heart size={18} fill="currentColor" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-serif text-sm">{recipe.name}</h3>
        <p className="text-[9px] text-[#666862]">
          {recipe.category} · {recipe.region}
        </p>
        <div className="my-2 flex gap-3 text-[9px]">
          <span>
            <Clock3 className="inline" size={11} /> {recipe.time} min
          </span>
          <span>{recipe.difficulty}</span>
          <span>{recipe.servings} servings</span>
        </div>
        <span className="rounded-full bg-[#e5f0e3] px-2 py-1 text-[9px]">
          {recipe.match}% pantry match
        </span>
        <div className="mt-2 flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <i
              key={tag}
              className="rounded-full bg-[#f0f1ec] px-2 py-1 text-[8px] not-italic"
            >
              {tag}
            </i>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onView}
            className="rounded-lg bg-[#07513f] py-2 text-[10px] text-white"
          >
            View recipe
          </button>
          <button
            onClick={onPlan}
            className="rounded-lg border border-[#4f8574] py-2 text-[10px]"
          >
            Plan meal
          </button>
        </div>
      </div>
    </article>
  );
}
