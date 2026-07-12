import { useMemo, useState } from "react";
import {
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  EllipsisVertical,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { MetricSummaryCard } from "../../components/dashboard/MetricSummaryCard";
import { assets } from "../../data/assets";
import { recipes } from "../../features/dashboard/data";

type ItemStatus = "Pending" | "Bought" | "Skipped";
type GroceryItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  source: string;
  note: string;
  status: ItemStatus;
  image: string;
};

const initialItems: GroceryItem[] = [
  {
    id: 1,
    name: "Spinach",
    category: "Produce",
    quantity: 250,
    unit: "g",
    source: "Lemon Salmon with Quinoa Bowl",
    note: "Baby spinach",
    status: "Bought",
    image: recipes[0].image,
  },
  {
    id: 2,
    name: "Tomatoes",
    category: "Produce",
    quantity: 6,
    unit: "pieces",
    source: "Greek Salad with Lemon Vinaigrette",
    note: "Ripe",
    status: "Bought",
    image: recipes[1].image,
  },
  {
    id: 3,
    name: "Lemons",
    category: "Produce",
    quantity: 4,
    unit: "pieces",
    source: "Lemon Salmon with Quinoa Bowl",
    note: "",
    status: "Pending",
    image: assets.herbs,
  },
  {
    id: 4,
    name: "Garlic",
    category: "Produce",
    quantity: 2,
    unit: "bulbs",
    source: "Roasted Veg & Chickpea Buddha Bowl",
    note: "Fresh",
    status: "Pending",
    image: recipes[1].image,
  },
  {
    id: 5,
    name: "Greek yogurt",
    category: "Dairy & Eggs",
    quantity: 500,
    unit: "g",
    source: "Greek Yogurt Berry Parfait",
    note: "Plain, unsweetened",
    status: "Pending",
    image: recipes[2].image,
  },
  {
    id: 6,
    name: "Eggs",
    category: "Dairy & Eggs",
    quantity: 12,
    unit: "pieces",
    source: "Veggie Scramble Breakfast Bowl",
    note: "Large",
    status: "Bought",
    image: recipes[0].image,
  },
  {
    id: 7,
    name: "Quinoa",
    category: "Grains & Pantry",
    quantity: 500,
    unit: "g",
    source: "Lemon Salmon with Quinoa Bowl",
    note: "",
    status: "Pending",
    image: assets.pantry,
  },
  {
    id: 8,
    name: "Chickpeas",
    category: "Grains & Pantry",
    quantity: 2,
    unit: "cans",
    source: "Roasted Veg & Chickpea Buddha Bowl",
    note: "Low sodium",
    status: "Bought",
    image: recipes[0].image,
  },
  {
    id: 9,
    name: "Salmon fillets",
    category: "Protein",
    quantity: 4,
    unit: "pieces",
    source: "Lemon Salmon with Quinoa Bowl",
    note: "Skin-on preferred",
    status: "Pending",
    image: assets.cooking,
  },
  {
    id: 10,
    name: "Fresh herbs",
    category: "Protein",
    quantity: 1,
    unit: "bunch",
    source: "Greek Salad with Lemon Vinaigrette",
    note: "Parsley or dill",
    status: "Skipped",
    image: assets.herbs,
  },
];

const categories = ["Produce", "Dairy & Eggs", "Grains & Pantry", "Protein"];
const panel =
  "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-[0_2px_8px_rgba(30,70,50,0.06)]";

export function Grocery({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All items");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const counts = useMemo(
    () => ({
      bought: items.filter((item) => item.status === "Bought").length,
      pending: items.filter((item) => item.status === "Pending").length,
      skipped: items.filter((item) => item.status === "Skipped").length,
    }),
    [items],
  );
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) &&
          (statusFilter === "All items" || item.status === statusFilter) &&
          (categoryFilter === "All categories" ||
            item.category === categoryFilter),
      ),
    [items, query, statusFilter, categoryFilter],
  );
  const setItemStatus = (id: number, status: ItemStatus) =>
    setItems((all) =>
      all.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  const updateSelected = (patch: Partial<GroceryItem>) =>
    setItems((all) =>
      all.map((item) =>
        item.id === selected.id ? { ...item, ...patch } : item,
      ),
    );
  const addItem = () => {
    const id = Date.now();
    setItems((all) => [
      ...all,
      {
        id,
        name: "New grocery item",
        category: "Produce",
        quantity: 1,
        unit: "piece",
        source: "Manually added",
        note: "",
        status: "Pending",
        image: assets.grocery,
      },
    ]);
    setSelectedId(id);
  };

  return (
    <DashboardPageShell
      activePage="Grocery"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
    >
      <DashboardPageHeader
        title="Grocery list"
        subtitle="Shop only for what your meals still need."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <button
            onClick={addItem}
            className="flex items-center gap-2 rounded-xl bg-[#ff5f4b] px-5 py-3 text-sm text-white"
          >
            <Plus size={18} />
            Add item
          </button>
        }
      />
        <section className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricSummaryCard
            icon={<ShoppingBag />}
            value={items.length}
            label="Total items"
          />
          <MetricSummaryCard
            icon={<CheckCircle2 />}
            value={counts.bought}
            label="Bought"
            tone="green"
          />
          <MetricSummaryCard
            icon={<Circle />}
            value={counts.pending}
            label="Remaining"
            tone="yellow"
          />
          <MetricSummaryCard
            icon={<Ban />}
            value={counts.skipped}
            label="Skipped"
            tone="gray"
          />
        </section>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_275px]">
          <section className={`${panel} min-w-0 overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl">
                  Weekly meal plan shopping list
                </h2>
                <Pencil size={14} />
              </div>
              <div className="relative">
                <button
                  onClick={() => setGenerateOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-lg border border-[#4c8170] px-3 py-2 text-xs"
                >
                  <CalendarDays size={15} />
                  Generate list <ChevronDown size={14} />
                </button>
                {generateOpen && (
                  <div className="absolute right-0 top-11 z-10 w-44 rounded-lg border border-[#ded5c5] bg-white p-1 text-xs shadow-xl">
                    <button
                      onClick={() => setGenerateOpen(false)}
                      className="block w-full rounded px-3 py-2 text-left hover:bg-[#eef3ec]"
                    >
                      From meal plan
                    </button>
                    <button
                      onClick={() => setGenerateOpen(false)}
                      className="block w-full rounded px-3 py-2 text-left hover:bg-[#eef3ec]"
                    >
                      From recipe
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 p-4">
              <label className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-[#ded5c5] px-3 py-2">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                  placeholder="Search grocery list"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-[#ded5c5] bg-transparent px-3 text-xs"
              >
                <option>All items</option>
                <option>Pending</option>
                <option>Bought</option>
                <option>Skipped</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-lg border border-[#ded5c5] bg-transparent px-3 text-xs"
              >
                <option>All categories</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="grocery-table overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[2fr_.8fr_1.35fr_1fr_.75fr_30px] border-y border-[#e6ded1] px-4 py-2 text-[10px] text-[#6e706a]">
                  <span>Item</span>
                  <span>Qty needed</span>
                  <span>Source (recipe)</span>
                  <span>Note</span>
                  <span>Status</span>
                  <span />
                </div>
                {categories.map((category) => {
                  const group = visible.filter(
                    (item) => item.category === category,
                  );
                  return group.length ? (
                    <div key={category}>
                      <h3 className="border-b border-[#e6ded1] px-4 py-1 font-serif text-xs">
                        {category}{" "}
                        <small className="font-sans text-[#777]">
                          ({group.length} items)
                        </small>
                      </h3>
                      {group.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={`grid w-full grid-cols-[2fr_.8fr_1.35fr_1fr_.75fr_30px] items-center border-b border-[#e6ded1] px-4 py-1.5 text-left text-[10px] ${selectedId === item.id ? "bg-[#eff3ee]" : "hover:bg-[#faf8f2]"}`}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              onClick={(event) => {
                                event.stopPropagation();
                                setItemStatus(
                                  item.id,
                                  item.status === "Bought"
                                    ? "Pending"
                                    : "Bought",
                                );
                              }}
                              className={`grid h-5 w-5 place-items-center rounded-full border ${item.status === "Bought" ? "border-[#0b614b] bg-[#0b614b] text-white" : "border-[#aeb2ad]"}`}
                            >
                              {item.status === "Bought" && <Check size={12} />}
                            </span>
                            <img
                              className="h-9 w-9 rounded-full object-cover"
                              src={item.image}
                              alt=""
                            />
                            <strong className="font-serif text-xs font-normal">
                              {item.name}
                            </strong>
                          </span>
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          <span className="max-w-32 leading-3">
                            {item.source}
                          </span>
                          <span>{item.note || "—"}</span>
                          <span>
                            <i
                              className={`rounded-full px-3 py-1 not-italic ${item.status === "Bought" ? "bg-[#dff0df] text-[#347153]" : item.status === "Skipped" ? "bg-[#e7e7e4] text-[#666]" : "bg-[#ffe8ca] text-[#bd6c24]"}`}
                            >
                              {item.status}
                            </i>
                          </span>
                          <EllipsisVertical size={15} />
                        </button>
                      ))}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </section>
          <aside className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <section className={`${panel} p-4`}>
              <h2 className="font-serif text-lg">List progress</h2>
              <div className="mt-3 flex items-center gap-5">
                <div className="grid h-24 w-24 place-items-center rounded-full border-[14px] border-[#5c993e]">
                  <strong>
                    {Math.round((counts.bought / items.length) * 100)}%
                  </strong>
                </div>
                <ul className="space-y-2 text-xs">
                  <li>{counts.bought} Bought</li>
                  <li>{counts.pending} Remaining</li>
                  <li>{counts.skipped} Skipped</li>
                </ul>
              </div>
              <p className="mt-3 text-[10px] text-[#6e706a]">
                Pantry quantities were deducted to show only what you still
                need.
              </p>
            </section>
            <section className={`${panel} p-4`}>
              <h2 className="flex items-center gap-2 font-serif text-lg">
                <CalendarDays size={17} />
                Generated from meal plan
              </h2>
              <p className="mt-3 text-xs">Jul 20 – Jul 26, 2026</p>
              <p className="mt-1 text-xs text-[#6e706a]">12 planned meals</p>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#4c8170] py-2 text-xs">
                <RefreshCw size={14} />
                Refresh list
              </button>
            </section>
            {selected && (
              <section className={`${panel} p-4 sm:col-span-2 lg:col-span-1`}>
                <div className="flex justify-between">
                  <h2 className="font-serif text-xl">{selected.name}</h2>
                  <X size={17} />
                </div>
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Quantity</span>
                    <div className="flex rounded-lg border">
                      <button
                        onClick={() =>
                          updateSelected({
                            quantity: Math.max(0, selected.quantity - 1),
                          })
                        }
                        className="p-2"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="min-w-14 px-2 py-2 text-center">
                        {selected.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateSelected({ quantity: selected.quantity + 1 })
                        }
                        className="p-2"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <label className="flex items-center justify-between">
                    Unit
                    <select
                      value={selected.unit}
                      onChange={(event) =>
                        updateSelected({ unit: event.target.value })
                      }
                      className="rounded-lg border bg-transparent px-3 py-2"
                    >
                      <option>{selected.unit}</option>
                      <option>g</option>
                      <option>kg</option>
                      <option>pieces</option>
                      <option>cans</option>
                    </select>
                  </label>
                  <label className="block">
                    Notes
                    <textarea
                      value={selected.note}
                      onChange={(event) =>
                        updateSelected({ note: event.target.value })
                      }
                      className="mt-1 w-full resize-none rounded-lg border bg-transparent p-2"
                    />
                  </label>
                  <div>
                    <span>Recipe sources</span>
                    <p className="mt-1 text-[10px] text-[#666]">
                      {selected.source}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(["Pending", "Bought", "Skipped"] as ItemStatus[]).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => updateSelected({ status })}
                          className={`rounded-lg border py-1.5 text-[10px] ${selected.status === status ? "border-[#d88738] bg-[#fff5e7]" : ""}`}
                        >
                          {status}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <button className="mt-3 w-full rounded-lg bg-[#07513f] py-2 text-xs text-white">
                  Update item
                </button>
              </section>
            )}
            <button
              onClick={() => setCompleted(true)}
              className="rounded-2xl bg-[#07513f] p-5 text-left text-white shadow"
            >
              <span className="flex items-center gap-3 font-serif text-xl">
                <CheckCircle2 size={30} />
                {completed ? "Shopping completed" : "Complete shopping"}
              </span>
              <small className="mt-2 block pl-11">
                {counts.bought} bought items will be added to your pantry.
              </small>
            </button>
          </aside>
        </div>
    </DashboardPageShell>
  );
}
