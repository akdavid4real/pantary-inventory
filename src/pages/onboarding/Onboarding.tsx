import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  CookingPot,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBasket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import onboardingBackground from "../../../assets/auth/onboarding-food-background.webp";
import rice from "../../../assets/ingredients/01-long-grain-rice.webp";
import beans from "../../../assets/ingredients/02-brown-beans.webp";
import yam from "../../../assets/ingredients/04-yam-tuber.webp";
import garri from "../../../assets/ingredients/06-garri.webp";
import plantain from "../../../assets/ingredients/07-plantain.webp";
import egusi from "../../../assets/ingredients/12-egusi-seeds.webp";
import oil from "../../../assets/ingredients/16-palm-oil.webp";
import tomatoes from "../../../assets/ingredients/17-fresh-tomatoes.webp";
import pepper from "../../../assets/ingredients/19-scotch-bonnet-peppers.webp";
import onions from "../../../assets/ingredients/20-onions.webp";
import ugu from "../../../assets/ingredients/22-ugu-leaves.webp";
import crayfish from "../../../assets/ingredients/28-crayfish.webp";
import stockfish from "../../../assets/ingredients/29-stockfish.webp";
import chicken from "../../../assets/foods/26-chicken-suya.webp";
import eggs from "../../../assets/foods/33-akara.webp";
import jollof from "../../../assets/foods/01-nigerian-jollof-rice.webp";
import egusiMeal from "../../../assets/foods/09-egusi-soup.webp";
import beansMeal from "../../../assets/foods/07-nigerian-beans-porridge.webp";
import stew from "../../../assets/foods/19-nigerian-tomato-stew.webp";
import moi from "../../../assets/foods/32-moi-moi.webp";
import suya from "../../../assets/foods/27-beef-suya.webp";
import { Brand } from "../../components/Brand";
import { api } from "../../services/api";
import { Ingredient, Paginated } from "../../types/inventory";
import { ScreenProps } from "../../types/navigation";
import { defaultIngredientQuantity, ingredientUnitOptions, unitHelp, unitLabels } from "../../utils/units";

const DRAFT_KEY = "pantry-to-plate-onboarding-v2";
const ALLERGY_OPTIONS = ["Peanuts", "Shellfish", "Dairy", "Eggs", "Gluten", "Soy"];
const AVOIDED_OPTIONS = ["Mushrooms", "Cilantro", "Okra", "Offal"];
const CATEGORY_TABS = ["All", "Staples", "Proteins", "Vegetables", "Spices", "Fridge"];
const DEFAULT_SELECTED_NAMES = new Set([
  "rice",
  "garri",
  "beans",
  "yam",
  "plantain",
  "pepper",
  "egusi",
  "palm oil",
  "dried crayfish",
  "egg",
]);

const pantryVisuals: Record<string, { label: string; image: string }> = {
  rice: { label: "Rice", image: rice },
  garri: { label: "Garri", image: garri },
  beans: { label: "Beans", image: beans },
  yam: { label: "Yam", image: yam },
  plantain: { label: "Plantain", image: plantain },
  tomato: { label: "Tomatoes", image: tomatoes },
  onion: { label: "Onions", image: onions },
  pepper: { label: "Pepper", image: pepper },
  egusi: { label: "Egusi seeds", image: egusi },
  "palm oil": { label: "Palm oil", image: oil },
  "dried crayfish": { label: "Crayfish", image: crayfish },
  stockfish: { label: "Stockfish", image: stockfish },
  chicken: { label: "Chicken", image: chicken },
  egg: { label: "Eggs", image: eggs },
  spinach: { label: "Spinach/Ugu", image: ugu },
  "fluted pumpkin leaf": { label: "Spinach/Ugu", image: ugu },
};

export type PantrySelection = {
  ingredientId: string;
  name: string;
  category: string;
  storageLocation: string;
  quantity: number;
  unit: string;
  conversions?: Ingredient["conversions"];
};

type OnboardingDraft = {
  diet?: string;
  minutes?: string;
  comfort?: string;
  servings?: number;
  preferNigerianMeals?: boolean;
  allergies?: string[];
  avoidedIngredients?: string[];
  nutrition?: NutritionGoals;
  pantrySelections?: PantrySelection[];
};

export type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const recommendedNutrition: NutritionGoals = {
  calories: 2000,
  protein: 120,
  carbs: 230,
  fat: 65,
};

export function filterOnboardingIngredients(ingredients: Ingredient[], search: string, tab: string) {
  const query = search.trim().toLowerCase();
  return ingredients.filter((ingredient) => {
    const visual = pantryVisuals[ingredient.name.toLowerCase()];
    const matchesSearch = !query || ingredient.name.toLowerCase().includes(query) || visual?.label.toLowerCase().includes(query);
    return matchesSearch && ingredientMatchesTab(ingredient, tab);
  });
}

export function buildOnboardingPayload(input: {
  displayName: string;
  diet: string;
  allergies: string[];
  avoidedIngredients: string[];
  nutrition: NutritionGoals;
  minutes: string;
  preferNigerianMeals: boolean;
  comfort: string;
  servings: number;
  pantrySelections: PantrySelection[];
}) {
  return {
    displayName: input.displayName,
    dietaryPreference: input.diet,
    allergyList: input.allergies,
    avoidedIngredients: input.avoidedIngredients,
    calorieGoal: input.nutrition.calories,
    proteinGoal: input.nutrition.protein,
    carbsGoal: input.nutrition.carbs,
    fatGoal: input.nutrition.fat,
    maxCookingMinutes: Number.parseInt(input.minutes, 10) || 45,
    preferNigerianMeals: input.preferNigerianMeals,
    cookingComfort: input.comfort,
    defaultServings: input.servings,
    pantryItems: input.pantrySelections.map(({ ingredientId, quantity, unit }) => ({ ingredientId, quantity, unit })),
  };
}

function readDraft(): OnboardingDraft {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}") as OnboardingDraft;
  } catch {
    return {};
  }
}

function ingredientMatchesTab(ingredient: Ingredient, tab: string) {
  if (tab === "All") return true;
  if (tab === "Fridge") return ingredient.storageLocation === "FRIDGE";
  const category = ingredient.category.toLowerCase();
  if (tab === "Proteins") return category.includes("protein") || category.includes("seafood");
  if (tab === "Vegetables") return category.includes("vegetable");
  if (tab === "Spices") return category.includes("spice") || category.includes("oil");
  return ["grains", "legumes", "swallow", "tubers", "fruits"].some((value) => category.includes(value));
}

export function Onboarding({ step, onNavigate }: ScreenProps & { step: number }) {
  const draft = useMemo(readDraft, []);
  const [diet, setDiet] = useState(draft.diet ?? "Omnivore");
  const [minutes, setMinutes] = useState(draft.minutes ?? "45 min");
  const [comfort, setComfort] = useState(draft.comfort ?? "Comfortable");
  const [servings, setServings] = useState(draft.servings ?? 2);
  const [preferNigerianMeals, setPreferNigerianMeals] = useState(draft.preferNigerianMeals ?? true);
  const [allergies, setAllergies] = useState<string[]>(draft.allergies ?? []);
  const [avoidedIngredients, setAvoidedIngredients] = useState<string[]>(draft.avoidedIngredients ?? []);
  const [nutrition, setNutrition] = useState<NutritionGoals>(draft.nutrition ?? recommendedNutrition);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [pantrySelections, setPantrySelections] = useState<PantrySelection[]>(draft.pantrySelections ?? []);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [customAllergy, setCustomAllergy] = useState("");
  const [customAvoided, setCustomAvoided] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const displayName = sessionStorage.getItem("onboarding-display-name") ?? "there";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  useEffect(() => {
    let active = true;
    async function loadIngredients() {
      try {
        const result = await api<Paginated<Ingredient>>("/ingredients?limit=100");
        if (!active) return;
        const visible = result.items.filter((ingredient) => pantryVisuals[ingredient.name.toLowerCase()]);
        setIngredients(visible);
        setPantrySelections((current) => {
          if (current.length > 0) {
            const validIds = new Set(visible.map((ingredient) => ingredient.id));
            return current.filter((item) => validIds.has(item.ingredientId));
          }
          return visible
            .filter((ingredient) => DEFAULT_SELECTED_NAMES.has(ingredient.name.toLowerCase()))
            .map((ingredient) => ({
              ingredientId: ingredient.id,
              name: ingredient.name,
              category: ingredient.category,
              storageLocation: ingredient.storageLocation,
              quantity: defaultIngredientQuantity(ingredient.defaultUnit),
              unit: ingredient.defaultUnit,
              conversions: ingredient.conversions,
            }));
        });
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load ingredients.");
      } finally {
        if (active) setCatalogLoading(false);
      }
    }
    void loadIngredients();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        diet,
        minutes,
        comfort,
        servings,
        preferNigerianMeals,
        allergies,
        avoidedIngredients,
        nutrition,
        pantrySelections,
      } satisfies OnboardingDraft),
    );
  }, [allergies, avoidedIngredients, comfort, diet, minutes, nutrition, pantrySelections, preferNigerianMeals, servings]);

  const filteredIngredients = useMemo(() => {
    return filterOnboardingIngredients(ingredients, ingredientSearch, activeCategory);
  }, [activeCategory, ingredientSearch, ingredients]);

  const next = async () => {
    if (step !== 4) {
      onNavigate(`onboarding-${step + 1}`);
      return;
    }
    if (pantrySelections.length === 0) {
      setError("Choose at least one pantry ingredient.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api("/users/me/onboarding", {
        method: "POST",
        body: JSON.stringify(buildOnboardingPayload({ displayName, diet, allergies, avoidedIngredients, nutrition, minutes, preferNigerianMeals, comfort, servings, pantrySelections })),
      });
      sessionStorage.removeItem(DRAFT_KEY);
      onNavigate("Home");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => onNavigate(step === 1 ? "sign-up" : `onboarding-${step - 1}`);

  if (step === 1) {
    return <WelcomeStep displayName={displayName} onNext={next} onSkip={() => onNavigate("Home")} />;
  }

  return (
    <main className="onboarding-flow">
      <header className="onboarding-top">
        <Brand />
        <Progress step={step} />
        <span>{step} of 4</span>
      </header>

      {step === 2 ? (
        <PreferenceStep
          displayName={displayName}
          diet={diet}
          onDietChange={setDiet}
          preferNigerianMeals={preferNigerianMeals}
          onPreferNigerianMealsChange={setPreferNigerianMeals}
          allergies={allergies}
          onAllergiesChange={setAllergies}
          avoidedIngredients={avoidedIngredients}
          onAvoidedIngredientsChange={setAvoidedIngredients}
          customAllergy={customAllergy}
          onCustomAllergyChange={setCustomAllergy}
          customAvoided={customAvoided}
          onCustomAvoidedChange={setCustomAvoided}
        />
      ) : step === 3 ? (
        <CookingPreferenceStep
          displayName={displayName}
          minutes={minutes}
          onMinutesChange={setMinutes}
          comfort={comfort}
          onComfortChange={setComfort}
          servings={servings}
          onServingsChange={setServings}
          nutrition={nutrition}
          onNutritionChange={setNutrition}
        />
      ) : (
        <PantryStep
          displayName={displayName}
          ingredients={filteredIngredients}
          selections={pantrySelections}
          onSelectionsChange={setPantrySelections}
          search={ingredientSearch}
          onSearchChange={setIngredientSearch}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          loading={catalogLoading}
        />
      )}

      <footer className="onboarding-actions">
        {error ? <p className="onboarding-error" role="alert">{error}</p> : null}
        <button onClick={back}><ArrowLeft /> Back</button>
        <button className="skip" onClick={() => onNavigate("Home")}>Skip for now</button>
        <button className="primary" onClick={() => void next()} disabled={submitting || catalogLoading}>
          {submitting ? "Saving..." : step === 4 ? "Create my meal plan" : "Continue"}
          <ArrowRight />
        </button>
      </footer>
    </main>
  );
}

type PreferenceStepProps = {
  displayName: string;
  diet: string;
  onDietChange: (value: string) => void;
  preferNigerianMeals: boolean;
  onPreferNigerianMealsChange: (value: boolean) => void;
  allergies: string[];
  onAllergiesChange: (value: string[]) => void;
  avoidedIngredients: string[];
  onAvoidedIngredientsChange: (value: string[]) => void;
  customAllergy: string;
  onCustomAllergyChange: (value: string) => void;
  customAvoided: string;
  onCustomAvoidedChange: (value: string) => void;
};

function PreferenceStep(props: PreferenceStepProps) {
  const toggleValue = (values: string[], value: string, change: (items: string[]) => void) => {
    change(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };
  const addCustom = (value: string, values: string[], change: (items: string[]) => void, clear: () => void) => {
    const trimmed = value.trim();
    if (trimmed && !values.some((item) => item.toLowerCase() === trimmed.toLowerCase())) change([...values, trimmed]);
    clear();
  };

  return (
    <>
      <div className="onboarding-heading">
        <h1>What do you enjoy eating, {props.displayName}?</h1>
        <p>We’ll tailor recipes to your tastes and needs.</p>
      </div>
      <section className="preference-layout">
        <div>
          <h2>Dietary preference</h2>
          <div className="diet-grid">
            {["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Halal"].map((item) => (
              <button className={props.diet === item ? "selected" : ""} onClick={() => props.onDietChange(item)} key={item}>
                <span>{item === "Omnivore" ? "🍴" : item === "Pescatarian" ? "🐟" : "🌿"}</span>
                {item}
                {props.diet === item ? <Check /> : null}
              </button>
            ))}
          </div>
          <label className="nigerian-toggle">
            <span><b>Prioritize Nigerian meals</b><small>We’ll show more Nigerian recipes in your plan.</small></span>
            <input type="checkbox" checked={props.preferNigerianMeals} onChange={(event) => props.onPreferNigerianMealsChange(event.target.checked)} />
          </label>
        </div>
        <div className="meal-sampler">
          {[[jollof, "Jollof Rice"], [egusiMeal, "Egusi Soup"], [moi, "Moi Moi"], [suya, "Suya-Style Beef"], [beansMeal, "Beans & Plantain"], [stew, "Vegetable Stew"]].map(([image, title]) => (
            <figure key={title}><img src={image} alt="" /><figcaption>{title}</figcaption></figure>
          ))}
        </div>
      </section>
      <section className="preference-tags">
        <h2>Allergies</h2>
        <div>
          {ALLERGY_OPTIONS.map((item) => (
            <button className={props.allergies.includes(item) ? "selected" : ""} onClick={() => toggleValue(props.allergies, item, props.onAllergiesChange)} key={item}>
              {item}{props.allergies.includes(item) ? " ×" : ""}
            </button>
          ))}
          {props.allergies.filter((item) => !ALLERGY_OPTIONS.includes(item)).map((item) => (
            <button className="selected" onClick={() => toggleValue(props.allergies, item, props.onAllergiesChange)} key={item}>{item} ×</button>
          ))}
          <input value={props.customAllergy} onChange={(event) => props.onCustomAllergyChange(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter") addCustom(props.customAllergy, props.allergies, props.onAllergiesChange, () => props.onCustomAllergyChange(""));
          }} placeholder="Add another allergy" />
          <button onClick={() => addCustom(props.customAllergy, props.allergies, props.onAllergiesChange, () => props.onCustomAllergyChange(""))}>＋ Add</button>
        </div>
        <h2>Avoided ingredients</h2>
        <div>
          {AVOIDED_OPTIONS.map((item) => (
            <button className={props.avoidedIngredients.includes(item) ? "selected" : ""} onClick={() => toggleValue(props.avoidedIngredients, item, props.onAvoidedIngredientsChange)} key={item}>
              {item}{props.avoidedIngredients.includes(item) ? " ×" : ""}
            </button>
          ))}
          {props.avoidedIngredients.filter((item) => !AVOIDED_OPTIONS.includes(item)).map((item) => (
            <button className="selected" onClick={() => toggleValue(props.avoidedIngredients, item, props.onAvoidedIngredientsChange)} key={item}>{item} ×</button>
          ))}
          <input value={props.customAvoided} onChange={(event) => props.onCustomAvoidedChange(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter") addCustom(props.customAvoided, props.avoidedIngredients, props.onAvoidedIngredientsChange, () => props.onCustomAvoidedChange(""));
          }} placeholder="Add an ingredient to avoid" />
          <button onClick={() => addCustom(props.customAvoided, props.avoidedIngredients, props.onAvoidedIngredientsChange, () => props.onCustomAvoidedChange(""))}>＋ Add</button>
        </div>
      </section>
    </>
  );
}

type CookingPreferenceStepProps = {
  displayName: string;
  minutes: string;
  onMinutesChange: (value: string) => void;
  comfort: string;
  onComfortChange: (value: string) => void;
  servings: number;
  onServingsChange: (value: number) => void;
  nutrition: NutritionGoals;
  onNutritionChange: (value: NutritionGoals) => void;
};

function CookingPreferenceStep(props: CookingPreferenceStepProps) {
  const updateNutrition = (key: keyof NutritionGoals, value: string) => {
    props.onNutritionChange({ ...props.nutrition, [key]: Math.max(0, Number(value) || 0) });
  };
  return (
    <>
      <div className="onboarding-heading centered">
        <h1>How do you like to cook, {props.displayName}?</h1>
        <p>Set practical goals—we’ll keep recommendations realistic.</p>
      </div>
      <section className="cooking-preferences">
        <div className="onboard-panel">
          <h2>Cooking style</h2>
          <label>Maximum cooking time</label>
          <div className="segmented">
            {["15 min", "30 min", "45 min", "60+ min"].map((item) => <button className={props.minutes === item ? "selected" : ""} onClick={() => props.onMinutesChange(item)} key={item}>{item}</button>)}
          </div>
          <label>Skill comfort</label>
          <div className="segmented">
            {["Easy", "Comfortable", "Adventurous"].map((item) => <button className={props.comfort === item ? "selected" : ""} onClick={() => props.onComfortChange(item)} key={item}>{item}</button>)}
          </div>
          <div className="servings">
            <span>Default servings</span>
            <button aria-label="Decrease servings" onClick={() => props.onServingsChange(Math.max(1, props.servings - 1))}><Minus /></button>
            <b>{props.servings}</b>
            <button aria-label="Increase servings" onClick={() => props.onServingsChange(Math.min(20, props.servings + 1))}><Plus /></button>
          </div>
          <h3>Nigerian meal examples by time</h3>
          {[[yam, "Egg stew & yam", "20 min"], [jollof, "Jollof rice", "45 min"], [onboardingBackground, "Grilled fish & plantain", "35 min"]].map(([image, title, time]) => (
            <div className="meal-time" key={title}><img src={image} alt="" /><span>{title}</span><b>{time}</b></div>
          ))}
        </div>
        <div className="onboard-panel nutrition-goals">
          <h2>Daily nutrition goals <small>Optional</small></h2>
          {([['calories', 'Calories', 'kcal'], ['protein', 'Protein', 'g'], ['carbs', 'Carbs', 'g'], ['fat', 'Fat', 'g']] as const).map(([key, label, unit]) => (
            <label key={key}><span>{label}</span><input type="number" min="0" value={props.nutrition[key]} onChange={(event) => updateNutrition(key, event.target.value)} /><b>{unit}</b></label>
          ))}
          <div className="macro-chart"><strong>{props.nutrition.calories.toLocaleString()}<small>kcal</small></strong></div>
          <button onClick={() => props.onNutritionChange(recommendedNutrition)}>↻ &nbsp; Use recommended goals</button>
        </div>
      </section>
    </>
  );
}

type PantryStepProps = {
  displayName: string;
  ingredients: Ingredient[];
  selections: PantrySelection[];
  onSelectionsChange: (value: PantrySelection[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  loading: boolean;
};

function PantryStep(props: PantryStepProps) {
  const toggleIngredient = (ingredient: Ingredient) => {
    const existing = props.selections.find((item) => item.ingredientId === ingredient.id);
    if (existing) {
      props.onSelectionsChange(props.selections.filter((item) => item.ingredientId !== ingredient.id));
      return;
    }
    props.onSelectionsChange([...props.selections, {
      ingredientId: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      storageLocation: ingredient.storageLocation,
      quantity: defaultIngredientQuantity(ingredient.defaultUnit),
      unit: ingredient.defaultUnit,
      conversions: ingredient.conversions,
    }]);
  };
  const updateSelection = (ingredientId: string, changes: Partial<PantrySelection>) => {
    props.onSelectionsChange(props.selections.map((item) => item.ingredientId === ingredientId ? { ...item, ...changes } : item));
  };
  return (
    <>
      <div className="onboarding-heading pantry-heading">
        <small>4 of 4</small>
        <h1>What’s in your pantry, {props.displayName}?</h1>
        <p>Add a few ingredients so we can recommend your first meals.</p>
      </div>
      <section className="pantry-builder">
        <div>
          <input className="pantry-search" value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Search ingredients" />
          <div className="category-tabs">
            {CATEGORY_TABS.map((tab) => <button className={props.activeCategory === tab ? "selected" : ""} onClick={() => props.onCategoryChange(tab)} key={tab}>{tab}</button>)}
          </div>
          {props.loading ? <p>Loading ingredient catalog…</p> : null}
          <div className="ingredient-grid">
            {props.ingredients.map((ingredient) => {
              const active = props.selections.some((item) => item.ingredientId === ingredient.id);
              const visual = pantryVisuals[ingredient.name.toLowerCase()];
              return <button className={active ? "selected" : ""} onClick={() => toggleIngredient(ingredient)} key={ingredient.id}>
                <img src={visual?.image} alt="" /><span>{visual?.label ?? ingredient.name}</span>{active ? <Check /> : null}
              </button>;
            })}
          </div>
          {!props.loading && props.ingredients.length === 0 ? <p>No ingredients match this search and category.</p> : null}
        </div>
        <aside>
          <h2>Your starter pantry</h2>
          <p>{props.selections.length} items selected</p>
          {props.selections.map((item) => {
            const visual = pantryVisuals[item.name.toLowerCase()];
            const ingredient = props.ingredients.find((entry) => entry.id === item.ingredientId) ?? { defaultUnit: item.unit, conversions: item.conversions };
            return <div key={item.ingredientId}>
              <img src={visual?.image} alt="" /><span>{visual?.label ?? item.name}</span>
              <input aria-label={`${visual?.label ?? item.name} quantity`} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateSelection(item.ingredientId, { quantity: Math.max(0.01, Number(event.target.value) || 0.01) })} />
              <select aria-label={`${visual?.label ?? item.name} unit`} value={item.unit} onChange={(event) => updateSelection(item.ingredientId, { unit: event.target.value })}>
                {ingredientUnitOptions(ingredient).map((unit) => <option key={unit} value={unit}>{unitLabels[unit] ?? unit}</option>)}
              </select>
              <small className="unit-help">{unitHelp(ingredient)}</small>
              <button aria-label={`Remove ${visual?.label ?? item.name}`} onClick={() => props.onSelectionsChange(props.selections.filter((selection) => selection.ingredientId !== item.ingredientId))}>×</button>
            </div>;
          })}
        </aside>
      </section>
    </>
  );
}

function Progress({ step }: { step: number }) {
  return <div className="flow-progress">{[1, 2, 3, 4].map((item) => <span className={item < step ? "done" : item === step ? "active" : ""} key={item}>{item < step ? <Check /> : item}</span>)}</div>;
}

function WelcomeStep({ displayName, onNext, onSkip }: { displayName: string; onNext: () => void; onSkip: () => void }) {
  return <main className="onboarding-welcome">
    <section style={{ backgroundImage: `url(${onboardingBackground})` }}>
      <Brand inverse />
      <div><i /><h1>Nigerian meals.<br /><em>Made simple, made yours.</em></h1><p>From jollof to egusi, Pantry-to-Plate helps you cook with what you have, honour your traditions, and make every meal count.</p></div>
    </section>
    <section><div>
      <h1>Welcome, {displayName}</h1><p>Let’s turn what you have into meals you’ll love.</p><i />
      {[[CookingPot, "Use what’s already in your pantry", "Add your ingredients and let us help you make the most of what you have."], [ChefHat, "Plan delicious meals faster", "Get tailored meal ideas and cooking guidance in minutes."], [ShoppingBasket, "Waste less and shop smarter", "Avoid duplicates, use ingredients on time, and save money."]].map(([Icon, title, copy]) => {
        const StepIcon = Icon as typeof CookingPot;
        return <article key={String(title)}><span><StepIcon /></span><div><h2>{String(title)}</h2><p>{String(copy)}</p></div></article>;
      })}
      <div className="welcome-dots"><b /> ○ ○ ○ <span>1 of 4</span></div>
      <button className="primary" onClick={onNext}>Let’s get started <ArrowRight /></button>
      <button onClick={onSkip}>I’ll do this later</button>
      <small><ShieldCheck /> You can change everything later in Settings.</small>
    </div></section>
  </main>;
}
