import { Check } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import {
  Field,
  PageHeading,
} from "../../components/dashboard/PageElements";
import { screenImages } from "../../features/dashboard/screenData";
import { ScreenProps } from "../../types/navigation";
import { api } from "../../services/api";
import { Ingredient, Paginated } from "../../types/inventory";

type MeasurementOverride = { id?: string; ingredientId: string; fromUnit: string; toUnit: string; multiplier: number };
type MeasurementProfile = { id: string; name: string; isDefault: boolean; cupMl: number; tablespoonMl: number; teaspoonMl: number; dericaMl: number; overrides: MeasurementOverride[] };

export function Settings({ onNavigate }: ScreenProps) {
  const [saved, setSaved] = useState(false);
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [overrides, setOverrides] = useState<Record<string, MeasurementOverride[]>>({});
  const [profileError, setProfileError] = useState("");
  const loadProfiles = async () => {
    try {
      const [profileValues, ingredientValues] = await Promise.all([
        api<MeasurementProfile[]>("/measurement-profiles"),
        api<Paginated<Ingredient>>("/ingredients?limit=100"),
      ]);
      setProfiles(profileValues);
      setIngredients(ingredientValues.items);
      setOverrides(Object.fromEntries(profileValues.map((profile) => [profile.id, profile.overrides ?? []])));
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : "Could not load measurement profiles.");
    }
  };
  useEffect(() => { void loadProfiles(); }, []);
  const createProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setProfileError("");
    try { await api("/measurement-profiles", { method: "POST", body: JSON.stringify({ name: form.get("name"), isDefault: profiles.length === 0, cupMl: Number(form.get("cupMl")), tablespoonMl: Number(form.get("tablespoonMl")), teaspoonMl: Number(form.get("teaspoonMl")), dericaMl: Number(form.get("dericaMl")) }) }); event.currentTarget.reset(); await loadProfiles(); }
    catch (reason) { setProfileError(reason instanceof Error ? reason.message : "Could not create profile."); }
  };
  const updateProfile = async (event: FormEvent<HTMLFormElement>, profile: MeasurementProfile) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setProfileError("");
    try { await api(`/measurement-profiles/${profile.id}`, { method: "PATCH", body: JSON.stringify({ name: form.get("name"), cupMl: Number(form.get("cupMl")), tablespoonMl: Number(form.get("tablespoonMl")), teaspoonMl: Number(form.get("teaspoonMl")), dericaMl: Number(form.get("dericaMl")), overrides: overrides[profile.id] ?? [] }) }); await loadProfiles(); setSaved(true); }
    catch (reason) { setProfileError(reason instanceof Error ? reason.message : "Could not update profile."); }
  };
  const makeDefault = async (profile: MeasurementProfile) => { await api(`/measurement-profiles/${profile.id}`, { method: "PATCH", body: JSON.stringify({ isDefault: true }) }); await loadProfiles(); };
  const deleteProfile = async (profile: MeasurementProfile) => { if (!window.confirm(`Delete ${profile.name}?`)) return; await api(`/measurement-profiles/${profile.id}`, { method: "DELETE" }); await loadProfiles(); };
  return (
    <DashboardPageShell
      activePage="Settings"
      onNavigate={onNavigate}
      showToolbar
    >
      <PageHeading
        title="Settings"
        subtitle="Make Pantry-to-Plate work the way you do."
        action={
          <button onClick={() => setSaved(true)}>
            {saved ? <Check /> : null}
            {saved ? "Changes saved" : "Save changes"}
          </button>
        }
      />
      <div className="settings-grid">
        <section className="panel md:col-span-2">
          <h2>Nigerian measurement profiles</h2>
          <p className="mb-4 text-sm text-[#666]">Calibrate the containers you use at home or in your market. Add ingredient overrides when the same container holds different weights of rice, beans, flour, or other foods.</p>
          {profileError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{profileError}</p> : null}
          <div className="grid gap-3 lg:grid-cols-2">{profiles.map((profile) => <form key={profile.id} onSubmit={(event) => void updateProfile(event, profile)} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between gap-2"><input name="name" defaultValue={profile.name} className="w-full rounded-lg border p-2 font-semibold"/><span className={`rounded-full px-2 py-1 text-[10px] ${profile.isDefault ? "bg-emerald-100 text-emerald-700" : "bg-gray-100"}`}>{profile.isDefault ? "Active" : "Saved"}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><MeasureInput name="dericaMl" label="Derica (ml)" value={profile.dericaMl}/><MeasureInput name="cupMl" label="Cup (ml)" value={profile.cupMl}/><MeasureInput name="tablespoonMl" label="Tablespoon (ml)" value={profile.tablespoonMl}/><MeasureInput name="teaspoonMl" label="Teaspoon (ml)" value={profile.teaspoonMl}/></div>
            <OverrideEditor
              ingredients={ingredients}
              overrides={overrides[profile.id] ?? []}
              onChange={(value) => setOverrides((current) => ({ ...current, [profile.id]: value }))}
            />
            <div className="mt-3 flex flex-wrap gap-2"><button className="rounded-lg bg-[#07513f] px-3 py-2 text-xs text-white">Save profile</button>{!profile.isDefault ? <button type="button" onClick={() => void makeDefault(profile)} className="rounded-lg border px-3 py-2 text-xs">Use this profile</button> : null}<button type="button" onClick={() => void deleteProfile(profile)} className="ml-auto text-xs text-red-700">Delete</button></div>
          </form>)}</div>
          <form onSubmit={createProfile} className="mt-4 rounded-xl border border-dashed p-4"><h3 className="font-serif text-lg">Add another profile</h3><div className="mt-2 grid gap-2 sm:grid-cols-5"><input required name="name" placeholder="e.g. Mile 12 derica" className="rounded-lg border p-2 text-sm"/><MeasureInput name="dericaMl" label="Derica ml" value={1000}/><MeasureInput name="cupMl" label="Cup ml" value={250}/><MeasureInput name="tablespoonMl" label="Tbsp ml" value={15}/><MeasureInput name="teaspoonMl" label="Tsp ml" value={5}/></div><button className="mt-3 rounded-lg border px-4 py-2 text-xs">Add profile</button></form>
        </section>
        <section className="panel">
          <h2>Profile & account</h2>
          <div className="profile-row">
            <img src={screenImages.suya} />
            <div>
              <Field label="Display name" value="Alex Morgan" />
              <Field label="Email" value="alex@example.com" />
              <Field label="Phone" value="+234 801 234 5678" />
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Food preferences</h2>
          <Field label="Dietary preference" value="Omnivore" />
          <div className="tag-row">
            <span>Peanuts ×</span>
            <span>Shellfish ×</span>
            <span>Mushrooms ×</span>
          </div>
        </section>
        <section className="panel">
          <h2>Nutrition goals</h2>
          <div className="goal">
            <div className="donut">
              <span>2,000</span>
            </div>
            <div>
              <Field label="Protein" value="120 g" />
              <Field label="Carbs" value="230 g" />
              <Field label="Fat" value="65 g" />
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Notifications</h2>
          {[
            "Email notifications",
            "Push notifications",
            "Meal-plan reminders",
            "Grocery reminders",
            "Expiry alerts",
            "Weekly insights",
          ].map((label) => (
            <Toggle label={label} key={label} />
          ))}
        </section>
        <section className="panel">
          <h2>Security</h2>
          <Field label="Current password" value="••••••••" />
          <Field label="New password" value="••••••••" />
          <button>Update password</button>
        </section>
        <section className="panel">
          <h2>Data & privacy</h2>
          <p>
            Download a copy of your meals, pantry items, preferences and
            activity history.
          </p>
          <button>Export my data</button>
        </section>
      </div>
    </DashboardPageShell>
  );
}
function OverrideEditor({ ingredients, overrides, onChange }: { ingredients: Ingredient[]; overrides: MeasurementOverride[]; onChange: (value: MeasurementOverride[]) => void }) {
  const update = (index: number, changes: Partial<MeasurementOverride>) => onChange(overrides.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  const add = () => {
    const ingredient = ingredients[0];
    if (!ingredient) return;
    onChange([...overrides, { ingredientId: ingredient.id, fromUnit: "derica", toUnit: ingredient.defaultUnit, multiplier: 1 }]);
  };

  return <div className="mt-4 rounded-xl bg-[#f5f1e8] p-3">
    <div className="flex items-center justify-between gap-3">
      <div><h3 className="text-sm font-semibold">Ingredient overrides</h3><p className="text-[10px] text-[#666]">Set the amount of the target unit held by one container.</p></div>
      <button type="button" onClick={add} disabled={!ingredients.length} className="rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-50">Add override</button>
    </div>
    <div className="mt-2 space-y-2">{overrides.map((override, index) => <div key={override.id ?? `${override.ingredientId}-${index}`} className="grid gap-2 rounded-lg border bg-white p-2 sm:grid-cols-[minmax(0,1fr)_90px_90px_100px_auto]">
      <label className="text-[10px]">Ingredient<select aria-label="Override ingredient" value={override.ingredientId} onChange={(event) => update(index, { ingredientId: event.target.value })} className="mt-1 w-full rounded-lg border p-2 text-xs">{ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}</select></label>
      <label className="text-[10px]">Container<input aria-label="Override source unit" value={override.fromUnit} onChange={(event) => update(index, { fromUnit: event.target.value })} className="mt-1 w-full rounded-lg border p-2 text-xs"/></label>
      <label className="text-[10px]">Target unit<input aria-label="Override target unit" value={override.toUnit} onChange={(event) => update(index, { toUnit: event.target.value })} className="mt-1 w-full rounded-lg border p-2 text-xs"/></label>
      <label className="text-[10px]">Amount<input aria-label="Override multiplier" type="number" min="0.000001" step="0.000001" value={override.multiplier} onChange={(event) => update(index, { multiplier: Number(event.target.value) })} className="mt-1 w-full rounded-lg border p-2 text-xs"/></label>
      <button type="button" aria-label="Remove override" onClick={() => onChange(overrides.filter((_, itemIndex) => itemIndex !== index))} className="self-end p-2 text-xs text-red-700">Remove</button>
    </div>)}</div>
  </div>;
}
function MeasureInput({ name, label, value }: { name: string; label: string; value: number }) { return <label className="text-[10px]">{label}<input required name={name} type="number" min="1" step="0.1" defaultValue={value} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>; }
function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <button className="toggle-row" onClick={() => setOn(!on)}>
      <span>{label}</span>
      <i className={on ? "on" : ""}>
        <b />
      </i>
    </button>
  );
}
