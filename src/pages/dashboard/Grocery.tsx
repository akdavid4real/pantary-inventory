import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, RefreshCw, ShoppingBag, X } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import {
  Ingredient,
  Paginated,
  PurchaseReview,
  ShoppingItem,
  ShoppingItemStatus,
  ShoppingList,
  StorageLocation,
} from "../../types/inventory";
import { routes } from "../../types/navigation";

const statuses: ShoppingItemStatus[] = ["PENDING", "BOUGHT", "SKIPPED"];
const locations: StorageLocation[] = ["PANTRY", "FRIDGE", "FREEZER", "COUNTER"];
const panel = "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-sm";

export function Grocery({
  onNavigate,
  listId,
}: {
  onNavigate: (page: string) => void;
  listId?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [list, setList] = useState<ShoppingList | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filter, setFilter] = useState<ShoppingItemStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [review, setReview] = useState<PurchaseReview | null>(null);
  const [reviewValues, setReviewValues] = useState<
    Record<
      string,
      {
        storageLocation: StorageLocation;
        expiryDate: string;
        lowStockThreshold: string;
        purchasedQuantity: string;
        purchasedUnit: string;
        totalCostNaira: string;
      }
    >
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [shoppingList, ingredientPage] = await Promise.all([
        api<ShoppingList | null>(
          listId ? `/shopping-list/${listId}` : "/shopping-list/current",
        ),
        api<Paginated<Ingredient>>("/ingredients?limit=100"),
      ]);
      setList(shoppingList);
      setIngredients(ingredientPage.items);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load grocery list.",
      );
    } finally {
      setLoading(false);
    }
  }, [listId]);
  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setBusy("refresh");
    setError("");
    try {
      const value = await api<ShoppingList>(
        "/shopping-list/generate/from-meal-plan",
        { method: "POST", body: "{}" },
      );
      setList(value);
      setNotice("List refreshed from this week's meals.");
      if (!listId) onNavigate(routes.shoppingList(value.id));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not refresh list.",
      );
    } finally {
      setBusy("");
    }
  };
  const update = async (item: ShoppingItem, change: Partial<ShoppingItem>) => {
    setBusy(item.id);
    try {
      const value = await api<ShoppingItem>(`/shopping-list/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(change),
      });
      setList((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry.id === item.id ? value : entry,
              ),
            }
          : current,
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not update item.",
      );
    } finally {
      setBusy("");
    }
  };
  const addManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ingredientId = String(form.get("ingredientId") ?? "");
    const ingredient = ingredients.find((item) => item.id === ingredientId);
    setBusy("add");
    try {
      await api("/shopping-list/items", {
        method: "POST",
        body: JSON.stringify({
          ingredientId: ingredientId || undefined,
          name: ingredient?.name ?? form.get("name"),
          quantity: Number(form.get("quantity")),
          unit: form.get("unit"),
          notes: form.get("notes") || undefined,
        }),
      });
      setAddOpen(false);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not add item.",
      );
    } finally {
      setBusy("");
    }
  };
  const openReview = async () => {
    if (!list) return;
    setBusy("review");
    try {
      const value = await api<PurchaseReview>(
        `/shopping-list/${list.id}/purchase-review`,
      );
      const initial: typeof reviewValues = {};
      for (const item of value.items.filter(
        (entry) => entry.becomesPantryStock,
      ))
        initial[item.id] = {
          storageLocation: item.suggestedStorageLocation ?? "PANTRY",
          expiryDate: "",
          lowStockThreshold: "",
          purchasedQuantity: String(item.quantity),
          purchasedUnit: item.unit,
          totalCostNaira: "",
        };
      setReviewValues(initial);
      setReview(value);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not prepare purchase review.",
      );
    } finally {
      setBusy("");
    }
  };
  const complete = async () => {
    if (!list || !review) return;
    setBusy("complete");
    try {
      await api(`/shopping-list/${list.id}/complete`, {
        method: "POST",
        body: JSON.stringify({
          purchasedItems: Object.entries(reviewValues).map(
            ([itemId, value]) => ({
              itemId,
              storageLocation: value.storageLocation,
              expiryDate: value.expiryDate || undefined,
              lowStockThreshold:
                value.lowStockThreshold === ""
                  ? undefined
                  : Number(value.lowStockThreshold),
              purchasedQuantity: Number(value.purchasedQuantity),
              purchasedUnit: value.purchasedUnit,
              totalCostNaira: value.totalCostNaira === "" ? undefined : Number(value.totalCostNaira),
            }),
          ),
        }),
      });
      setReview(null);
      setNotice("Shopping completed and purchased food added to Pantry.");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not complete shopping.",
      );
    } finally {
      setBusy("");
    }
  };

  const visible = useMemo(
    () =>
      list?.items.filter(
        (item) => filter === "ALL" || item.status === filter,
      ) ?? [],
    [filter, list],
  );
  const bought =
    list?.items.filter((item) => item.status === "BOUGHT").length ?? 0;
  const progress = list?.items.length
    ? Math.round((bought / list.items.length) * 100)
    : 0;

  return (
    <DashboardPageShell
      activePage="Grocery"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
      mainClassName="px-4 py-5 sm:px-7 xl:px-8"
    >
      <DashboardPageHeader
        title="Grocery list"
        subtitle="Only missing meal-plan ingredients, with manual extras kept separate."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#ff5f4b] px-5 py-3 text-sm text-white"
          >
            <Plus size={17} /> Add item
          </button>
        }
      />
      {error ? (
        <div className="mb-4 flex justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      ) : null}
      <section className={`${panel} mb-4 p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-52 flex-1">
            <strong>{list?.title ?? "No active list"}</strong>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5ded1]">
              <div
                className="h-full bg-[#07513f]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <small>
              {bought} of {list?.items.length ?? 0} items bought · {progress}%
            </small>
          </div>
          <button
            onClick={() => void refresh()}
            disabled={busy === "refresh"}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs"
          >
            <RefreshCw
              size={15}
              className={busy === "refresh" ? "animate-spin" : ""}
            />{" "}
            Refresh from meals
          </button>
          {list ? (
            <button
              onClick={() => void openReview()}
              disabled={!bought || busy === "review"}
              className="flex items-center gap-2 rounded-lg bg-[#07513f] px-4 py-2 text-xs text-white disabled:opacity-40"
            >
              <ShoppingBag size={15} /> Complete shopping
            </button>
          ) : null}
        </div>
      </section>
      <div className="mb-3 flex flex-wrap gap-2">
        {(["ALL", ...statuses] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full border px-3 py-1.5 text-xs ${filter === status ? "bg-[#07513f] text-white" : ""}`}
          >
            {status.toLowerCase()}
          </button>
        ))}
      </div>
      <section className={`${panel} overflow-hidden`}>
        {loading ? (
          <p className="p-12 text-center">Loading grocery list…</p>
        ) : !list || !list.items.length ? (
          <div className="p-12 text-center">
            <ShoppingBag className="mx-auto mb-3" />
            <h2 className="font-serif text-2xl">Your active list is empty</h2>
            <p className="mt-2 text-sm text-[#6d746f]">
              Plan meals, then refresh to calculate only what Pantry cannot
              cover.
            </p>
            <button
              onClick={() => void refresh()}
              className="mt-4 rounded-lg bg-[#07513f] px-5 py-3 text-sm text-white"
            >
              Generate from meals
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {visible.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 p-4 sm:grid-cols-[minmax(150px,1fr)_110px_100px_130px] sm:items-center"
              >
                <div>
                  <strong className="font-serif font-normal">
                    {item.name}
                  </strong>
                  <p className="text-[11px] text-[#747771]">
                    {item.source === "MANUAL"
                      ? "Manual item"
                      : (item.sourceRecipe?.name ?? "Meal plan")}
                    {!item.ingredientId ? " · household/non-food" : ""}
                  </p>
                  <input
                    aria-label={`${item.name} notes`}
                    defaultValue={item.notes ?? ""}
                    onBlur={(event) =>
                      event.target.value !== (item.notes ?? "") &&
                      void update(item, { notes: event.target.value })
                    }
                    placeholder="Add notes"
                    className="mt-1 w-full bg-transparent text-xs outline-none"
                  />
                </div>
                <div className="flex overflow-hidden rounded-lg border">
                  <input
                    aria-label={`${item.name} quantity`}
                    defaultValue={item.quantity}
                    type="number"
                    min="0"
                    step="0.1"
                    onBlur={(event) =>
                      Number(event.target.value) !== item.quantity &&
                      void update(item, {
                        quantity: Number(event.target.value),
                      })
                    }
                    className="w-16 p-2 text-xs outline-none"
                  />
                  <input
                    aria-label={`${item.name} unit`}
                    defaultValue={item.unit}
                    onBlur={(event) =>
                      event.target.value !== item.unit &&
                      void update(item, { unit: event.target.value })
                    }
                    className="min-w-0 w-12 border-l p-2 text-xs outline-none"
                  />
                </div>
                <span className="text-center text-xs capitalize">
                  {item.status.toLowerCase()}
                </span>
                <select
                  disabled={busy === item.id}
                  value={item.status}
                  onChange={(event) =>
                    void update(item, {
                      status: event.target.value as ShoppingItemStatus,
                    })
                  }
                  className="rounded-lg border bg-white p-2 text-xs"
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </article>
            ))}
          </div>
        )}
      </section>
      {addOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#052d25]/60 p-4">
          <form
            onSubmit={addManual}
            className="w-full max-w-md rounded-2xl bg-[#fffdf8] p-6"
          >
            <div className="flex justify-between">
              <h2 className="font-serif text-2xl">Add grocery item</h2>
              <button type="button" onClick={() => setAddOpen(false)}>
                <X />
              </button>
            </div>
            <label className="mt-4 block text-xs">
              Catalog food (optional)
              <select
                name="ingredientId"
                className="mt-1 w-full rounded-lg border p-3"
              >
                <option value="">Free-text household item</option>
                {ingredients.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs">
              Name
              <input
                name="name"
                required
                className="mt-1 w-full rounded-lg border p-3"
                placeholder="Dish soap or food name"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs">
                Quantity
                <input
                  name="quantity"
                  type="number"
                  min="0.01"
                  step="0.1"
                  defaultValue="1"
                  required
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>
              <label className="text-xs">
                Unit
                <input
                  name="unit"
                  defaultValue="item"
                  required
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>
            </div>
            <label className="mt-3 block text-xs">
              Notes
              <input
                name="notes"
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            <p className="mt-3 text-xs text-[#6d746f]">
              Catalog foods can become Pantry stock. Free-text items stay on the
              completed shopping record.
            </p>
            <button
              disabled={busy === "add"}
              className="mt-5 w-full rounded-lg bg-[#07513f] p-3 text-sm text-white"
            >
              {busy === "add" ? "Adding…" : "Add item"}
            </button>
          </form>
        </div>
      ) : null}
      {review ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#052d25]/60 p-4">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fffdf8] p-6">
            <div className="flex justify-between">
              <div>
                <h2 className="font-serif text-2xl">Review purchased food</h2>
                <p className="text-xs">
                  Confirm the quantity and unit you actually bought, its cost, and where it belongs.
                </p>
              </div>
              <button onClick={() => setReview(null)}>
                <X />
              </button>
            </div>
            <div className="mt-5 divide-y">
              {review.items.map((item) =>
                item.becomesPantryStock ? (
                  <div
                    key={item.id}
                    className="grid gap-2 py-4 sm:grid-cols-2 lg:grid-cols-[1fr_90px_90px_110px_120px_130px]"
                  >
                    <strong className="text-sm">
                      {item.name}
                      <small className="block font-normal">
                        {item.quantity} {item.unit}
                      </small>
                    </strong>
                    <input
                      aria-label={`${item.name} purchased quantity`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={reviewValues[item.id]?.purchasedQuantity ?? ""}
                      onChange={(event) => setReviewValues((current) => ({ ...current, [item.id]: { ...current[item.id], purchasedQuantity: event.target.value } }))}
                      className="rounded-lg border p-2 text-xs"
                    />
                    <input
                      aria-label={`${item.name} purchased unit`}
                      value={reviewValues[item.id]?.purchasedUnit ?? ""}
                      onChange={(event) => setReviewValues((current) => ({ ...current, [item.id]: { ...current[item.id], purchasedUnit: event.target.value } }))}
                      className="rounded-lg border p-2 text-xs"
                    />
                    <input
                      aria-label={`${item.name} total cost`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cost ₦"
                      value={reviewValues[item.id]?.totalCostNaira ?? ""}
                      onChange={(event) => setReviewValues((current) => ({ ...current, [item.id]: { ...current[item.id], totalCostNaira: event.target.value } }))}
                      className="rounded-lg border p-2 text-xs"
                    />
                    <select
                      aria-label={`${item.name} storage`}
                      value={reviewValues[item.id]?.storageLocation}
                      onChange={(event) =>
                        setReviewValues((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            storageLocation: event.target
                              .value as StorageLocation,
                          },
                        }))
                      }
                      className="rounded-lg border p-2 text-xs"
                    >
                      {locations.map((location) => (
                        <option key={location}>{location}</option>
                      ))}
                    </select>
                    <input
                      aria-label={`${item.name} expiry`}
                      type="date"
                      value={reviewValues[item.id]?.expiryDate ?? ""}
                      onChange={(event) =>
                        setReviewValues((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            expiryDate: event.target.value,
                          },
                        }))
                      }
                      className="rounded-lg border p-2 text-xs"
                    />
                    <input
                      aria-label={`${item.name} low stock threshold`}
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Low stock"
                      value={reviewValues[item.id]?.lowStockThreshold ?? ""}
                      onChange={(event) =>
                        setReviewValues((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            lowStockThreshold: event.target.value,
                          },
                        }))
                      }
                      className="rounded-lg border p-2 text-xs"
                    />
                  </div>
                ) : (
                  <div key={item.id} className="py-4 text-sm">
                    <strong>{item.name}</strong>
                    <p className="text-xs text-[#6d746f]">
                      Recorded as bought; not added to Pantry because it is free
                      text.
                    </p>
                  </div>
                ),
              )}
            </div>
            <button
              onClick={() => void complete()}
              disabled={busy === "complete"}
              className="mt-5 w-full rounded-lg bg-[#07513f] p-3 text-sm text-white disabled:opacity-50"
            >
              <Check className="mr-2 inline" size={16} />
              {busy === "complete"
                ? "Completing…"
                : "Complete and add to Pantry"}
            </button>
          </section>
        </div>
      ) : null}
      {notice ? (
        <button
          onClick={() => setNotice("")}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#07513f] px-5 py-3 text-sm text-white"
        >
          {notice}
        </button>
      ) : null}
    </DashboardPageShell>
  );
}
