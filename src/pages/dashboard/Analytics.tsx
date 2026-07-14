import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Flame, Leaf, RefreshCw, ShoppingBasket, Target, Wheat } from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import { ScreenProps, routes } from "../../types/navigation";

type MacroKey = "calories" | "protein" | "carbs" | "fat";
type NutritionDay = { date: string; day: string; calories: number; protein: number; carbs: number; fat: number; meals: number };
type WeekSummary = { weekStart: string; weekEnd: string; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; days: NutritionDay[] };
type DaySummary = { total: Record<MacroKey, number>; logs: Array<{ id: string; servings: number; recipe?: { name?: string | null } | null }> };
type DashboardSummary = {
  counts: { pantryItems: number; expiringItems: number; lowStockItems: number; pendingShoppingItems: number };
  shoppingSummary: { listId?: string | null; totalItems: number; pendingItems: number; boughtItems?: number; skippedItems?: number };
  recommendedRecipes: Array<{ recipeId: string; recipeName: string; imageUrl?: string | null; ingredientPresencePercentage: number; matchPercentage: number; canCookNow: boolean }>;
};
type HistoryMetric = MacroKey | "spendingNaira" | "wasteNaira";
type HistoryDay = { date: string; calories: number; protein: number; carbs: number; fat: number; spendingNaira: number; wasteNaira: number; wasteEvents: number };
type HistorySummary = { startDate: string; endDate: string; totals: Omit<HistoryDay, "date">; days: HistoryDay[] };

const macroLabels: Record<MacroKey, string> = { calories: "Calories", protein: "Protein", carbs: "Carbs", fat: "Fat" };
const dayMs = 86_400_000;
const historyLabels: Record<HistoryMetric, string> = { ...macroLabels, spendingNaira: "Spending", wasteNaira: "Waste value" };
const panel = "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-sm";

function isoDay(date: Date) { return date.toISOString().slice(0, 10); }
function formatNumber(value: number) { return Math.round(value).toLocaleString(); }
function weekLabel(summary: WeekSummary | null, selected: Date) {
  const start = summary ? new Date(`${summary.weekStart}T12:00:00`) : selected;
  const end = summary ? new Date(`${summary.weekEnd}T12:00:00`) : new Date(selected.getTime() + 6 * dayMs);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}–${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export function Analytics({ onNavigate }: ScreenProps) {
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [metric, setMetric] = useState<MacroKey>("calories");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [nutrition, setNutrition] = useState<WeekSummary | null>(null);
  const [today, setToday] = useState<DaySummary | null>(null);
  const [history, setHistory] = useState<HistorySummary | null>(null);
  const [historyMetric, setHistoryMetric] = useState<HistoryMetric>("spendingNaira");
  const [startDate, setStartDate] = useState(() => isoDay(new Date(Date.now() - 29 * dayMs)));
  const [endDate, setEndDate] = useState(() => isoDay(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, week, day, historical] = await Promise.all([
        api<DashboardSummary>("/dashboard/summary"),
        api<WeekSummary>(`/nutrition/week?date=${isoDay(weekDate)}`),
        api<DaySummary>(`/nutrition/day/${isoDay(new Date())}`),
        api<HistorySummary>(`/dashboard/analytics?startDate=${startDate}&endDate=${endDate}`),
      ]);
      setSummary(dashboard);
      setNutrition(week);
      setToday(day);
      setHistory(historical);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, weekDate]);
  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => ({
    calories: nutrition?.totalCalories ?? 0,
    protein: nutrition?.totalProtein ?? 0,
    carbs: nutrition?.totalCarbs ?? 0,
    fat: nutrition?.totalFat ?? 0,
  }), [nutrition]);
  const maxValue = Math.max(1, ...(nutrition?.days.map((day) => day[metric]) ?? [1]));
  const mealCount = nutrition?.days.reduce((sum, day) => sum + day.meals, 0) ?? 0;
  const recommendations = summary?.recommendedRecipes ?? [];
  const averageMatch = recommendations.length ? Math.round(recommendations.reduce((sum, recipe) => sum + recipe.ingredientPresencePercentage, 0) / recommendations.length) : 0;
  const shoppingTotal = summary?.shoppingSummary.totalItems ?? 0;
  const shoppingBought = summary?.shoppingSummary.boughtItems ?? Math.max(0, shoppingTotal - (summary?.shoppingSummary.pendingItems ?? 0) - (summary?.shoppingSummary.skippedItems ?? 0));
  const shoppingPercent = shoppingTotal ? Math.round((shoppingBought / shoppingTotal) * 100) : 0;
  const macroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
  const macroPercent = (value: number, factor: number) => macroCalories ? Math.round((value * factor / macroCalories) * 100) : 0;
  const historyMax = Math.max(1, ...(history?.days.map((day) => day[historyMetric]) ?? [1]));

  return (
    <DashboardPageShell activePage="Analytics" onNavigate={onNavigate} showToolbar rootClassName="app-shell--analytics">
      <div className="insights-page">
        <header className="insights-heading">
          <div><h1>Your live insights</h1><p>Everything here comes from your pantry, planned meals, shopping list, and completed cooking.</p></div>
          <div className="week-picker">
            <button aria-label="Previous week" onClick={() => setWeekDate((date) => new Date(date.getTime() - 7 * dayMs))}><ChevronLeft /></button>
            <button onClick={() => setWeekDate(new Date())}><CalendarDays /> {weekLabel(nutrition, weekDate)}</button>
            <button aria-label="Next week" onClick={() => setWeekDate((date) => new Date(date.getTime() + 7 * dayMs))}><ChevronRight /></button>
            <button aria-label="Refresh analytics" onClick={() => void load()}><RefreshCw className={loading ? "animate-spin" : ""} /></button>
          </div>
        </header>

        {error ? <div className="mb-5 rounded-xl bg-red-50 p-5 text-red-700" role="alert"><p>{error}</p><button onClick={() => void load()} className="mt-3 rounded-lg bg-[#07513f] px-4 py-2 text-sm text-white">Try again</button></div> : null}
        {loading && !summary ? <div className={`${panel} grid min-h-64 place-items-center`}>Loading your live analytics…</div> : null}

        {summary ? <>
          <section className="insight-kpis">
            <Kpi icon={<CalendarDays />} value={formatNumber(mealCount)} label="Meals planned" tone="green" />
            <Kpi icon={<Flame />} value={formatNumber(totals.calories)} label="Weekly calories" tone="orange" />
            <Kpi icon={<ShoppingBasket />} value={formatNumber(summary.counts.pantryItems)} label="Pantry items" tone="green" />
            <Kpi icon={<Target />} value={`${averageMatch}%`} label="Avg. ingredients owned" tone="green" />
            <Kpi icon={<ShoppingBasket />} value={`₦${formatNumber(history?.totals.spendingNaira ?? 0)}`} label="Range spending" tone="orange" />
            <Kpi icon={<Leaf />} value={String(history?.totals.wasteEvents ?? 0)} label="Waste events" tone="green" />
          </section>

          <section className={`${panel} mt-5 p-5`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h2 className="font-serif text-2xl">Historical trends</h2><p className="text-xs text-[#6d746f]">Completed cooking, grocery purchases, and recorded pantry waste.</p></div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-[10px] uppercase tracking-wide">From<input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block rounded-lg border bg-white p-2 text-xs normal-case" /></label>
                <label className="text-[10px] uppercase tracking-wide">To<input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block rounded-lg border bg-white p-2 text-xs normal-case" /></label>
                <select value={historyMetric} onChange={(event) => setHistoryMetric(event.target.value as HistoryMetric)} className="rounded-lg border bg-white p-2 text-xs">{(Object.keys(historyLabels) as HistoryMetric[]).map((key) => <option key={key} value={key}>{historyLabels[key]}</option>)}</select>
              </div>
            </div>
            <div className="mt-6 flex h-56 items-end gap-1 overflow-x-auto border-b px-1" aria-label={`${historyLabels[historyMetric]} history chart`}>
              {history?.days.map((day) => <div key={day.date} className="group relative flex h-full min-w-3 flex-1 items-end"><div title={`${day.date}: ${historyMetric.endsWith("Naira") ? "₦" : ""}${formatNumber(day[historyMetric])}`} className="w-full rounded-t bg-[#ef701a] transition-all group-hover:bg-[#07513f]" style={{ height: `${Math.max(day[historyMetric] ? 3 : 0, day[historyMetric] / historyMax * 205)}px` }} /></div>)}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><MiniStat icon={<ShoppingBasket />} value={`₦${formatNumber(history?.totals.spendingNaira ?? 0)}`} label="Spent" /><MiniStat icon={<Leaf />} value={`₦${formatNumber(history?.totals.wasteNaira ?? 0)}`} label="Estimated waste" /><MiniStat icon={<Flame />} value={`${formatNumber(history?.totals.calories ?? 0)} kcal`} label="Consumed" /></div>
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.7fr)]">
            <section className={`${panel} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-2xl">Weekly nutrition</h2><p className="text-xs text-[#6d746f]">Nutrition from recipes currently placed in this week’s meal plan.</p></div><div className="flex rounded-lg border bg-white p-1">{(Object.keys(macroLabels) as MacroKey[]).map((key) => <button key={key} onClick={() => setMetric(key)} className={`rounded-md px-3 py-1.5 text-xs ${metric === key ? "bg-[#07513f] text-white" : ""}`}>{macroLabels[key]}</button>)}</div></div>
              <div className="mt-8 grid h-60 grid-cols-7 items-end gap-2 border-b border-[#ddd5c8] px-2">{nutrition?.days.map((day) => <div key={day.date} className="flex h-full flex-col justify-end text-center"><strong className="mb-1 text-[10px]">{formatNumber(day[metric])}</strong><div className="mx-auto w-full max-w-12 rounded-t-md bg-[#ef701a] transition-all" style={{ height: `${Math.max(day[metric] ? 8 : 0, (day[metric] / maxValue) * 175)}px` }} /><span className="mt-2 text-[10px]">{day.day.slice(0, 3)}</span></div>)}</div>
              <div className="mt-6 grid gap-3 sm:grid-cols-4"><MiniStat icon={<Flame />} value={`${formatNumber(totals.calories)} kcal`} label="Calories" /><MiniStat icon={<Leaf />} value={`${formatNumber(totals.protein)} g`} label="Protein" /><MiniStat icon={<Wheat />} value={`${formatNumber(totals.carbs)} g`} label="Carbs" /><MiniStat icon={<Flame />} value={`${formatNumber(totals.fat)} g`} label="Fat" /></div>
            </section>

            <div className="grid gap-5">
              <section className={`${panel} p-5`}><h2 className="font-serif text-xl">Macro balance</h2><div className="mt-4 space-y-3"><Progress label="Carbs" value={macroPercent(totals.carbs, 4)} color="#ef701a" /><Progress label="Protein" value={macroPercent(totals.protein, 4)} color="#5f9837" /><Progress label="Fat" value={macroPercent(totals.fat, 9)} color="#e5ab32" /></div>{macroCalories === 0 ? <p className="mt-4 text-xs text-[#6d746f]">Add meals with nutrition values to see your balance.</p> : null}</section>
              <section className={`${panel} p-5`}><h2 className="font-serif text-xl">Today’s completed cooking</h2>{today?.logs.length ? <><div className="mt-4 grid grid-cols-2 gap-2"><MiniStat icon={<Flame />} value={`${formatNumber(today.total.calories)} kcal`} label="Logged" /><MiniStat icon={<Leaf />} value={`${formatNumber(today.total.protein)} g`} label="Protein" /></div><ul className="mt-4 space-y-2 text-xs">{today.logs.map((log) => <li key={log.id}>{log.recipe?.name ?? "Meal"} · {log.servings} serving{log.servings === 1 ? "" : "s"}</li>)}</ul></> : <p className="mt-3 text-sm text-[#6d746f]">No cooking completion has been logged today.</p>}</section>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <section className={`${panel} p-5`}><h2 className="font-serif text-xl">Pantry health</h2><div className="mt-4 grid grid-cols-3 gap-2"><MiniStat icon={<ShoppingBasket />} value={String(summary.counts.pantryItems)} label="In stock" /><MiniStat icon={<CalendarDays />} value={String(summary.counts.expiringItems)} label="Expiring" /><MiniStat icon={<Target />} value={String(summary.counts.lowStockItems)} label="Low stock" /></div><button onClick={() => onNavigate("Pantry")} className="mt-5 w-full rounded-lg border py-2 text-xs">Open pantry</button></section>
            <section className={`${panel} p-5`}><h2 className="font-serif text-xl">Shopping progress</h2><Progress label={`${shoppingBought} of ${shoppingTotal} bought`} value={shoppingPercent} color="#ef701a" /><p className="mt-3 text-xs text-[#6d746f]">{summary.shoppingSummary.pendingItems} pending · {summary.shoppingSummary.skippedItems ?? 0} skipped</p><button onClick={() => onNavigate(summary.shoppingSummary.listId ? routes.shoppingList(summary.shoppingSummary.listId) : "Grocery")} className="mt-5 w-full rounded-lg border py-2 text-xs">Open grocery list</button></section>
            <section className={`${panel} p-5 md:col-span-2 xl:col-span-1`}><h2 className="font-serif text-xl">Best pantry matches</h2><div className="mt-3 space-y-3">{recommendations.slice(0, 3).map((recipe) => <button key={recipe.recipeId} onClick={() => onNavigate(routes.recipe(recipe.recipeId))} className="flex w-full items-center gap-3 rounded-xl border bg-white p-2 text-left">{recipe.imageUrl ? <img src={recipe.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#edf4ef]"><BarChart3 size={16} /></span>}<span className="min-w-0 flex-1"><strong className="block truncate font-serif text-sm font-normal">{recipe.recipeName}</strong><small>{recipe.ingredientPresencePercentage}% ingredients owned · {recipe.canCookNow ? "ready" : "check quantities"}</small></span></button>)}{!recommendations.length ? <p className="text-sm text-[#6d746f]">Add pantry items to receive matches.</p> : null}</div></section>
          </div>
        </> : null}
      </div>
    </DashboardPageShell>
  );
}

function Kpi({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: string }) { return <article className={`insight-kpi ${tone}`}><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>; }
function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="mini-stat"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>; }
function Progress({ label, value, color }: { label: string; value: number; color: string }) { return <div className="mt-4"><div className="mb-1 flex justify-between text-xs"><span>{label}</span><strong>{value}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#ebe6dc]"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} /></div></div>; }
