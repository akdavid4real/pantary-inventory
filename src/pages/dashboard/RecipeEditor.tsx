import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DashboardPageHeader, DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import { getCachedIngredientCatalog, invalidateRecipeCatalog, loadIngredientCatalog } from "../../services/catalog";
import { Ingredient, Recipe } from "../../types/inventory";
import { routes, ScreenProps } from "../../types/navigation";
import { ingredientUnitOptions, unitHelp, unitLabels } from "../../utils/units";

type IngredientRow = { key: number; ingredientId: string; quantity: number; unit: string; isOptional: boolean };
type StepRow = { key: number; instruction: string; durationMinutes: number };

const categories = ["BREAKFAST", "LUNCH", "DINNER", "SOUP", "SWALLOW", "RICE_MEAL", "BEANS_MEAL", "SNACK", "PROTEIN", "DRINK", "OTHER"];
const control = "mt-1 w-full rounded-xl border border-[#dcd4c7] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#07513f] focus:ring-2 focus:ring-[#07513f]/10";

export function RecipeEditor({ onNavigate, recipeId }: ScreenProps & { recipeId?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>(getCachedIngredientCatalog);
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([{ key: 1, instruction: "", durationMinutes: 5 }]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Recipe | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saveStatus, setSaveStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");

  useEffect(() => {
    let active = true;
    Promise.all([
      loadIngredientCatalog(),
      recipeId ? api<Recipe>(`/recipes/${recipeId}`) : Promise.resolve(null),
    ]).then(([result, recipe]) => {
        if (!active) return;
        setIngredients(result);
        setExisting(recipe);
        if (recipe) {
          setRows(recipe.ingredients.map((item, index) => ({ key: index + 1, ingredientId: item.ingredientId, quantity: item.quantity, unit: item.unit, isOptional: item.isOptional })));
          setSteps(recipe.steps.map((step, index) => ({ key: index + 1, instruction: step.instruction, durationMinutes: step.durationMinutes ?? 0 })));
          setSaveStatus((recipe as Recipe & { status?: "DRAFT" | "PUBLISHED" }).status ?? "DRAFT");
        } else {
          const first = result[0];
          if (first) setRows([{ key: 1, ingredientId: first.id, quantity: 1, unit: first.defaultUnit, isOptional: false }]);
        }
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Could not load ingredients."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [recipeId]);

  const ingredientMap = useMemo(() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])), [ingredients]);
  const updateIngredient = (key: number, change: Partial<IngredientRow>) => setRows((current) => current.map((row) => row.key === key ? { ...row, ...change } : row));
  const addIngredient = () => {
    const first = ingredients[0];
    if (!first) return;
    setRows((current) => [...current, { key: Date.now(), ingredientId: first.id, quantity: 1, unit: first.defaultUnit, isOptional: false }]);
  };
  const updateStep = (key: number, change: Partial<StepRow>) => setSteps((current) => current.map((step) => step.key === key ? { ...step, ...change } : step));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!rows.length || steps.some((step) => !step.instruction.trim())) {
      setError("Add at least one ingredient and complete every cooking step.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let imageUrl = existing?.imageUrl ?? undefined;
      if (imageFile) {
        const base64 = await readFile(imageFile);
        imageUrl = (await api<{ imageUrl: string }>("/recipes/images", { method: "POST", body: JSON.stringify({ fileName: imageFile.name, contentType: imageFile.type, base64 }) })).imageUrl;
      }
      const saved = await api<Recipe>(recipeId ? `/recipes/${recipeId}` : "/recipes", {
        method: recipeId ? "PATCH" : "POST",
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description") || undefined,
          imageUrl,
          category: form.get("category"),
          region: form.get("region") || "Nigeria",
          servings: Number(form.get("servings")),
          prepTimeMinutes: Number(form.get("prepTimeMinutes")),
          cookTimeMinutes: Number(form.get("cookTimeMinutes")),
          difficulty: form.get("difficulty"),
          ingredients: rows.map(({ ingredientId, quantity, unit, isOptional }) => ({ ingredientId, quantity, unit, isOptional })),
          steps: steps.map((step, index) => ({ stepNumber: index + 1, instruction: step.instruction.trim(), durationMinutes: step.durationMinutes })),
          tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
          status: saveStatus,
        }),
      });
      invalidateRecipeCatalog();
      onNavigate(saveStatus === "DRAFT" ? "My Recipes" : routes.recipe(saved.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save recipe.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardPageShell activePage="Explore" menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} onNavigate={onNavigate} mainClassName="px-4 py-5 sm:px-7">
      <DashboardPageHeader title={recipeId ? "Edit recipe" : "Create a community recipe"} subtitle="Share a recipe others can discover, plan, shop for, and cook." onOpenMenu={() => setMenuOpen(true)} />
      <form key={existing?.id ?? "new"} onSubmit={submit} className="mx-auto max-w-5xl space-y-5">
        {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
        <section className="grid gap-4 rounded-2xl border bg-[#fffdf8] p-5 sm:grid-cols-2">
          <label className="sm:col-span-2 text-xs">Recipe name<input className={control} name="name" required defaultValue={existing?.name} placeholder="e.g. Mum's Sunday coconut rice" /></label>
          <label className="sm:col-span-2 text-xs">Description<textarea className={`${control} min-h-24`} name="description" required defaultValue={existing?.description ?? ""} placeholder="Tell people what makes this recipe special." /></label>
          <label className="text-xs">Category<select className={control} name="category" defaultValue={existing?.category ?? "BREAKFAST"}>{categories.map((category) => <option key={category} value={category}>{category.toLowerCase().replace(/_/g, " ")}</option>)}</select></label>
          <label className="text-xs">Region<input className={control} name="region" defaultValue={existing?.region ?? "Nigeria"} /></label>
          <label className="sm:col-span-2 text-xs">Recipe photo <span className="text-[#777]">(JPEG, PNG, or WebP · max 5 MB)</span><input className={control} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />{existing?.imageUrl && !imageFile ? <img src={existing.imageUrl} alt="Current recipe" className="mt-2 h-28 w-40 rounded-xl object-cover"/> : null}</label>
          <label className="text-xs">Servings<input className={control} name="servings" type="number" min="1" max="20" defaultValue={existing?.servings ?? 4} required /></label>
          <label className="text-xs">Difficulty<select className={control} name="difficulty" defaultValue={existing?.difficulty ?? "Easy"}><option>Easy</option><option>Comfortable</option><option>Adventurous</option></select></label>
          <label className="text-xs">Prep time (minutes)<input className={control} name="prepTimeMinutes" type="number" min="0" defaultValue={existing?.prepTimeMinutes ?? 15} required /></label>
          <label className="text-xs">Cook time (minutes)<input className={control} name="cookTimeMinutes" type="number" min="0" defaultValue={existing?.cookTimeMinutes ?? 30} required /></label>
          <label className="sm:col-span-2 text-xs">Tags, separated by commas<input className={control} name="tags" placeholder="family meal, budget friendly, Yoruba" /></label>
        </section>

        <section className="rounded-2xl border bg-[#fffdf8] p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-serif text-2xl">Ingredients</h2><p className="text-xs text-[#6d746f]">Choose how each ingredient is measured. Local units are converted ingredient by ingredient.</p></div><button type="button" onClick={addIngredient} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"><Plus size={14} /> Add ingredient</button></div>
          <div className="mt-4 space-y-3">
            {rows.map((row) => {
              const ingredient = ingredientMap.get(row.ingredientId);
              return <div key={row.key} className="grid gap-2 rounded-xl border bg-white p-3 md:grid-cols-[minmax(180px,1fr)_100px_170px_100px_40px] md:items-start">
                <select aria-label="Ingredient" value={row.ingredientId} onChange={(event) => { const selected = ingredientMap.get(event.target.value); updateIngredient(row.key, { ingredientId: event.target.value, unit: selected?.defaultUnit ?? "g" }); }} className={control}>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input aria-label="Quantity" type="number" min="0.01" step="0.01" value={row.quantity} onChange={(event) => updateIngredient(row.key, { quantity: Number(event.target.value) })} className={control} />
                <div><select aria-label="Unit" value={row.unit} onChange={(event) => updateIngredient(row.key, { unit: event.target.value })} className={control}>{ingredientUnitOptions(ingredient).map((unit) => <option key={unit} value={unit}>{unitLabels[unit] ?? unit}</option>)}</select><small className="mt-1 block text-[10px] text-[#6d746f]">{unitHelp(ingredient)}</small></div>
                <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={row.isOptional} onChange={(event) => updateIngredient(row.key, { isOptional: event.target.checked })} /> Optional</label>
                <button aria-label="Remove ingredient" type="button" disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))} className="mt-2 grid h-10 place-items-center rounded-lg border text-red-600 disabled:opacity-30"><Trash2 size={15} /></button>
              </div>;
            })}
          </div>
        </section>

        <section className="rounded-2xl border bg-[#fffdf8] p-5">
          <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Cooking steps</h2><button type="button" onClick={() => setSteps((current) => [...current, { key: Date.now(), instruction: "", durationMinutes: 5 }])} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"><Plus size={14} /> Add step</button></div>
          <div className="mt-4 space-y-3">{steps.map((step, index) => <div key={step.key} className="grid gap-2 rounded-xl border bg-white p-3 sm:grid-cols-[36px_1fr_110px_40px] sm:items-start"><strong className="mt-3 text-center">{index + 1}</strong><textarea aria-label={`Step ${index + 1}`} className={`${control} min-h-20`} value={step.instruction} onChange={(event) => updateStep(step.key, { instruction: event.target.value })} placeholder="Describe this cooking step clearly." /><label className="text-[10px]">Minutes<input className={control} type="number" min="0" value={step.durationMinutes} onChange={(event) => updateStep(step.key, { durationMinutes: Number(event.target.value) })} /></label><button aria-label="Remove step" type="button" disabled={steps.length === 1} onClick={() => setSteps((current) => current.filter((item) => item.key !== step.key))} className="mt-2 grid h-10 place-items-center rounded-lg border text-red-600 disabled:opacity-30"><Trash2 size={15} /></button></div>)}</div>
        </section>

        <div className="flex justify-end gap-3"><button type="button" onClick={() => onNavigate("My Recipes")} className="rounded-xl border px-5 py-3 text-sm">Cancel</button><button type="submit" onClick={() => setSaveStatus("DRAFT")} disabled={busy || loading} className="rounded-xl border px-5 py-3 text-sm disabled:opacity-50">Save draft</button><button type="submit" onClick={() => setSaveStatus("PUBLISHED")} disabled={busy || loading} className="rounded-xl bg-[#07513f] px-6 py-3 text-sm text-white disabled:opacity-50">{busy ? "Saving…" : "Publish recipe"}</button></div>
      </form>
    </DashboardPageShell>
  );
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}
