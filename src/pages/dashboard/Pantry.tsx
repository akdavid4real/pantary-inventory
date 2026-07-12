import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  ChevronDown,
  CircleCheck,
  Clock3,
  EllipsisVertical,
  Grid2X2,
  Leaf,
  List,
  Minus,
  PackageOpen,
  Plus,
  Refrigerator,
  Search,
  Snowflake,
  Trash2,
  X,
} from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { MetricSummaryCard } from "../../components/dashboard/MetricSummaryCard";
import { assets } from "../../data/assets";
import { recipes } from "../../features/dashboard/data";

type PantryItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  expiry: string;
  days?: number;
  status: "Fresh" | "Use soon" | "Low stock";
  image: string;
  threshold: number;
  notes: string;
};

const initialItems: PantryItem[] = [
  {
    id: 1,
    name: "Spinach",
    category: "Vegetables",
    quantity: 250,
    unit: "g",
    location: "Fridge",
    expiry: "Jul 24, 2026",
    days: 2,
    status: "Use soon",
    image: recipes[0].image,
    threshold: 100,
    notes: "Baby spinach, keep dry.",
  },
  {
    id: 2,
    name: "Tomatoes",
    category: "Vegetables",
    quantity: 6,
    unit: "pieces",
    location: "Counter",
    expiry: "Jul 25, 2026",
    days: 3,
    status: "Use soon",
    image: recipes[1].image,
    threshold: 2,
    notes: "Keep at room temperature.",
  },
  {
    id: 3,
    name: "Brown rice",
    category: "Grains",
    quantity: 1.2,
    unit: "kg",
    location: "Pantry",
    expiry: "No expiry",
    status: "Fresh",
    image: assets.pantry,
    threshold: 0.3,
    notes: "Store in an airtight jar.",
  },
  {
    id: 4,
    name: "Chickpeas",
    category: "Legumes",
    quantity: 3,
    unit: "cans",
    location: "Pantry",
    expiry: "Apr 10, 2027",
    status: "Fresh",
    image: recipes[0].image,
    threshold: 1,
    notes: "Canned chickpeas.",
  },
  {
    id: 5,
    name: "Greek yogurt",
    category: "Dairy",
    quantity: 500,
    unit: "g",
    location: "Fridge",
    expiry: "Jul 26, 2026",
    days: 4,
    status: "Use soon",
    image: recipes[2].image,
    threshold: 150,
    notes: "Plain Greek yogurt.",
  },
  {
    id: 6,
    name: "Frozen berries",
    category: "Frozen",
    quantity: 750,
    unit: "g",
    location: "Freezer",
    expiry: "Feb 14, 2027",
    status: "Fresh",
    image: recipes[2].image,
    threshold: 200,
    notes: "Mixed berries.",
  },
  {
    id: 7,
    name: "Olive oil",
    category: "Oils & Fats",
    quantity: 600,
    unit: "ml",
    location: "Pantry",
    expiry: "No expiry",
    status: "Fresh",
    image: assets.herbs,
    threshold: 150,
    notes: "Extra virgin olive oil.",
  },
  {
    id: 8,
    name: "Avocados",
    category: "Fruits",
    quantity: 2,
    unit: "pieces",
    location: "Counter",
    expiry: "Jul 27, 2026",
    days: 5,
    status: "Low stock",
    image: recipes[0].image,
    threshold: 2,
    notes: "Ready to eat.",
  },
];

const panel =
  "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-[0_2px_8px_rgba(30,70,50,0.06)]";
const locations = ["All", "Pantry", "Fridge", "Freezer", "Counter"];

function LocationIcon({
  location,
  size = 16,
}: {
  location: string;
  size?: number;
}) {
  if (location === "Fridge") return <Refrigerator size={size} />;
  if (location === "Freezer") return <Snowflake size={size} />;
  if (location === "Counter") return <PackageOpen size={size} />;
  return <Box size={size} />;
}

export function Pantry({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(1);
  const [location, setLocation] = useState("All");
  const [status, setStatus] = useState("All status");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (location === "All" || item.location === location) &&
          (status === "All status" || item.status === status) &&
          item.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, location, status, query],
  );
  const expiring = items.filter((item) => item.days && item.days <= 7);
  const updateQuantity = (delta: number) =>
    setItems((all) =>
      all.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              quantity: Math.max(0, Number((item.quantity + delta).toFixed(1))),
            }
          : item,
      ),
    );
  const removeSelected = () => {
    setItems((all) => all.filter((item) => item.id !== selected.id));
    setSelectedId(items.find((item) => item.id !== selected.id)?.id ?? 0);
  };
  const addItem = () => {
    const id = Date.now();
    setItems((all) => [
      ...all,
      {
        id,
        name: "New ingredient",
        category: "Other",
        quantity: 1,
        unit: "item",
        location: "Pantry",
        expiry: "No expiry",
        status: "Fresh",
        image: assets.pantry,
        threshold: 1,
        notes: "Add item notes.",
      },
    ]);
    setSelectedId(id);
  };

  return (
    <DashboardPageShell
      activePage="Pantry"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
    >
      <DashboardPageHeader
        title="My pantry"
        subtitle="Know what you have. Use it before it goes."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <button
            onClick={addItem}
            className="flex items-center gap-2 rounded-xl bg-[#ff5f4b] px-5 py-3 text-sm text-white"
          >
            <Plus size={18} /> Add item
          </button>
        }
      />
        <section className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricSummaryCard icon={<Box />} value={items.length} label="Total items" />
          <MetricSummaryCard
            icon={<Clock3 />}
            value={expiring.length}
            label="Expiring soon"
            tone="coral"
          />
          <MetricSummaryCard
            icon={<AlertTriangle />}
            value={items.filter((item) => item.status === "Low stock").length}
            label="Low stock"
            tone="yellow"
          />
          <MetricSummaryCard icon={<Leaf />} value="92%" label="Pantry health" />
        </section>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_275px]">
          <section className={`${panel} min-w-0 overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="flex flex-wrap gap-3">
                <label className="flex w-64 items-center gap-2 rounded-lg border border-[#ded5c5] px-3 py-2">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full bg-transparent text-xs outline-none"
                    placeholder="Search pantry"
                  />
                </label>
                <select
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="rounded-lg border border-[#ded5c5] bg-transparent px-3 py-2 text-xs"
                >
                  <option>All</option>
                  {locations.slice(1).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-lg border border-[#ded5c5] bg-transparent px-3 py-2 text-xs"
                >
                  <option>All status</option>
                  <option>Fresh</option>
                  <option>Use soon</option>
                  <option>Low stock</option>
                </select>
              </div>
              <div className="flex rounded-lg border border-[#ded5c5]">
                <button className="p-2">
                  <Grid2X2 size={17} />
                </button>
                <button className="bg-[#eef3ec] p-2">
                  <List size={17} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto border-y border-[#e5ddd0] px-3 py-2">
              {locations.map((item) => (
                <button
                  key={item}
                  onClick={() => setLocation(item)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs ${location === item ? "bg-[#07513f] text-white" : ""}`}
                >
                  <LocationIcon location={item} />
                  {item}
                </button>
              ))}
            </div>
            <div className="pantry-table overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[2fr_1fr_.8fr_1fr_1fr_.8fr_30px] px-4 py-3 text-[11px] text-[#696b66]">
                  <span>Item</span>
                  <span>Category</span>
                  <span>Quantity</span>
                  <span>Location</span>
                  <span>Expiry</span>
                  <span>Status</span>
                  <span />
                </div>
                {visible.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`grid w-full grid-cols-[2fr_1fr_.8fr_1fr_1fr_.8fr_30px] items-center border-t border-[#e5ddd0] px-4 py-2 text-left text-xs ${selectedId === item.id ? "bg-[#eff3ee] ring-1 ring-inset ring-[#8eab9e]" : "hover:bg-[#faf8f2]"}`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full border ${selectedId === item.id ? "border-[#0b614b] bg-[#0b614b] text-white" : "border-[#b8bbb5]"}`}
                      >
                        {selectedId === item.id && <CircleCheck size={14} />}
                      </span>
                      <img
                        className="h-11 w-11 rounded-full object-cover"
                        src={item.image}
                        alt=""
                      />
                      <strong className="font-serif text-sm font-normal">
                        {item.name}
                      </strong>
                    </span>
                    <span>{item.category}</span>
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                    <span className="flex items-center gap-2">
                      <LocationIcon location={item.location} />
                      {item.location}
                    </span>
                    <span>
                      {item.expiry}
                      {item.days && (
                        <small className="block text-[#ec624d]">
                          ({item.days} days)
                        </small>
                      )}
                    </span>
                    <span>
                      <i
                        className={`inline-block rounded-full px-3 py-1 not-italic ${item.status === "Fresh" ? "bg-[#dff0df] text-[#347153]" : item.status === "Low stock" ? "bg-[#fff0cc] text-[#a16d16]" : "bg-[#ffe5cc] text-[#c4662d]"}`}
                      >
                        {item.status}
                      </i>
                    </span>
                    <EllipsisVertical size={16} />
                  </button>
                ))}
              </div>
            </div>
            <footer className="flex items-center justify-between border-t border-[#e5ddd0] px-4 py-3 text-[11px]">
              <span>
                Showing 1–{visible.length} of {items.length} items
              </span>
              <div className="flex gap-2">
                <button className="rounded border px-3 py-1">‹</button>
                <button className="rounded bg-[#07513f] px-3 py-1 text-white">
                  1
                </button>
                <button className="rounded border px-3 py-1">2</button>
                <button className="rounded border px-3 py-1">›</button>
              </div>
            </footer>
          </section>
          <aside className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <section className={`${panel} p-4`}>
              <div className="flex justify-between">
                <h2 className="font-serif text-lg">Use these first</h2>
                <button className="text-xs">
                  View all ({expiring.length})
                </button>
              </div>
              <div className="mt-2 divide-y">
                {expiring.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className="flex w-full items-center gap-3 py-2 text-left"
                  >
                    <img
                      src={item.image}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span className="flex-1 text-xs">
                      <strong className="block font-serif font-normal">
                        {item.name}
                      </strong>
                      {item.quantity} {item.unit}
                    </span>
                    <span className="text-[10px] text-[#e45e4d]">
                      {item.days} days left
                    </span>
                  </button>
                ))}
              </div>
              <button className="mt-2 flex w-full items-center justify-center gap-3 rounded-lg bg-[#ff5f4b] py-2 text-xs text-white">
                Find recipes <ChevronDown className="-rotate-90" size={15} />
              </button>
            </section>
            {selected && (
              <section className={`${panel} p-4 sm:col-span-2 lg:col-span-1`}>
                <div className="flex justify-between">
                  <h2 className="font-serif text-xl">{selected.name}</h2>
                  <button>
                    <X size={18} />
                  </button>
                </div>
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Quantity</span>
                    <div className="flex items-center rounded-lg border">
                      <button
                        onClick={() => updateQuantity(-1)}
                        className="p-2"
                      >
                        <Minus size={13} />
                      </button>
                      <b className="min-w-16 text-center font-normal">
                        {selected.quantity} {selected.unit}
                      </b>
                      <button onClick={() => updateQuantity(1)} className="p-2">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <Detail label="Location" value={selected.location} />
                  <Detail label="Expiry date" value={selected.expiry} />
                  <Detail
                    label="Low-stock threshold"
                    value={`${selected.threshold} ${selected.unit}`}
                  />
                  <div>
                    <span>Notes</span>
                    <textarea
                      className="mt-1 w-full resize-none rounded-lg border border-[#ded5c5] bg-transparent p-2"
                      value={selected.notes}
                      readOnly
                    />
                  </div>
                </div>
                <button className="mt-3 w-full rounded-lg bg-[#07513f] py-2 text-xs text-white">
                  Update item
                </button>
                <button
                  onClick={removeSelected}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#ed6c5b] py-2 text-xs text-[#dc5948]"
                >
                  <Trash2 size={14} />
                  Remove item
                </button>
                <div className="mt-4 border-t pt-3">
                  <h3 className="font-serif text-base">Recent history</h3>
                  <p className="mt-2 text-[10px] text-[#6d6e69]">
                    Used 50 g{" "}
                    <span className="float-right">Today, 9:15 AM</span>
                  </p>
                  <p className="mt-2 text-[10px] text-[#6d6e69]">
                    Added 300 g <span className="float-right">Jul 9, 2026</span>
                  </p>
                </div>
              </section>
            )}
          </aside>
        </div>
    </DashboardPageShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="rounded-lg border border-[#ded5c5] px-3 py-2">
        {value}
      </span>
    </div>
  );
}
