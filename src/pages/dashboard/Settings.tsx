import {
  Bell,
  Camera,
  Check,
  Download,
  Leaf,
  Ruler,
  Save,
  UserRound,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import { getCachedIngredientCatalog, loadIngredientCatalog } from "../../services/catalog";
import { Ingredient } from "../../types/inventory";
import { ScreenProps } from "../../types/navigation";

type UserProfile = {
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
};

type UserPreferences = {
  dietaryPreference?: string | null;
  allergies?: string[];
  avoidedIngredients?: string[];
  calorieGoal?: number | null;
  proteinGoal?: number | null;
  carbsGoal?: number | null;
  fatGoal?: number | null;
  maxCookingMinutes?: number | null;
  preferNigerianMeals?: boolean;
  cookingComfort?: string | null;
  defaultServings?: number | null;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  mealPlanReminders?: boolean;
  groceryReminders?: boolean;
  expiryAlerts?: boolean;
  lowStockAlerts?: boolean;
  weeklyInsights?: boolean;
};

type CurrentUser = {
  id: string;
  email: string;
  role: string;
  profile?: UserProfile | null;
  preferences?: UserPreferences | null;
};

type SettingsDraft = {
  displayName: string;
  phone: string;
  heightCm: number;
  weightKg: number;
  avatarUrl: string;
  dietaryPreference: string;
  allergies: string;
  avoidedIngredients: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  maxCookingMinutes: number;
  preferNigerianMeals: boolean;
  cookingComfort: string;
  defaultServings: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  mealPlanReminders: boolean;
  groceryReminders: boolean;
  expiryAlerts: boolean;
  lowStockAlerts: boolean;
  weeklyInsights: boolean;
};

type MeasurementOverride = {
  id?: string;
  ingredientId: string;
  fromUnit: string;
  toUnit: string;
  multiplier: number;
};

type MeasurementProfile = {
  id: string;
  name: string;
  isDefault: boolean;
  cupMl: number;
  tablespoonMl: number;
  teaspoonMl: number;
  dericaMl: number;
  overrides: MeasurementOverride[];
};

const defaultDraft: SettingsDraft = {
  displayName: "",
  phone: "",
  heightCm: 170,
  weightKg: 70,
  avatarUrl: "",
  dietaryPreference: "Omnivore",
  allergies: "",
  avoidedIngredients: "",
  calorieGoal: 2000,
  proteinGoal: 120,
  carbsGoal: 230,
  fatGoal: 65,
  maxCookingMinutes: 45,
  preferNigerianMeals: true,
  cookingComfort: "Comfortable",
  defaultServings: 2,
  emailNotifications: true,
  pushNotifications: true,
  mealPlanReminders: true,
  groceryReminders: true,
  expiryAlerts: true,
  lowStockAlerts: true,
  weeklyInsights: true,
};

const settingsCard = "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] p-5 shadow-sm";

function draftFromUser(user: CurrentUser): SettingsDraft {
  const profile = user.profile ?? {};
  const preferences = user.preferences ?? {};

  return {
    ...defaultDraft,
    displayName: profile.displayName ?? "",
    phone: profile.phone ?? "",
    heightCm: profile.heightCm ?? defaultDraft.heightCm,
    weightKg: profile.weightKg ?? defaultDraft.weightKg,
    avatarUrl: profile.avatarUrl ?? "",
    dietaryPreference: preferences.dietaryPreference ?? defaultDraft.dietaryPreference,
    allergies: (preferences.allergies ?? []).join(", "),
    avoidedIngredients: (preferences.avoidedIngredients ?? []).join(", "),
    calorieGoal: preferences.calorieGoal ?? defaultDraft.calorieGoal,
    proteinGoal: preferences.proteinGoal ?? defaultDraft.proteinGoal,
    carbsGoal: preferences.carbsGoal ?? defaultDraft.carbsGoal,
    fatGoal: preferences.fatGoal ?? defaultDraft.fatGoal,
    maxCookingMinutes: preferences.maxCookingMinutes ?? defaultDraft.maxCookingMinutes,
    preferNigerianMeals: preferences.preferNigerianMeals ?? true,
    cookingComfort: preferences.cookingComfort ?? defaultDraft.cookingComfort,
    defaultServings: preferences.defaultServings ?? defaultDraft.defaultServings,
    emailNotifications: preferences.emailNotifications ?? true,
    pushNotifications: preferences.pushNotifications ?? true,
    mealPlanReminders: preferences.mealPlanReminders ?? true,
    groceryReminders: preferences.groceryReminders ?? true,
    expiryAlerts: preferences.expiryAlerts ?? true,
    lowStockAlerts: preferences.lowStockAlerts ?? true,
    weeklyInsights: preferences.weeklyInsights ?? true,
  };
}

function listFromInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function initials(name: string, email = "") {
  return (name || email)
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

export function Settings({ onNavigate }: ScreenProps) {
  const photoInput = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [draft, setDraft] = useState<SettingsDraft>(defaultDraft);
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>(getCachedIngredientCatalog);
  const [overrides, setOverrides] = useState<Record<string, MeasurementOverride[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const [currentUser, profileValues, ingredientValues] = await Promise.all([
        api<CurrentUser>("/users/me"),
        api<MeasurementProfile[]>("/measurement-profiles"),
        loadIngredientCatalog(),
      ]);

      setUser(currentUser);
      setDraft(draftFromUser(currentUser));
      setProfiles(profileValues);
      setIngredients(ingredientValues);
      setOverrides(
        Object.fromEntries(
          profileValues.map((profile) => [profile.id, profile.overrides ?? []]),
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load your settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const macroChartBackground = useMemo(() => {
    const proteinCalories = draft.proteinGoal * 4;
    const carbCalories = draft.carbsGoal * 4;
    const fatCalories = draft.fatGoal * 9;
    const total = proteinCalories + carbCalories + fatCalories;

    if (!total) return "#e4ddd2";

    const proteinEnd = (proteinCalories / total) * 100;
    const carbEnd = proteinEnd + (carbCalories / total) * 100;
    return `conic-gradient(#599335 0 ${proteinEnd}%, #f56318 ${proteinEnd}% ${carbEnd}%, #f3b01e ${carbEnd}% 100%)`;
  }, [draft.carbsGoal, draft.fatGoal, draft.proteinGoal]);

  const updateDraft = <Key extends keyof SettingsDraft>(key: Key, value: SettingsDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");

    try {
      await Promise.all([
        api("/users/me/profile", {
          method: "PATCH",
          body: JSON.stringify({
            displayName: draft.displayName,
            phone: draft.phone,
            heightCm: draft.heightCm,
            weightKg: draft.weightKg,
          }),
        }),
        api("/users/me/preferences", {
          method: "PATCH",
          body: JSON.stringify({
            dietaryPreference: draft.dietaryPreference,
            allergyList: listFromInput(draft.allergies),
            avoidedIngredients: listFromInput(draft.avoidedIngredients),
            calorieGoal: draft.calorieGoal,
            proteinGoal: draft.proteinGoal,
            carbsGoal: draft.carbsGoal,
            fatGoal: draft.fatGoal,
            maxCookingMinutes: draft.maxCookingMinutes,
            preferNigerianMeals: draft.preferNigerianMeals,
            cookingComfort: draft.cookingComfort,
            defaultServings: draft.defaultServings,
            emailNotifications: draft.emailNotifications,
            pushNotifications: draft.pushNotifications,
            mealPlanReminders: draft.mealPlanReminders,
            groceryReminders: draft.groceryReminders,
            expiryAlerts: draft.expiryAlerts,
            lowStockAlerts: draft.lowStockAlerts,
            weeklyInsights: draft.weeklyInsights,
          }),
        }),
      ]);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your settings.");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError("Choose a profile photo smaller than 3 MB.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const result = await api<{ avatarUrl: string }>("/users/me/avatar", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          base64: await fileAsDataUrl(file),
        }),
      });
      updateDraft("avatarUrl", result.avatarUrl);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload your photo.");
    } finally {
      setUploading(false);
    }
  };

  const exportProfile = () => {
    const blob = new Blob([JSON.stringify({ user, settings: draft }, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "pantry-to-plate-profile.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <DashboardPageShell activePage="Settings" onNavigate={onNavigate}>
        <div className="grid min-h-[60vh] place-items-center text-sm text-[#68706a]">
          Loading your settings…
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      activePage="Settings"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
      showToolbar
      mainClassName="px-4 py-6 sm:px-7 xl:px-8"
    >
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[#084d42]">Settings</h1>
          <p className="mt-1 text-sm text-[#58706c]">Make Pantry-to-Plate work the way you do.</p>
        </div>
        <div className="flex items-center gap-4">
          {saved ? (
            <span className="flex items-center gap-2 text-xs text-emerald-700">
              <Check size={16} /> All changes saved
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#07513f] px-5 py-3 text-sm text-white disabled:opacity-60"
          >
            <Save size={16} /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[190px_minmax(0,1fr)]">
        <nav className={`${settingsCard} h-fit p-2 xl:sticky xl:top-5`}>
          {[
            ["profile", "Profile", UserRound],
            ["preferences", "Food preferences", Leaf],
            ["nutrition", "Nutrition goals", Ruler],
            ["notifications", "Notifications", Bell],
            ["measurements", "Measurements", Ruler],
          ].map(([id, label, Icon]) => (
            <a
              key={String(id)}
              href={`#${id}`}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs text-[#184d43] hover:bg-[#edf2e8]"
            >
              <Icon size={17} /> {String(label)}
            </a>
          ))}
        </nav>

        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          <section id="profile" className={settingsCard}>
            <SectionTitle title="Profile & account" />
            <div className="mt-4 grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
              <div className="text-center">
                {draft.avatarUrl ? (
                  <img
                    src={draft.avatarUrl}
                    alt="Your profile"
                    className="mx-auto h-28 w-28 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[#e6e2d8] font-serif text-3xl text-[#07513f]">
                    {initials(draft.displayName, user?.email)}
                  </div>
                )}
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => void uploadPhoto(event)}
                />
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  disabled={uploading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#07513f] px-3 py-2 text-xs text-[#07513f]"
                >
                  <Camera size={15} /> {uploading ? "Uploading…" : "Change photo"}
                </button>
              </div>
              <div className="grid gap-3">
                <TextInput
                  label="Display name"
                  value={draft.displayName}
                  onChange={(value) => updateDraft("displayName", value)}
                />
                <TextInput label="Email" value={user?.email ?? ""} disabled />
                <TextInput
                  label="Phone"
                  value={draft.phone}
                  onChange={(value) => updateDraft("phone", value)}
                  placeholder="+234 800 000 0000"
                />
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Height (cm)"
                    value={draft.heightCm}
                    min={50}
                    max={260}
                    onChange={(value) => updateDraft("heightCm", value)}
                  />
                  <NumberInput
                    label="Weight (kg)"
                    value={draft.weightKg}
                    min={20}
                    max={500}
                    onChange={(value) => updateDraft("weightKg", value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section id="preferences" className={settingsCard}>
            <SectionTitle title="Food preferences" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-[#315d55]">
                Dietary preference
                <select
                  value={draft.dietaryPreference}
                  onChange={(event) => updateDraft("dietaryPreference", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#d9d0c3] bg-white p-3 text-sm"
                >
                  <option>Omnivore</option>
                  <option>Vegetarian</option>
                  <option>Vegan</option>
                  <option>Pescatarian</option>
                  <option>Halal</option>
                </select>
              </label>
              <NumberInput
                label="Maximum cooking time"
                value={draft.maxCookingMinutes}
                min={1}
                max={240}
                suffix="min"
                onChange={(value) => updateDraft("maxCookingMinutes", value)}
              />
              <TextInput
                label="Allergies (comma separated)"
                value={draft.allergies}
                onChange={(value) => updateDraft("allergies", value)}
                placeholder="Peanuts, shellfish"
              />
              <TextInput
                label="Avoided ingredients"
                value={draft.avoidedIngredients}
                onChange={(value) => updateDraft("avoidedIngredients", value)}
                placeholder="Mushrooms, coriander"
              />
              <label className="text-xs text-[#315d55]">
                Cooking confidence
                <select
                  value={draft.cookingComfort}
                  onChange={(event) => updateDraft("cookingComfort", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#d9d0c3] bg-white p-3 text-sm"
                >
                  <option>Easy</option>
                  <option>Comfortable</option>
                  <option>Adventurous</option>
                </select>
              </label>
              <NumberInput
                label="Default servings"
                value={draft.defaultServings}
                min={1}
                max={20}
                onChange={(value) => updateDraft("defaultServings", value)}
              />
            </div>
            <Toggle
              label="Prefer Nigerian meals"
              checked={draft.preferNigerianMeals}
              onChange={(checked) => updateDraft("preferNigerianMeals", checked)}
            />
          </section>

          <section id="nutrition" className={settingsCard}>
            <SectionTitle title="Nutrition goals" subtitle="These targets shape meal recommendations." />
            <div className="mt-4 grid items-center gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
              <div className="macro-chart" style={{ background: macroChartBackground }}>
                <strong>
                  {draft.calorieGoal.toLocaleString()}
                  <small>kcal</small>
                </strong>
              </div>
              <div className="grid gap-2">
                <NumberInput
                  label="Calories"
                  value={draft.calorieGoal}
                  min={0}
                  suffix="kcal"
                  onChange={(value) => updateDraft("calorieGoal", value)}
                />
                <NumberInput
                  label="Protein"
                  value={draft.proteinGoal}
                  min={0}
                  suffix="g"
                  onChange={(value) => updateDraft("proteinGoal", value)}
                />
                <NumberInput
                  label="Carbohydrates"
                  value={draft.carbsGoal}
                  min={0}
                  suffix="g"
                  onChange={(value) => updateDraft("carbsGoal", value)}
                />
                <NumberInput
                  label="Fat"
                  value={draft.fatGoal}
                  min={0}
                  suffix="g"
                  onChange={(value) => updateDraft("fatGoal", value)}
                />
              </div>
            </div>
          </section>

          <section id="notifications" className={settingsCard}>
            <SectionTitle title="Notifications" />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {([
                ["emailNotifications", "Email notifications"],
                ["pushNotifications", "Push notifications"],
                ["mealPlanReminders", "Meal-plan reminders"],
                ["groceryReminders", "Grocery reminders"],
                ["expiryAlerts", "Expiry alerts"],
                ["lowStockAlerts", "Low-stock alerts"],
                ["weeklyInsights", "Weekly insights"],
              ] as const).map(([key, label]) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={draft[key]}
                  onChange={(checked) => updateDraft(key, checked)}
                />
              ))}
            </div>
          </section>

          <section className={`${settingsCard} lg:col-span-2`}>
            <SectionTitle title="Data & privacy" />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-xl text-xs leading-5 text-[#65716d]">
                Download the profile, preferences, and body measurements currently stored for your account.
              </p>
              <button
                type="button"
                onClick={exportProfile}
                className="flex items-center gap-2 rounded-lg border border-[#07513f] px-4 py-2 text-xs text-[#07513f]"
              >
                <Download size={16} /> Export my data
              </button>
            </div>
          </section>

          <section id="measurements" className={`${settingsCard} lg:col-span-2`}>
            <SectionTitle
              title="Nigerian measurement profiles"
              subtitle="Calibrate the cups, spoons, and derica containers used in your home or market."
            />
            <MeasurementProfiles
              profiles={profiles}
              ingredients={ingredients}
              overrides={overrides}
              setOverrides={setOverrides}
              setError={setError}
              reload={loadSettings}
            />
          </section>
        </div>
      </div>
    </DashboardPageShell>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-serif text-xl text-[#174d43]">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-[#68736f]">{subtitle}</p> : null}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="text-xs text-[#315d55]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-[#d9d0c3] bg-white p-3 text-sm disabled:bg-[#f3f0ea] disabled:text-[#8b918d]"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-xs text-[#315d55]">
      {label}
      <span className="mt-1 flex items-center rounded-lg border border-[#d9d0c3] bg-white">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))}
          className="min-w-0 flex-1 rounded-lg bg-transparent p-3 text-sm outline-none"
        />
        {suffix ? <span className="pr-3 text-[10px] text-[#7b837f]">{suffix}</span> : null}
      </span>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl border border-[#e4ddd1] bg-white px-3 py-3 text-left text-xs"
    >
      <span>{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#07513f]" : "bg-[#c8ccc8]"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function MeasurementProfiles({
  profiles,
  ingredients,
  overrides,
  setOverrides,
  setError,
  reload,
}: {
  profiles: MeasurementProfile[];
  ingredients: Ingredient[];
  overrides: Record<string, MeasurementOverride[]>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, MeasurementOverride[]>>>;
  setError: (value: string) => void;
  reload: () => Promise<void>;
}) {
  const createProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");

    try {
      await api("/measurement-profiles", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          isDefault: profiles.length === 0,
          cupMl: Number(form.get("cupMl")),
          tablespoonMl: Number(form.get("tablespoonMl")),
          teaspoonMl: Number(form.get("teaspoonMl")),
          dericaMl: Number(form.get("dericaMl")),
        }),
      });
      event.currentTarget.reset();
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create that profile.");
    }
  };

  const updateProfile = async (event: FormEvent<HTMLFormElement>, profile: MeasurementProfile) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");

    try {
      await api(`/measurement-profiles/${profile.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.get("name"),
          cupMl: Number(form.get("cupMl")),
          tablespoonMl: Number(form.get("tablespoonMl")),
          teaspoonMl: Number(form.get("teaspoonMl")),
          dericaMl: Number(form.get("dericaMl")),
          overrides: overrides[profile.id] ?? [],
        }),
      });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update that profile.");
    }
  };

  const makeDefault = async (profile: MeasurementProfile) => {
    await api(`/measurement-profiles/${profile.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isDefault: true }),
    });
    await reload();
  };

  const deleteProfile = async (profile: MeasurementProfile) => {
    if (!window.confirm(`Delete ${profile.name}?`)) return;
    await api(`/measurement-profiles/${profile.id}`, { method: "DELETE" });
    await reload();
  };

  return (
    <div className="mt-4">
      <div className="grid gap-3 lg:grid-cols-2">
        {profiles.map((profile) => (
          <form
            key={profile.id}
            onSubmit={(event) => void updateProfile(event, profile)}
            className="rounded-xl border bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                name="name"
                defaultValue={profile.name}
                className="w-full rounded-lg border p-2 font-semibold"
              />
              <span className={`rounded-full px-2 py-1 text-[10px] ${profile.isDefault ? "bg-emerald-100 text-emerald-700" : "bg-gray-100"}`}>
                {profile.isDefault ? "Active" : "Saved"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MeasureInput name="dericaMl" label="Derica (ml)" value={profile.dericaMl} />
              <MeasureInput name="cupMl" label="Cup (ml)" value={profile.cupMl} />
              <MeasureInput name="tablespoonMl" label="Tablespoon (ml)" value={profile.tablespoonMl} />
              <MeasureInput name="teaspoonMl" label="Teaspoon (ml)" value={profile.teaspoonMl} />
            </div>
            <OverrideEditor
              ingredients={ingredients}
              overrides={overrides[profile.id] ?? []}
              onChange={(value) => setOverrides((current) => ({ ...current, [profile.id]: value }))}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-lg bg-[#07513f] px-3 py-2 text-xs text-white">Save profile</button>
              {!profile.isDefault ? (
                <button type="button" onClick={() => void makeDefault(profile)} className="rounded-lg border px-3 py-2 text-xs">
                  Use this profile
                </button>
              ) : null}
              <button type="button" onClick={() => void deleteProfile(profile)} className="ml-auto text-xs text-red-700">
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>
      <form onSubmit={createProfile} className="mt-4 rounded-xl border border-dashed p-4">
        <h3 className="font-serif text-lg">Add another profile</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <input required name="name" placeholder="e.g. Mile 12 derica" className="rounded-lg border p-2 text-sm" />
          <MeasureInput name="dericaMl" label="Derica ml" value={1000} />
          <MeasureInput name="cupMl" label="Cup ml" value={250} />
          <MeasureInput name="tablespoonMl" label="Tbsp ml" value={15} />
          <MeasureInput name="teaspoonMl" label="Tsp ml" value={5} />
        </div>
        <button className="mt-3 rounded-lg border px-4 py-2 text-xs">Add profile</button>
      </form>
    </div>
  );
}

function OverrideEditor({
  ingredients,
  overrides,
  onChange,
}: {
  ingredients: Ingredient[];
  overrides: MeasurementOverride[];
  onChange: (value: MeasurementOverride[]) => void;
}) {
  const update = (index: number, changes: Partial<MeasurementOverride>) => {
    onChange(
      overrides.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    );
  };

  const add = () => {
    const ingredient = ingredients[0];
    if (!ingredient) return;
    onChange([
      ...overrides,
      {
        ingredientId: ingredient.id,
        fromUnit: "derica",
        toUnit: ingredient.defaultUnit,
        multiplier: 1,
      },
    ]);
  };

  return (
    <div className="mt-4 rounded-xl bg-[#f5f1e8] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Ingredient overrides</h3>
          <p className="text-[10px] text-[#666]">Set the target amount held by one container.</p>
        </div>
        <button type="button" onClick={add} disabled={!ingredients.length} className="rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-50">
          Add override
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {overrides.map((override, index) => (
          <div key={override.id ?? `${override.ingredientId}-${index}`} className="grid gap-2 rounded-lg border bg-white p-2 sm:grid-cols-[minmax(0,1fr)_90px_90px_100px_auto]">
            <label className="text-[10px]">
              Ingredient
              <select value={override.ingredientId} onChange={(event) => update(index, { ingredientId: event.target.value })} className="mt-1 w-full rounded-lg border p-2 text-xs">
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                ))}
              </select>
            </label>
            <SmallOverrideInput label="Container" value={override.fromUnit} onChange={(value) => update(index, { fromUnit: value })} />
            <SmallOverrideInput label="Target unit" value={override.toUnit} onChange={(value) => update(index, { toUnit: value })} />
            <label className="text-[10px]">
              Amount
              <input type="number" min="0.000001" step="0.000001" value={override.multiplier} onChange={(event) => update(index, { multiplier: Number(event.target.value) })} className="mt-1 w-full rounded-lg border p-2 text-xs" />
            </label>
            <button type="button" onClick={() => onChange(overrides.filter((_, itemIndex) => itemIndex !== index))} className="self-end p-2 text-xs text-red-700">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmallOverrideInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-[10px]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-xs" />
    </label>
  );
}

function MeasureInput({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <label className="text-[10px]">
      {label}
      <input required name={name} type="number" min="1" step="0.1" defaultValue={value} className="mt-1 w-full rounded-lg border p-2 text-sm" />
    </label>
  );
}
