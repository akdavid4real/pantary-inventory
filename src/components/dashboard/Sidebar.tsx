import {
  BarChart3,
  ChefHat,
  CookingPot,
  Heart,
  FileText,
  Home,
  LogOut,
  Search,
  Settings,
  ShoppingBasket,
  Sprout,
} from "lucide-react";
import { Brand } from "../Brand";

const links = [
  [Home, "Home"],
  [ChefHat, "Meals"],
  [CookingPot, "Pantry"],
  [ShoppingBasket, "Grocery"],
  [Search, "Explore"],
  [FileText, "My Recipes"],
  [Heart, "Favorites"],
  [BarChart3, "Analytics"],
  [Settings, "Settings"],
] as const;

export function Sidebar({
  active,
  onSelect,
  onSignOut,
}: {
  active: string;
  onSelect: (label: string) => void;
  onSignOut: () => void;
}) {
  return (
    <aside className="dashboard-sidebar flex h-full w-[230px] shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-[#073f32] to-[#06382d] px-4 py-5 text-white shadow-2xl lg:w-[222px]">
      <div className="mb-5 flex flex-col items-center text-center">
        <Brand inverse />
      </div>
      <nav className="space-y-1" aria-label="Main navigation">
        {links.map(([Icon, label]) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className={`flex w-full items-center gap-4 rounded-xl px-5 py-3 text-left text-[15px] transition ${active === label ? "bg-white/15 shadow-inner" : "hover:bg-white/10"}`}
          >
            <Icon size={21} strokeWidth={1.7} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl bg-white/[0.06] px-4 pb-4 pt-3 text-sm leading-5">
        <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-[#76a987] bg-[#0c513f]">
          <Sprout size={19} />
        </span>
        <strong className="font-serif text-[15px] leading-5">
          From what you have
          <br />
          to what you’ll love.
        </strong>
        <i className="my-2 block h-0.5 w-8 bg-[#f2b441]" />
        <p className="m-0 text-[11px] leading-[1.55] text-white/80">
          AI-powered meals.
          <br />
          Real ingredients.
          <br />
          Real results.
        </p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-white/15 px-4 py-3 text-left text-sm text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <LogOut size={19} strokeWidth={1.8} />
        <span>Sign out</span>
      </button>
    </aside>
  );
}
