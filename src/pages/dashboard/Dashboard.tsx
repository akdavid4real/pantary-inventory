import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Clock3,
  Heart,
  Leaf,
  Menu,
  Search,
} from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { StatusPanel } from "../../components/dashboard/StatusPanel";
import { panelClassName } from "../../components/dashboard/styles";
import { days, featuredMeal, recipes } from "../../features/dashboard/data";

export function Dashboard({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState(2);
  const [favorites, setFavorites] = useState<number[]>([1]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const toggleFavorite = (id: number) =>
    setFavorites((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const act = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <DashboardPageShell
      activePage="Home"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
      mainClassName="px-4 py-5 sm:px-7 lg:px-8 xl:px-10"
    >
        <header className="mb-6 flex items-start justify-between gap-5">
          <div className="flex items-start gap-3">
            <button
              className="mt-2 rounded-lg border border-[#d9d0c1] p-2 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <div>
              <h1 className="m-0 font-serif text-4xl font-normal leading-tight text-[#092e27] sm:text-5xl">
                Good morning, Alex
              </h1>
              <p className="mt-1 text-lg text-[#303330]">
                Let’s plan something delicious.
              </p>
              <span className="mt-2 flex items-center gap-2 text-[#eba91e]">
                — <Leaf size={15} fill="currentColor" /> —
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-7 md:flex">
            <label className="flex w-[385px] items-center gap-3 rounded-xl border border-[#d9d0c1] bg-white/40 px-5 py-3.5 text-[#656862]">
              <Search size={21} />
              <input
                className="w-full border-0 bg-transparent text-sm outline-none"
                placeholder="Search meals, ingredients, or recipes"
              />
            </label>
            <button className="p-2" aria-label="Notifications">
              <Bell size={25} />
            </button>
            <button
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dfe6dc] text-xl font-semibold shadow"
              aria-label="Open profile"
            >
              A
            </button>
          </div>
        </header>
        <section
          className={`${panelClassName} mb-4 grid grid-cols-7 overflow-hidden p-2`}
          aria-label="Choose date"
        >
          {days.map(([day, date], index) => (
            <button
              key={date}
              className={`border-r border-[#e3dacb] py-2 text-center last:border-0 ${selectedDay === index ? "rounded-xl !border-0 bg-[#064536] text-white shadow" : ""}`}
              onClick={() => setSelectedDay(index)}
            >
              <span className="block text-xs">{day}</span>
              <strong className="font-serif text-2xl font-normal">
                {date}
              </strong>
            </button>
          ))}
        </section>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,1fr)]">
          <article className={`${panelClassName} overflow-hidden`}>
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="font-serif text-[27px]">Today’s plan</h2>
              <button aria-label="Favorite meal">
                <Heart size={22} />
              </button>
            </div>
            <div className="grid gap-5 p-5 pt-2 sm:grid-cols-[minmax(260px,.95fr)_1fr]">
              <img
                className="h-56 w-full rounded-xl object-cover"
                src={featuredMeal.image}
                alt="Grilled salmon with green vegetables"
              />
              <div className="flex flex-col justify-center">
                <h3 className="font-serif text-[31px] leading-[1.05]">
                  {featuredMeal.title}
                </h3>
                <div className="mt-3 flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock3 size={15} />
                    25 min
                  </span>
                  <span className="flex items-center gap-1">
                    <Leaf size={15} fill="currentColor" />
                    High pantry match
                  </span>
                </div>
                <p className="my-3 max-w-sm text-xs leading-5 text-[#696a65]">
                  Bright, healthy, and ready in under 30 minutes with what you
                  already have.
                </p>
                <button
                  className="flex w-fit items-center gap-8 rounded-lg bg-[#ff614e] px-6 py-3 text-white shadow"
                  onClick={() => act("Cooking mode is ready.")}
                >
                  Start cooking <ArrowRight size={18} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-[#f0f3e9] px-5 py-3 text-xs">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                <Leaf size={17} />
              </span>
              <span>Pantry match</span>
              <i className="h-2 flex-1 overflow-hidden rounded-full bg-[#dce1d5]">
                <b className="block h-full w-[92%] rounded-full bg-[#277157]" />
              </i>
              <strong>92%</strong>
            </div>
          </article>
          <article className={`${panelClassName} flex flex-col p-5`}>
            <h2 className="font-serif text-[27px]">Nutrition balance</h2>
            <div className="flex flex-1 flex-wrap items-center justify-around gap-7 py-4">
              <div
                className="grid h-44 w-44 place-items-center rounded-full"
                style={{
                  background:
                    "conic-gradient(#f2ad20 0 40%, #146146 40% 70%, #dc584e 70% 100%)",
                }}
              >
                <span className="grid h-28 w-28 place-items-center rounded-full bg-[#fffdf8] text-center">
                  <span>
                    <strong className="block font-serif text-3xl font-normal">
                      860
                    </strong>
                    kcal
                  </span>
                </span>
              </div>
              <ul className="space-y-5 text-sm">
                <li>
                  <i className="mr-3 inline-block h-5 w-5 rounded-full bg-[#f2ad20] align-middle" />
                  Carbs <b className="ml-4 font-normal">40%</b>
                </li>
                <li>
                  <i className="mr-3 inline-block h-5 w-5 rounded-full bg-[#146146] align-middle" />
                  Protein <b className="ml-4 font-normal">30%</b>
                </li>
                <li>
                  <i className="mr-3 inline-block h-5 w-5 rounded-full bg-[#dc584e] align-middle" />
                  Fats <b className="ml-4 font-normal">30%</b>
                </li>
              </ul>
            </div>
            <footer className="flex justify-between text-xs">
              <span>Based on today’s plan</span>
              <button
                className="flex items-center gap-4"
                onClick={() => act("Nutrition details opened.")}
              >
                View details <ArrowRight size={18} />
              </button>
            </footer>
          </article>
          <article className={`${panelClassName} p-4`}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-[26px]">
                Recommended from your pantry
              </h2>
              <button className="text-xs">View all</button>
            </div>
            <div className="space-y-1">
              {recipes.map((recipe) => (
                <div
                  className="grid items-center overflow-hidden rounded-xl border border-[#e4daca] bg-white/25 sm:grid-cols-[200px_1fr_auto_auto]"
                  key={recipe.id}
                >
                  <img
                    className="h-24 w-full object-cover"
                    src={recipe.image}
                    alt=""
                  />
                  <div className="px-4 py-2">
                    <h3 className="font-serif text-[16px]">{recipe.title}</h3>
                    <div className="mt-2 flex gap-4 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock3 size={13} />
                        {recipe.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Leaf size={13} fill="currentColor" />
                        {recipe.match}
                      </span>
                    </div>
                  </div>
                  <button
                    className="p-3"
                    onClick={() => toggleFavorite(recipe.id)}
                    aria-label="Toggle favorite"
                  >
                    <Heart
                      size={20}
                      fill={
                        favorites.includes(recipe.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                  <button
                    className="flex items-center gap-3 whitespace-nowrap px-4 text-xs"
                    onClick={() => act(`${recipe.title} opened.`)}
                  >
                    View recipe <ArrowRight size={17} />
                  </button>
                </div>
              ))}
            </div>
          </article>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatusPanel
              type="pantry"
              onAction={() => act("Pantry review opened.")}
            />
            <StatusPanel
              type="grocery"
              onAction={() => act("Grocery list opened.")}
            />
          </div>
        </section>
      {notice && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#073f32] px-5 py-3 text-sm text-white shadow-xl"
          role="status"
        >
          {notice}
        </div>
      )}
    </DashboardPageShell>
  );
}
