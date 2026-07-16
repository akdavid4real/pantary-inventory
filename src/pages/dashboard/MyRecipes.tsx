import { useCallback, useEffect, useState } from "react";
import { Edit3, Eye, FileText, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { FoodImage } from "../../components/FoodImage";
import { DashboardPageHeader, DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import { invalidateRecipeCatalog } from "../../services/catalog";
import { Recipe } from "../../types/inventory";
import { routes, ScreenProps } from "../../types/navigation";

type ManagedRecipe = Recipe & { status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; moderationStatus: "PENDING" | "APPROVED" | "REJECTED"; moderationNote?: string | null; _count?: { reports: number }; reports?: Array<{ id: string; reason: string; details?: string | null }> };
type Me = { role: "USER" | "ADMIN" };

export function MyRecipes({ onNavigate }: ScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [recipes, setRecipes] = useState<ManagedRecipe[]>([]);
  const [queue, setQueue] = useState<ManagedRecipe[]>([]);
  const [role, setRole] = useState<Me["role"]>("USER");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const [mine, me] = await Promise.all([api<ManagedRecipe[]>("/recipes/mine"), api<Me>("/users/me")]);
      setRecipes(mine); setRole(me.role);
      if (me.role === "ADMIN") setQueue(await api<ManagedRecipe[]>("/recipes/moderation/queue"));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load your recipes."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const changeStatus = async (recipe: ManagedRecipe, status: ManagedRecipe["status"]) => {
    setBusy(recipe.id);
    try { await api(`/recipes/${recipe.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); invalidateRecipeCatalog(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update recipe status."); }
    finally { setBusy(""); }
  };
  const remove = async (recipe: ManagedRecipe) => {
    if (!window.confirm(`Delete ${recipe.name}? This cannot be undone.`)) return;
    setBusy(recipe.id);
    try { await api(`/recipes/${recipe.id}`, { method: "DELETE" }); invalidateRecipeCatalog(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete recipe."); }
    finally { setBusy(""); }
  };
  const moderate = async (recipe: ManagedRecipe, moderationStatus: "APPROVED" | "REJECTED") => {
    setBusy(recipe.id);
    try { await api(`/recipes/${recipe.id}/moderation`, { method: "PATCH", body: JSON.stringify({ moderationStatus, moderationNote: moderationStatus === "REJECTED" ? "Removed after moderation review." : "Approved for the community catalog." }) }); invalidateRecipeCatalog(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not moderate recipe."); }
    finally { setBusy(""); }
  };

  return <DashboardPageShell activePage="My Recipes" menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} onNavigate={onNavigate}>
    <DashboardPageHeader title="My Recipes" subtitle="Create, revise, publish, and monitor your community recipes." onOpenMenu={() => setMenuOpen(true)} action={<button onClick={() => onNavigate(routes.newRecipe)} className="flex items-center gap-2 rounded-xl bg-[#07513f] px-4 py-3 text-sm text-white"><Plus size={16}/> New recipe</button>} />
    {error ? <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recipes.map((recipe) => <article key={recipe.id} className="overflow-hidden rounded-2xl border bg-[#fffdf8] shadow-sm">
      {recipe.imageUrl ? <FoodImage src={recipe.imageUrl} alt="" variant="card" className="h-40 w-full object-cover"/> : <div className="grid h-40 place-items-center bg-[#edf4ef]"><FileText/></div>}
      <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-serif text-xl">{recipe.name}</h2><p className="mt-1 text-xs text-[#6d746f]">{recipe.caloriesPerServing > 0 ? `${Math.round(recipe.caloriesPerServing)} kcal/serving` : "Nutrition pending"}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${recipe.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{recipe.status.toLowerCase()}</span></div>
      {recipe.catalogId ? <p className="mt-3 text-xs font-medium text-[#356052]">Seeded by {recipe.createdBy?.profile?.displayName ?? "Platform Admin"}{recipe.catalogBatch ? ` · ${recipe.catalogBatch.replace("batch_", "Batch ")}` : ""}</p> : null}
      <p className="mt-3 text-xs">Moderation: {recipe.moderationStatus.toLowerCase()} · {recipe._count?.reports ?? 0} report(s)</p>{recipe.moderationNote ? <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs">{recipe.moderationNote}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => onNavigate(routes.editRecipe(recipe.id))} className="flex items-center justify-center gap-2 rounded-lg border p-2 text-xs"><Edit3 size={14}/> Edit</button><button onClick={() => onNavigate(routes.recipe(recipe.id))} className="flex items-center justify-center gap-2 rounded-lg border p-2 text-xs"><Eye size={14}/> View</button><button disabled={busy === recipe.id} onClick={() => void changeStatus(recipe, recipe.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")} className="rounded-lg bg-[#07513f] p-2 text-xs text-white">{recipe.status === "PUBLISHED" ? "Move to draft" : "Publish"}</button><button disabled={busy === recipe.id} onClick={() => void remove(recipe)} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 p-2 text-xs text-red-700"><Trash2 size={14}/> Delete</button></div></div>
    </article>)}{!recipes.length ? <div className="col-span-full rounded-2xl border border-dashed p-10 text-center"><FileText className="mx-auto"/><h2 className="mt-3 font-serif text-2xl">No recipes yet</h2><button onClick={() => onNavigate(routes.newRecipe)} className="mt-4 rounded-lg bg-[#07513f] px-5 py-3 text-sm text-white">Create your first recipe</button></div> : null}</section>
    {role === "ADMIN" ? <section className="mt-8 rounded-2xl border bg-[#fffdf8] p-5"><h2 className="flex items-center gap-2 font-serif text-2xl"><ShieldCheck/> Moderation queue</h2><div className="mt-4 divide-y">{queue.map((recipe) => <div key={recipe.id} className="flex flex-wrap items-center gap-3 py-4"><div className="min-w-0 flex-1"><strong>{recipe.name}</strong><p className="text-xs">{recipe.moderationStatus.toLowerCase()} · {recipe.reports?.length ?? 0} open report(s)</p></div><button onClick={() => void moderate(recipe, "APPROVED")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white">Approve</button><button onClick={() => void moderate(recipe, "REJECTED")} className="rounded-lg bg-red-700 px-3 py-2 text-xs text-white">Reject</button></div>)}{!queue.length ? <p className="py-5 text-sm text-[#6d746f]">Nothing needs review.</p> : null}</div></section> : null}
  </DashboardPageShell>;
}
