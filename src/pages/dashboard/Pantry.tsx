import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  ChevronRight,
  CircleCheck,
  Clock3,
  EllipsisVertical,
  Leaf,
  LayoutGrid,
  List,
  LoaderCircle,
  Minus,
  PackageOpen,
  Plus,
  Refrigerator,
  Search,
  Snowflake,
  Trash2,
  X,
} from "lucide-react";
import { FoodImage } from "../../components/FoodImage";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { MetricSummaryCard } from "../../components/dashboard/MetricSummaryCard";
import { api } from "../../services/api";
import { getCachedIngredientCatalog, loadIngredientCatalog } from "../../services/catalog";
import { ingredientUnitOptions, unitHelp, unitLabels } from "../../utils/units";
import { UnitConversion } from "../../types/inventory";

type StorageLocation = "PANTRY" | "FRIDGE" | "FREEZER" | "COUNTER";
type Ingredient = {
  id: string;
  name: string;
  imageUrl?: string | null;
  category: string;
  defaultUnit: string;
  storageLocation: StorageLocation;
  averageCostNaira?: number | null;
  conversions?: UnitConversion[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
};
type PantryItem = {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  expiryDate?: string | null;
  storageLocation: StorageLocation;
  lowStockThreshold?: number | null;
  notes?: string | null;
  ingredient: Ingredient;
};
type PantryLog = {
  id: string;
  type: string;
  quantity: number;
  unit: string;
  reason?: string | null;
  createdAt: string;
};
const panel =
  "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-[0_2px_8px_rgba(30,70,50,0.06)]";
const locations: Array<"ALL" | StorageLocation> = [
  "ALL",
  "PANTRY",
  "FRIDGE",
  "FREEZER",
  "COUNTER",
];

function label(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}
function daysUntil(value?: string | null) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}
function itemStatus(item: PantryItem) {
  if (item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold)
    return "Low stock";
  const days = daysUntil(item.expiryDate);
  if (days != null && days <= 7) return "Use soon";
  return "Fresh";
}
function formatQuantity(value: number) {
  return Number(value.toFixed(3)).toLocaleString();
}
function LocationIcon({
  location,
  size = 16,
}: {
  location: string;
  size?: number;
}) {
  if (location === "FRIDGE") return <Refrigerator size={size} />;
  if (location === "FREEZER") return <Snowflake size={size} />;
  if (location === "COUNTER") return <PackageOpen size={size} />;
  return <Box size={size} />;
}

export function Pantry({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => getCachedIngredientCatalog() as Ingredient[]);
  const [selectedId, setSelectedId] = useState("");
  const [location, setLocation] = useState<"ALL" | StorageLocation>("ALL");
  const [status, setStatus] = useState("All status");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<PantryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [pantry, catalog] = await Promise.all([
        api<PantryItem[]>("/pantry"),
        loadIngredientCatalog() as Promise<Ingredient[]>,
      ]);
      setItems(pantry);
      setIngredients(catalog);
      setSelectedId((current) =>
        pantry.some((item) => item.id === current)
          ? current
          : (pantry[0]?.id ?? ""),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load your pantry.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!selectedId) {
      setSelectedHistory([]);
      return;
    }
    void api<PantryItem & { logs?: PantryLog[] }>(`/pantry/${selectedId}`)
      .then((item) => {
        if (!ignore) setSelectedHistory(item.logs ?? []);
      })
      .catch(() => {
        if (!ignore) setSelectedHistory([]);
      });
    return () => {
      ignore = true;
    };
  }, [selectedId]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const visible = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery = item.ingredient.name
          .toLowerCase()
          .includes(query.toLowerCase());
        return (
          matchesQuery &&
          (location === "ALL" || item.storageLocation === location) &&
          (status === "All status" || itemStatus(item) === status)
        );
      }),
    [items, location, query, status],
  );
  const expiring = items.filter((item) => {
    const days = daysUntil(item.expiryDate);
    return days != null && days >= 0 && days <= 7;
  });
  const lowStock = items.filter(
    (item) =>
      item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold,
  );
  const health = items.length
    ? Math.max(
        0,
        Math.round(
          ((items.length - expiring.length - lowStock.length) / items.length) *
            100,
        ),
      )
    : 0;

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };
  const selectItem = (id: string) => {
    setSelectedId(id);
  };
  const openAdd = () => {
    setEditorOpen(true);
  };

  const remove = async (item: PantryItem) => {
    if (!window.confirm(`Remove ${item.ingredient.name} from your pantry?`))
      return;
    setBusyId(item.id);
    try {
      await api(`/pantry/${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      selectItem("");
      flash(`${item.ingredient.name} removed.`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to remove item.",
      );
    } finally {
      setBusyId("");
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ingredient = ingredients.find(
      (entry) => entry.id === String(form.get("ingredientId")),
    );
    const editingId = String(form.get("itemId") ?? "");
    const itemToEdit = items.find((item) => item.id === editingId) ?? null;
    const body = {
      ingredientId: ingredient?.id,
      quantity: Number(form.get("quantity")),
      unit: String(form.get("unit")),
      storageLocation: String(form.get("storageLocation")),
      expiryDate: form.get("expiryDate")
        ? new Date(String(form.get("expiryDate"))).toISOString()
        : null,
      lowStockThreshold: form.get("lowStockThreshold")
        ? Number(form.get("lowStockThreshold"))
        : null,
      notes: String(form.get("notes") ?? "") || null,
    };
    setSaving(true);
    setError("");
    try {
      if (itemToEdit) {
        const updated = await api<PantryItem>(`/pantry/${itemToEdit.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setItems((current) =>
          current.map((item) =>
            item.id === itemToEdit.id
              ? {
                  ...item,
                  ...updated,
                  ingredient: updated.ingredient ?? item.ingredient,
                }
              : item,
          ),
        );
        flash(`${itemToEdit.ingredient.name} updated.`);
      } else {
        const created = await api<PantryItem>("/pantry", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setItems((current) => [created, ...current]);
        setSelectedId(created.id);
        flash(`${created.ingredient.name} added.`);
      }
      if (!itemToEdit) {
        setEditorOpen(false);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save pantry item.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || (error && items.length === 0 && ingredients.length === 0)) {
    return (
      <DashboardPageShell activePage="Pantry" menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} onNavigate={onNavigate} rootClassName="pantry-page">
        <DashboardPageHeader title="My pantry" subtitle="Know what you have. Use it before it goes." onOpenMenu={() => setMenuOpen(true)} />
        <div className={`${panel} grid min-h-80 place-items-center p-8 text-center`} role={error ? "alert" : "status"}>
          <div className="max-w-md">
            {loading ? <LoaderCircle className="mx-auto mb-4 animate-spin text-[#17604a]" size={30} /> : <AlertTriangle className="mx-auto mb-4 text-[#c64b3c]" size={30} />}
            <h2 className="font-serif text-2xl">{loading ? "Loading your pantry" : "We could not reach your pantry"}</h2>
            <p className="mt-2 text-sm leading-6 text-[#696a65]">{loading ? "Your saved quantities and storage details are being prepared." : error}</p>
            {error ? <button type="button" className="mt-5 rounded-lg bg-[#064536] px-6 py-3 text-sm text-white" onClick={() => void load()}>Try again</button> : null}
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      activePage="Pantry"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
      rootClassName="pantry-page"
    >
      <DashboardPageHeader
        title="My pantry"
        subtitle="Know what you have. Use it before it goes."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <button
            onClick={openAdd}
            className="pantry-primary flex items-center gap-2 rounded-xl bg-[#ff5f4b] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,95,75,.22)] transition hover:-translate-y-0.5 hover:bg-[#f45140] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07513f]"
          >
            <Plus size={18} /> Add item
          </button>
        }
      />
      {error ? (
        <div
          className="mb-3 flex items-center justify-between rounded-xl border border-[#efb8ae] bg-[#fff2ef] px-4 py-3 text-sm text-[#9c352b]"
          role="alert"
        >
          <span>{error}</span>
          <span className="flex items-center gap-3">
            <button type="button" className="font-medium underline" onClick={() => void load()}>Try again</button>
            <button type="button" aria-label="Dismiss error" onClick={() => setError("")}><X size={17} /></button>
          </span>
        </div>
      ) : null}
      <section className="pantry-metrics mb-4 grid gap-3">
        <MetricSummaryCard
          icon={<Box />}
          value={items.length}
          label="Total items"
        />
        <MetricSummaryCard
          icon={<Clock3 />}
          value={expiring.length}
          label="Expiring soon"
          tone="coral"
        />
        <MetricSummaryCard
          icon={<AlertTriangle />}
          value={lowStock.length}
          label="Low stock"
          tone="yellow"
        />
        <MetricSummaryCard
          icon={<Leaf />}
          value={`${health}%`}
          label="Pantry health"
        />
      </section>

      <div className="pantry-workspace grid gap-4">
        <section className={`${panel} pantry-inventory-panel min-w-0 overflow-hidden`}>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <label className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-[#ded5c5] bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-[#7ba394] focus-within:ring-4 focus-within:ring-[#07513f]/5">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search your pantry"
              />
            </label>
            <select
              value={location}
              onChange={(event) =>
                setLocation(event.target.value as "ALL" | StorageLocation)
              }
              className="rounded-xl border border-[#ded5c5] bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-[#7ba394]"
              aria-label="Filter by location"
            >
              {locations.map((entry) => (
                <option key={entry} value={entry}>
                  {entry === "ALL" ? "All locations" : label(entry)}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-[#ded5c5] bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-[#7ba394]"
            >
              <option>All status</option>
              <option>Fresh</option>
              <option>Use soon</option>
              <option>Low stock</option>
            </select>
            <div className="ml-auto flex rounded-xl border border-[#ded5c5] bg-[#f7f4ec] p-1" aria-label="Choose pantry view">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Grid view"
                className={`flex h-8 items-center gap-2 rounded-lg px-3 text-xs transition ${view === "grid" ? "bg-white text-[#07513f] shadow-sm" : "text-[#777972] hover:text-[#07513f]"}`}
              >
                <LayoutGrid size={16} /> Grid
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label="List view"
                className={`flex h-8 items-center gap-2 rounded-lg px-3 text-xs transition ${view === "list" ? "bg-white text-[#07513f] shadow-sm" : "text-[#777972] hover:text-[#07513f]"}`}
              >
                <List size={17} /> List
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-y border-[#e5ddd0] bg-[#fcfaf5] px-4 py-2.5">
            {locations.map((entry) => (
              <button
                key={entry}
                onClick={() => setLocation(entry)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${location === entry ? "bg-[#07513f] text-white shadow-md" : "text-[#476158] hover:bg-[#edf2e8]"}`}
              >
                <LocationIcon location={entry} />
                {label(entry)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid min-h-80 place-items-center">
              <span className="flex items-center gap-2 text-sm text-[#676b65]">
                <LoaderCircle className="animate-spin" size={18} /> Loading
                pantry…
              </span>
            </div>
          ) : visible.length ? (
            view === "list" ? (
            <div className="overflow-hidden">
              <div className="w-full min-w-0">
                <div className="pantry-table-grid grid px-3 py-3 text-[11px] text-[#696b66]">
                  <span>Item</span>
                  <span className="pantry-col-category">Category</span>
                  <span>Quantity</span>
                  <span className="pantry-col-location">Location</span>
                  <span className="pantry-col-expiry">Expiry</span>
                  <span>Status</span>
                  <span aria-hidden="true" />
                </div>
                {visible.map((item) => {
                  const days = daysUntil(item.expiryDate);
                  const state = itemStatus(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item.id)}
                      className={`pantry-row pantry-table-grid grid w-full items-center border-t border-[#e5ddd0] px-3 py-2 text-left text-xs transition ${selectedId === item.id ? "bg-[#edf4ef] ring-1 ring-inset ring-[#8eab9e]" : "hover:bg-[#faf8f2]"}`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-full border ${selectedId === item.id ? "border-[#0b614b] bg-[#0b614b] text-white" : "border-[#b8bbb5]"}`}
                        >
                          {selectedId === item.id ? (
                            <CircleCheck size={14} />
                          ) : null}
                        </span>
                        {item.ingredient.imageUrl ? (
                          <FoodImage
                            className="h-10 w-10 shrink-0 rounded-xl border border-white object-cover shadow-sm"
                            src={item.ingredient.imageUrl}
                            alt=""
                            variant="thumb"
                          />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf1e8]">
                            <Leaf size={17} />
                          </span>
                        )}
                        <strong className="min-w-0 truncate font-serif text-sm font-normal capitalize" title={item.ingredient.name}>
                          {item.ingredient.name}
                        </strong>
                      </span>
                      <span className="pantry-col-category min-w-0 truncate" title={label(item.ingredient.category)}>{label(item.ingredient.category)}</span>
                      <span className="min-w-0 truncate">
                        {formatQuantity(item.quantity)} {item.unit}
                      </span>
                      <span className="pantry-col-location flex min-w-0 items-center gap-1.5 truncate" title={label(item.storageLocation)}>
                        <LocationIcon location={item.storageLocation} />
                        {label(item.storageLocation)}
                      </span>
                      <span className="pantry-col-expiry min-w-0 truncate">
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString()
                          : "No expiry"}
                        {days != null && days >= 0 && days <= 7 ? (
                          <small className="block text-[#ec624d]">
                            {days} days left
                          </small>
                        ) : null}
                      </span>
                      <span>
                        <i
                          className={`inline-block rounded-full px-3 py-1 not-italic ${state === "Fresh" ? "bg-[#dff0df] text-[#347153]" : state === "Low stock" ? "bg-[#fff0cc] text-[#a16d16]" : "bg-[#ffe5cc] text-[#c4662d]"}`}
                        >
                          {state}
                        </i>
                      </span>
                      <span className="grid place-items-center text-[#627069]">
                        <EllipsisVertical size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-3">
                {visible.map((item) => {
                  const state = itemStatus(item);
                  const days = daysUntil(item.expiryDate);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectItem(item.id)}
                      className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-[0_6px_22px_rgba(29,61,49,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(29,61,49,.12)] ${selectedId === item.id ? "border-[#4f8875] ring-2 ring-[#07513f]/10" : "border-[#e3dbce]"}`}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#eef2e9]">
                        {item.ingredient.imageUrl ? (
                          <FoodImage
                            src={item.ingredient.imageUrl}
                            alt={item.ingredient.name}
                            variant="card"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <span className="grid h-full place-items-center text-[#5d7e70]"><Leaf size={30} /></span>
                        )}
                        <i className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold not-italic shadow-sm ${state === "Fresh" ? "bg-[#e2f2e4] text-[#347153]" : state === "Low stock" ? "bg-[#fff0cc] text-[#9a6917]" : "bg-[#ffe5cc] text-[#b95828]"}`}>
                          {state}
                        </i>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-xl capitalize text-[#103a31]">{item.ingredient.name}</h3>
                            <p className="mt-0.5 text-[11px] text-[#777972]">{label(item.ingredient.category)}</p>
                          </div>
                          <strong className="text-sm font-semibold text-[#07513f]">{formatQuantity(item.quantity)} {item.unit}</strong>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-[#eee8de] pt-3 text-[11px] text-[#5e6b65]">
                          <span className="flex items-center gap-1.5"><LocationIcon location={item.storageLocation} size={14} />{label(item.storageLocation)}</span>
                          <span className={days != null && days <= 7 ? "font-medium text-[#d95b48]" : ""}>
                            {item.expiryDate ? (days != null && days >= 0 ? `${days} days left` : "Expired") : "No expiry"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="grid min-h-80 place-items-center px-6 text-center">
              <div className="max-w-sm">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#edf2e8]">
                  <PackageOpen />
                </span>
                <h2 className="font-serif text-2xl">
                  {items.length
                    ? "No matching pantry items"
                    : "Your pantry is ready to be stocked"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6d706b]">
                  {items.length
                    ? "Try clearing a filter or searching for another ingredient."
                    : "Choose from the seeded Nigerian ingredient catalog to unlock recipes and smarter grocery lists."}
                </p>
                {!items.length ? (
                  <button
                    className="mt-5 rounded-lg bg-[#07513f] px-5 py-3 text-sm text-white"
                    onClick={openAdd}
                  >
                    Add your first item
                  </button>
                ) : null}
              </div>
            </div>
          )}
          <footer className="border-t border-[#e5ddd0] px-4 py-3 text-[11px]">
            Showing {visible.length} of {items.length} items
          </footer>
        </section>

        {selected ? (
          <button
            type="button"
            className="pantry-detail-scrim"
            aria-label="Close item details"
            onClick={() => selectItem("")}
          />
        ) : null}

        <aside className="pantry-sidebar grid content-start gap-3">
          <section className={`${panel} p-4`}>
            <div className="flex justify-between">
              <h2 className="font-serif text-lg">Use these first</h2>
              <span className="text-xs text-[#476158]">
                View all ({expiring.length})
              </span>
            </div>
            {expiring.length ? (
              <div className="mt-2 divide-y">
                {expiring.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item.id)}
                    className="flex w-full items-center gap-3 py-2 text-left"
                  >
                    {item.ingredient.imageUrl ? (
                      <FoodImage
                        src={item.ingredient.imageUrl}
                        alt=""
                        variant="thumb"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edf2e8]">
                        <Leaf size={15} />
                      </span>
                    )}
                    <span className="flex-1 text-xs">
                      <strong className="block font-serif font-normal">
                        {item.ingredient.name}
                      </strong>
                      {formatQuantity(item.quantity)} {item.unit}
                    </span>
                    <span className="text-[10px] text-[#e45e4d]">
                      {daysUntil(item.expiryDate)} days
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-[#70736e]">
                Nothing expires in the next seven days.
              </p>
            )}
            <button
              onClick={() => onNavigate("Explore")}
              className="mt-2 flex w-full items-center justify-center gap-3 rounded-lg bg-[#ff5f4b] py-2 text-xs text-white"
            >
              Find recipes <ChevronRight size={15} />
            </button>
          </section>

          {selected ? (
            <section
              className={`${panel} pantry-detail-panel p-4 sm:col-span-2 lg:col-span-1`}
              aria-label={`${selected.ingredient.name} details`}
            >
              <div className="flex items-start justify-between">
                <h2 className="font-serif text-xl capitalize">
                  {selected.ingredient.name}
                </h2>
                <button
                  onClick={() => selectItem("")}
                  className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-[#edf1e8]"
                  aria-label="Close item details"
                >
                  <X size={18} />
                </button>
              </div>
              <PantryInlineEditor
                key={selected.id}
                item={selected}
                saving={saving}
                removing={busyId === selected.id}
                onRemove={() => remove(selected)}
                onSubmit={save}
              />
            </section>
          ) : null}

          {selected ? (
            <section
              className={`${panel} pantry-history-panel p-4 sm:col-span-2 lg:col-span-1`}
              aria-label="Recent pantry history"
            >
              <h2 className="flex items-center gap-2 font-serif text-lg">
                <Clock3 size={18} /> Recent history
              </h2>
              {selectedHistory.length ? (
                <div className="mt-3 divide-y divide-[#e8e1d6]">
                  {selectedHistory.slice(0, 3).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 py-2 text-[11px] text-[#626b66]"
                    >
                      <span className="capitalize">
                        {label(entry.type)} {entry.quantity} {entry.unit}
                      </span>
                      <time dateTime={entry.createdAt}>
                        {new Date(entry.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#73766f]">
                  No recent quantity changes.
                </p>
              )}
            </section>
          ) : null}
        </aside>
      </div>

      {editorOpen ? (
        <PantryEditor
          ingredients={ingredients}
          saving={saving}
          onClose={() => setEditorOpen(false)}
          onSubmit={save}
        />
      ) : null}
      {notice ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#073f32] px-5 py-3 text-sm text-white shadow-xl"
          role="status"
        >
          {notice}
        </div>
      ) : null}
    </DashboardPageShell>
  );
}

function PantryInlineEditor({
  item,
  saving,
  removing,
  onRemove,
  onSubmit,
}: {
  item: PantryItem;
  saving: boolean;
  removing: boolean;
  onRemove: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);

  return (
    <form className="pantry-inline-editor mt-4 space-y-3" onSubmit={onSubmit}>
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="ingredientId" value={item.ingredientId} />
      <div className="pantry-side-field">
        <label htmlFor={`pantry-quantity-${item.id}`}>Quantity</label>
        <div className="flex min-w-0 overflow-hidden rounded-lg border border-[#ded5c5] bg-white focus-within:border-[#07513f] focus-within:ring-2 focus-within:ring-[#07513f]/10">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(0, current - 1))}
            className="grid w-9 shrink-0 place-items-center border-r border-[#e8e1d6] text-[#07513f] transition hover:bg-[#edf4ef]"
            aria-label="Decrease quantity"
          >
            <Minus size={13} />
          </button>
          <input
            id={`pantry-quantity-${item.id}`}
            name="quantity"
            type="number"
            min="0"
            step="0.1"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-center text-xs outline-none"
            required
          />
          <select
            name="unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className="w-14 border-0 border-l border-[#e8e1d6] bg-transparent px-2 text-xs outline-none"
            aria-label="Quantity unit"
            required
          >
            {ingredientUnitOptions(item.ingredient).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setQuantity((current) => current + 1)}
            className="grid w-9 shrink-0 place-items-center border-l border-[#e8e1d6] text-[#07513f] transition hover:bg-[#edf4ef]"
            aria-label="Increase quantity"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="pantry-side-field">
        <label htmlFor={`pantry-location-${item.id}`}>Location</label>
        <select
          id={`pantry-location-${item.id}`}
          name="storageLocation"
          defaultValue={item.storageLocation}
          className="pantry-side-control"
        >
          {locations.slice(1).map((entry) => (
            <option key={entry} value={entry}>
              {label(entry)}
            </option>
          ))}
        </select>
      </div>

      <div className="pantry-side-field">
        <label htmlFor={`pantry-expiry-${item.id}`}>Expiry date</label>
        <input
          id={`pantry-expiry-${item.id}`}
          name="expiryDate"
          type="date"
          defaultValue={item.expiryDate?.slice(0, 10) ?? ""}
          className="pantry-side-control"
        />
      </div>

      <div className="pantry-side-field">
        <label htmlFor={`pantry-threshold-${item.id}`}>
          Low-stock threshold
        </label>
        <div className="flex overflow-hidden rounded-lg border border-[#ded5c5] bg-white focus-within:border-[#07513f] focus-within:ring-2 focus-within:ring-[#07513f]/10">
          <input
            id={`pantry-threshold-${item.id}`}
            name="lowStockThreshold"
            type="number"
            min="0"
            step="0.1"
            defaultValue={item.lowStockThreshold ?? ""}
            placeholder="Not set"
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-xs outline-none"
          />
          <span className="grid min-w-11 place-items-center border-l border-[#e8e1d6] px-2 text-[11px] text-[#6d746f]">
            {unit}
          </span>
        </div>
      </div>

      <div className="pantry-side-field items-start">
        <label htmlFor={`pantry-notes-${item.id}`} className="pt-2">
          Notes
        </label>
        <textarea
          id={`pantry-notes-${item.id}`}
          name="notes"
          defaultValue={item.notes ?? ""}
          placeholder="Optional notes"
          className="min-h-16 w-full resize-none rounded-lg border border-[#ded5c5] bg-white p-2.5 text-xs outline-none focus:border-[#07513f] focus:ring-2 focus:ring-[#07513f]/10"
        />
      </div>

      <button
        disabled={saving}
        className="w-full rounded-lg bg-[#07513f] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0a614c] disabled:opacity-50"
      >
        {saving ? "Updating…" : "Update item"}
      </button>
      <button
        type="button"
        disabled={removing || saving}
        onClick={onRemove}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#ff6250] px-3 py-2.5 text-xs text-[#ef5745] transition hover:bg-[#fff0ed] disabled:opacity-50"
      >
        <Trash2 size={14} /> {removing ? "Removing…" : "Remove item"}
      </button>
    </form>
  );
}

function PantryEditor({
  ingredients,
  saving,
  onClose,
  onSubmit,
}: {
  ingredients: Ingredient[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [unit, setUnit] = useState(ingredients[0]?.defaultUnit ?? "g");
  const [ingredientQuery, setIngredientQuery] = useState("");
  const ingredient = ingredients.find((entry) => entry.id === ingredientId);
  useEffect(() => {
    if (ingredient) setUnit(ingredient.defaultUnit);
  }, [ingredient]);
  const matchingIngredients = useMemo(
    () =>
      ingredients.filter((entry) =>
        `${entry.name} ${entry.category}`
          .toLowerCase()
          .includes(ingredientQuery.trim().toLowerCase()),
      ),
    [ingredientQuery, ingredients],
  );
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#052d25]/65 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] border border-white/60 bg-[#fffdf8] p-6 shadow-[0_30px_90px_rgba(3,35,28,.35)] sm:p-8"
      >
        <div className="-mx-6 -mt-6 mb-6 flex items-start justify-between border-b border-[#e4dccf] bg-[linear-gradient(120deg,#f2f5eb,#fff8ed)] px-6 py-6 sm:-mx-8 sm:-mt-8 sm:px-8">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#b77a18]">Pantry inventory</span>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl">
              Add something you have
            </h2>
            <p className="mt-1 text-sm text-[#696c67]">
              Pick from your Nigerian ingredient catalog and record the stock details.
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border bg-white transition hover:rotate-90" aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="ingredientId" value={ingredientId} />
          <div className="sm:col-span-2">
              <div className="mb-3 flex items-end justify-between gap-3">
                <label className="flex flex-1 items-center gap-2 rounded-xl border border-[#d9d2c6] bg-white px-3.5 py-3 shadow-sm focus-within:border-[#5d8d7c] focus-within:ring-4 focus-within:ring-[#07513f]/5">
                  <Search size={17} className="text-[#68736d]" />
                  <input
                    value={ingredientQuery}
                    onChange={(event) => setIngredientQuery(event.target.value)}
                    placeholder="Search ingredients or categories"
                    className="w-full bg-transparent text-sm outline-none"
                    autoFocus
                  />
                </label>
                <span className="hidden text-xs text-[#73756f] sm:block">{matchingIngredients.length} available</span>
              </div>
              <div className="pantry-ingredient-picker grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-[#e2dbcf] bg-[#f7f4ed] p-2 sm:grid-cols-3">
                {matchingIngredients.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setIngredientId(entry.id)}
                    className={`group flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left transition ${ingredientId === entry.id ? "border-[#2e715b] bg-[#e8f1eb] shadow-sm ring-2 ring-[#07513f]/10" : "border-transparent bg-white hover:-translate-y-0.5 hover:border-[#b9cec4]"}`}
                  >
                    {entry.imageUrl ? (
                      <FoodImage src={entry.imageUrl} alt="" variant="thumb" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#e8eee7]"><Leaf size={16} /></span>
                    )}
                    <span className="min-w-0">
                      <strong className="block truncate font-serif text-sm font-normal capitalize">{entry.name}</strong>
                      <small className="block truncate text-[10px] text-[#777972]">{label(entry.category)}</small>
                    </span>
                  </button>
                ))}
              </div>
              {!matchingIngredients.length ? (
                <p className="py-5 text-center text-sm text-[#6f726d]">No ingredient matches that search.</p>
              ) : null}
          </div>
          {ingredient ? (
            <div className="sm:col-span-2 flex items-center gap-5 rounded-2xl border border-[#d6e2da] bg-[#edf4ef] p-4">
              {ingredient.imageUrl ? (
                <FoodImage
                  src={ingredient.imageUrl}
                  alt={ingredient.name}
                  variant="thumb"
                  className="h-20 w-20 rounded-2xl object-cover shadow-md sm:h-24 sm:w-24"
                />
              ) : (
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white text-[#527566] sm:h-24 sm:w-24"><Leaf size={24} /></span>
              )}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#668174]">Selected ingredient</span>
                <strong className="mt-1 block font-serif text-xl capitalize">
                  {ingredient.name}
                </strong>
                <p className="text-xs text-[#666a65]">
                  Default unit: {ingredient.defaultUnit}
                  {ingredient.averageCostNaira
                    ? ` · ₦${ingredient.averageCostNaira.toLocaleString()}`
                    : ""}
                </p>
              </div>
            </div>
          ) : null}
          <Field label="Quantity">
            <input
              name="quantity"
              type="number"
              min="0"
              step="0.1"
              defaultValue={1}
              required
            />
          </Field>
          <Field label="How do you measure it?">
            <select
              name="unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              required
            >
              {ingredientUnitOptions(ingredient).map((option) => (
                <option key={option} value={option}>{unitLabels[option] ?? option}</option>
              ))}
            </select>
            <small className="mt-1 block text-[10px] leading-4 text-[#6d746f]">{unitHelp(ingredient)}</small>
          </Field>
          <Field label="Storage location">
            <select
              name="storageLocation"
              defaultValue={ingredient?.storageLocation ?? "PANTRY"}
            >
              {locations.slice(1).map((entry) => (
                <option key={entry} value={entry}>
                  {label(entry)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expiry date">
            <input
              name="expiryDate"
              type="date"
              defaultValue=""
            />
          </Field>
          <Field label="Low-stock threshold">
            <input
              name="lowStockThreshold"
              type="number"
              min="0"
              step="0.1"
              defaultValue=""
            />
          </Field>
          <label className="sm:col-span-2">
            <span className="text-xs">Notes</span>
            <textarea
              name="notes"
              defaultValue=""
              placeholder="Packaging, freshness, where you bought it…"
              className="mt-1 min-h-24 w-full resize-none rounded-xl border border-[#ded5c5] bg-white p-3 outline-none focus:border-[#07513f]"
            />
          </label>
        </div>
        <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-[#e4dccf] pt-5 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#ded5c5] px-6 py-3 text-sm transition hover:bg-[#f5f2ea]"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-[#07513f] px-7 py-3 text-sm text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add to pantry"}
          </button>
        </div>
      </form>
    </div>
  );
}
function Field({
  label: fieldLabel,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="pantry-field">
      <span className="text-xs">{fieldLabel}</span>
      <div className="mt-1 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-[#ded5c5] [&>input]:bg-white [&>input]:px-3 [&>input]:py-3 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-[#ded5c5] [&>select]:bg-white [&>select]:px-3 [&>select]:py-3">
        {children}
      </div>
    </label>
  );
}
