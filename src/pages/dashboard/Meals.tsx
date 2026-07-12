import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Clock3,
  Coffee,
  EllipsisVertical,
  Leaf,
  Minus,
  Moon,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { recipes } from "../../features/dashboard/data";

type PlannedMeal = {
  id: number;
  day: number;
  type: string;
  title: string;
  time: string;
  servings: number;
  image: string;
  match: boolean;
};
const types = ["Breakfast", "Lunch", "Dinner", "Snack"];
const week = [
  ["Mon", "20"],
  ["Tue", "21"],
  ["Wed", "22"],
  ["Thu", "23"],
  ["Fri", "24"],
  ["Sat", "25"],
  ["Sun", "26"],
];
const initialMeals: PlannedMeal[] = [
  {
    id: 1,
    day: 0,
    type: "Breakfast",
    title: "Berry Oat Breakfast Bowl",
    time: "15 min",
    servings: 2,
    image: recipes[0].image,
    match: true,
  },
  {
    id: 2,
    day: 2,
    type: "Breakfast",
    title: "Greek Yogurt Parfait",
    time: "10 min",
    servings: 2,
    image: recipes[2].image,
    match: true,
  },
  {
    id: 3,
    day: 0,
    type: "Lunch",
    title: "Lemon Herb Chickpea Bowl",
    time: "25 min",
    servings: 2,
    image: recipes[0].image,
    match: true,
  },
  {
    id: 4,
    day: 2,
    type: "Lunch",
    title: "Roasted Veg & Quinoa Salad",
    time: "25 min",
    servings: 2,
    image: recipes[1].image,
    match: true,
  },
  {
    id: 5,
    day: 3,
    type: "Lunch",
    title: "Lentil & Veggie Soup",
    time: "30 min",
    servings: 4,
    image: recipes[2].image,
    match: false,
  },
  {
    id: 6,
    day: 0,
    type: "Dinner",
    title: "Grilled Salmon & Herb Quinoa",
    time: "30 min",
    servings: 2,
    image: recipes[2].image,
    match: true,
  },
  {
    id: 7,
    day: 1,
    type: "Dinner",
    title: "Garlic Tomato Pasta",
    time: "20 min",
    servings: 2,
    image: recipes[1].image,
    match: true,
  },
  {
    id: 8,
    day: 2,
    type: "Dinner",
    title: "Chicken Stir-Fry with Veggies",
    time: "25 min",
    servings: 2,
    image: recipes[0].image,
    match: true,
  },
  {
    id: 9,
    day: 5,
    type: "Dinner",
    title: "Lemon Garlic Chicken",
    time: "35 min",
    servings: 2,
    image: recipes[2].image,
    match: true,
  },
  {
    id: 10,
    day: 1,
    type: "Snack",
    title: "Apple & Almond Butter",
    time: "5 min",
    servings: 1,
    image: recipes[1].image,
    match: true,
  },
];

const panel =
  "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-[0_2px_8px_rgba(30,70,50,0.06)]";

function MealTypeIcon({ type }: { type: string }) {
  if (type === "Breakfast") return <Sun size={23} />;
  if (type === "Lunch") return <CircleDot size={23} />;
  if (type === "Dinner") return <Moon size={23} />;
  return <Coffee size={23} />;
}

export function Meals({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(2);
  const [selectedId, setSelectedId] = useState(2);
  const [filter, setFilter] = useState("All meals");
  const [meals, setMeals] = useState(initialMeals);
  const selected = meals.find((meal) => meal.id === selectedId) ?? meals[0];
  const visibleTypes = filter === "All meals" ? types : [filter];
  const plannedCount = meals.length;
  const perfectCount = useMemo(
    () => meals.filter((meal) => meal.match).length,
    [meals],
  );

  const addMeal = (day: number, type: string) => {
    const id = Date.now();
    const recipe = recipes[(day + types.indexOf(type)) % recipes.length];
    setMeals((items) => [
      ...items,
      {
        id,
        day,
        type,
        title: recipe.title,
        time: recipe.time,
        servings: 2,
        image: recipe.image,
        match: true,
      },
    ]);
    setSelectedId(id);
  };

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
        subtitle="Plan your week, use what you have, and waste less."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <button
            onClick={() => addMeal(selectedDay, "Dinner")}
            className="flex items-center gap-2 rounded-xl bg-[#ff5f4b] px-5 py-3 text-sm text-white"
          >
            <Plus size={18} /> Add meal
          </button>
        }
      />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_250px] xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className={`${panel} meal-planner overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded5c5] px-4 py-3">
              <div className="flex items-center gap-3">
                <button className="rounded-lg border border-[#ded5c5] p-2">
                  <ArrowLeft size={18} />
                </button>
                <button className="rounded-lg border border-[#ded5c5] p-2">
                  <ArrowRight size={18} />
                </button>
                <strong className="ml-3 font-serif text-xl font-normal">
                  July 20 – 26, 2026
                </strong>
                <button
                  onClick={() => setSelectedDay(2)}
                  className="ml-2 flex items-center gap-2 rounded-lg border border-[#ded5c5] px-3 py-2 text-xs"
                >
                  Today <CalendarDays size={14} />
                </button>
              </div>
              <div className="flex gap-3">
                <label className="relative">
                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    className="appearance-none rounded-lg border border-[#ded5c5] bg-transparent py-2 pl-3 pr-9 text-xs outline-none"
                  >
                    <option>All meals</option>
                    {types.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-2.5"
                    size={14}
                  />
                </label>
                <button className="flex items-center gap-2 rounded-lg border border-[#ded5c5] px-3 py-2 text-xs">
                  <Leaf size={15} />
                  Pantry match <ChevronDown size={14} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[970px]">
                <div className="grid grid-cols-[90px_repeat(7,minmax(120px,1fr))] border-b border-[#ded5c5]">
                  <span />
                  {week.map(([day, date], index) => (
                    <button
                      onClick={() => setSelectedDay(index)}
                      key={day}
                      className={`m-2 rounded-full py-1 text-xs ${selectedDay === index ? "bg-[#07513f] text-white" : ""}`}
                    >
                      {day} {date}
                    </button>
                  ))}
                </div>
                {visibleTypes.map((type) => (
                  <div
                    key={type}
                    className="grid min-h-[145px] grid-cols-[90px_repeat(7,minmax(120px,1fr))] border-b border-[#e7dfd3] last:border-0"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 border-r border-[#e7dfd3] font-serif text-sm">
                      <MealTypeIcon type={type} />
                      {type}
                    </div>
                    {week.map((_, day) => {
                      const meal = meals.find(
                        (item) => item.day === day && item.type === type,
                      );
                      return (
                        <div
                          className="border-r border-[#e7dfd3] p-1.5 last:border-0"
                          key={day}
                        >
                          {meal ? (
                            <button
                              onClick={() => setSelectedId(meal.id)}
                              className={`h-full w-full rounded-lg border bg-[#f9f6ee] p-1.5 text-left transition ${selectedId === meal.id ? "border-[#26735b] shadow-sm" : "border-[#e3dacd]"}`}
                            >
                              <img
                                className="h-14 w-full rounded-md object-cover"
                                src={meal.image}
                                alt=""
                              />
                              <strong className="mt-1 block font-serif text-xs font-normal leading-tight">
                                {meal.title}
                              </strong>
                              <span className="mt-1 flex items-center gap-1 text-[10px]">
                                <Clock3 size={11} />
                                {meal.time}
                              </span>
                              <span className="mt-1 flex items-center gap-2 text-[10px] text-[#3f7d61]">
                                <Leaf size={11} />
                                {meal.servings} servings
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => addMeal(day, type)}
                              className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-[#ded5c5] text-xs text-[#8d8b83]"
                            >
                              <Plus size={13} /> Add meal
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <aside className="meal-side grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <section className={`${panel} p-4`}>
              <h2 className="flex items-center gap-2 font-serif text-xl">
                <CalendarDays size={19} />
                This week
              </h2>
              <div className="my-4 grid grid-cols-2 divide-x border-y border-[#e3dacd] py-4">
                <p className="font-serif text-4xl">
                  {plannedCount}
                  <span className="ml-2 inline-block font-sans text-[10px] leading-3">
                    meals
                    <br />
                    planned
                  </span>
                </p>
                <p className="pl-4 font-serif text-4xl">
                  {perfectCount}
                  <span className="ml-2 inline-block font-sans text-[10px] leading-3">
                    pantry-
                    <br />
                    perfect
                  </span>
                </p>
              </div>
              <small>Nutrition totals</small>
              <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[9px]">
                <b className="rounded-lg bg-[#f3eee3] p-2">
                  8,450
                  <br />
                  cal
                </b>
                <b className="rounded-lg bg-[#f3eee3] p-2">
                  312 g<br />
                  protein
                </b>
                <b className="rounded-lg bg-[#f3eee3] p-2">
                  980 g<br />
                  carbs
                </b>
                <b className="rounded-lg bg-[#f3eee3] p-2">
                  276 g<br />
                  fats
                </b>
              </div>
            </section>
            <section className={`${panel} p-4`}>
              <h2 className="font-serif text-lg text-[#b66732]">
                Expiring soon
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[#f3eee3] p-3">
                  <Leaf className="mb-2 text-[#3f7d61]" size={20} />
                  Spinach
                  <br />
                  <span className="text-[#df604d]">2 days left</span>
                </div>
                <div className="rounded-lg bg-[#f3eee3] p-3">
                  <CircleDot className="mb-2 text-[#df604d]" size={20} />
                  Tomatoes
                  <br />
                  <span className="text-[#df604d]">3 days left</span>
                </div>
              </div>
              <p className="mt-3 text-[11px]">Plan a meal to use these up.</p>
            </section>
            {selected && (
              <section className={`${panel} p-4 sm:col-span-2 2xl:col-span-1`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl">Selected meal</h2>
                  <button aria-label="More actions">
                    <EllipsisVertical size={18} />
                  </button>
                </div>
                <div className="mt-3 flex gap-3">
                  <img
                    className="h-20 w-20 rounded-lg object-cover"
                    src={selected.image}
                    alt=""
                  />
                  <div>
                    <h3 className="font-serif text-sm">{selected.title}</h3>
                    <span className="mt-2 flex items-center gap-1 text-[10px]">
                      <Clock3 size={12} />
                      {selected.time}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[10px]">
                      <Leaf size={12} />
                      Pantry match
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center overflow-hidden rounded-lg border border-[#ded5c5]">
                    <button
                      onClick={() =>
                        setMeals((items) =>
                          items.map((meal) =>
                            meal.id === selected.id
                              ? {
                                  ...meal,
                                  servings: Math.max(1, meal.servings - 1),
                                }
                              : meal,
                          ),
                        )
                      }
                      className="p-2"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-xs">
                      {selected.servings} servings
                    </span>
                    <button
                      onClick={() =>
                        setMeals((items) =>
                          items.map((meal) =>
                            meal.id === selected.id
                              ? { ...meal, servings: meal.servings + 1 }
                              : meal,
                          ),
                        )
                      }
                      className="p-2"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    aria-label="Remove meal"
                    onClick={() => {
                      setMeals((items) =>
                        items.filter((meal) => meal.id !== selected.id),
                      );
                      setSelectedId(0);
                    }}
                    className="text-[#d75a4d]"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-4">
                  <small>Notes</small>
                  <p className="mt-1 text-[11px] text-[#696b66]">
                    Add a drizzle of honey and a sprinkle of chia seeds.
                  </p>
                </div>
                <button className="mt-4 w-full rounded-lg border border-[#5f8b79] py-2 text-xs">
                  View recipe
                </button>
              </section>
            )}
          </aside>
        </div>
    </DashboardPageShell>
  );
}
