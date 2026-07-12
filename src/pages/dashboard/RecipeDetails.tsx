import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  Leaf,
  Minus,
  Pencil,
  Play,
  Plus,
  ShoppingBasket,
  Users,
} from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { cookingSteps, screenImages } from "../../features/dashboard/screenData";
import { ScreenProps } from "../../types/navigation";
import "./RecipeDetails.css";
import recipeHero from "../../../assets/foods/jollof-rice-grilled-chicken-hero.png";

const essentialIngredients = [
  ["Parboiled long grain rice", "2 cups"],
  ["Chicken (legs & thighs)", "1.2 kg"],
  ["Tomatoes", "4 large"],
  ["Red bell pepper", "2"],
  ["Red onion", "2 medium"],
  ["Scotch bonnet peppers", "2"],
  ["Vegetable oil", "1/2 cup"],
  ["Tomato paste", "2 tbsp"],
  ["Chicken bouillon cubes", "2"],
  ["Salt", "To taste"],
];

const optionalIngredients = [
  ["Bay leaf", "2"],
  ["Thyme", "1 tsp"],
  ["Curry powder", "1 tsp"],
];

const stepDescriptions = [
  "Season chicken with salt, bouillon, and a little oil. Let it marinate while you prepare the other ingredients.",
  "Grill over medium heat until nicely charred and fully cooked. Set aside.",
  "Blend tomatoes, red bell peppers, scotch bonnet peppers, and half of the onions until smooth.",
  "Heat oil in a large pot. Sauté the remaining onions until soft. Add tomato paste and cook for 2 minutes.",
  "Pour in the blended pepper mix. Cook until the sauce thickens and the oil begins to separate.",
  "Add rice, stir to coat in the sauce. Add water, bouillon, bay leaf, thyme, and salt. Cover and cook on low heat.",
  "Let the rice sit covered for 5 minutes. Fluff gently and serve with grilled chicken.",
];

export function RecipeDetails({ onNavigate }: ScreenProps) {
  return (
    <DashboardPageShell
      activePage="Explore"
      onNavigate={onNavigate}
      showToolbar
      rootClassName="app-shell--recipe-details"
    >
      <div className="recipe-detail-page">
        <div className="recipe-breadcrumbs">
          <button onClick={() => onNavigate("Explore")}>
            <ArrowLeft />
          </button>
          <span>Explore recipes</span>
          <i>/</i>
          <span>Nigerian</span>
          <i>/</i>
          <b>Jollof Rice</b>
          <button
            className="edit-recipe"
            onClick={() => onNavigate("add-edit-recipe")}
          >
            <Pencil />
            Edit recipe
          </button>
        </div>

        <div className="recipe-detail-layout">
          <section className="recipe-left-column">
            <div className="recipe-photo">
              <img src={recipeHero} alt="Jollof rice with grilled chicken" />
              <button aria-label="Favorite recipe">
                <Heart fill="currentColor" />
              </button>
            </div>
            <NutritionSummary />
            <Ingredients />
          </section>

          <main className="recipe-center-column">
            <header className="recipe-title-block">
              <h1>
                Jollof Rice with
                <br />
                Grilled Chicken
              </h1>
              <p>
                Classic Nigerian jollof rice cooked in a rich tomato-pepper
                sauce and served with smoky, juicy grilled chicken.
              </p>
              <div className="recipe-tags">
                <span>🇳🇬 Nigerian</span>
                <span>Main course</span>
                <span>One-pot</span>
                <span>Family friendly</span>
                <span>Spicy</span>
              </div>
            </header>
            <RecipeMetrics />
            <div className="recipe-actions">
              <button onClick={() => onNavigate("cooking-mode")}>
                <Play fill="currentColor" />
                Start cooking
              </button>
              <button>
                <CalendarDays />
                Add to meal plan
              </button>
              <button onClick={() => onNavigate("generate-shopping-list")}>
                <ShoppingBasket />
                Generate shopping list
              </button>
            </div>
            <CookingSteps />
          </main>

          <aside className="recipe-right-column">
            <PantryMatch onNavigate={onNavigate} />
            <MissingIngredients onNavigate={onNavigate} />
            <ServingAdjuster />
            <MoreRecipes />
            <ChefTip />
          </aside>
        </div>
      </div>
    </DashboardPageShell>
  );
}

function NutritionSummary() {
  return (
    <section className="nutrition-summary">
      <p>Nutrition per serving (estimated)</p>
      <div>
        {[
          ["520", "Calories"],
          ["28 g", "Protein"],
          ["68 g", "Carbs"],
          ["18 g", "Fat"],
        ].map(([value, label]) => (
          <span key={label}>
            <strong>{value}</strong>
            <small>{label}</small>
          </span>
        ))}
      </div>
      <small>Estimates are based on standard ingredient values.</small>
    </section>
  );
}

function Ingredients() {
  return (
    <section className="ingredients-panel">
      <header>
        <h2>Ingredients</h2>
        <button>
          <Check />
          Check all
        </button>
        <button>
          <ShoppingBasket />
          Add missing to grocery
        </button>
      </header>
      <IngredientGroup
        title="Essentials"
        items={essentialIngredients}
        available
      />
      <IngredientGroup title="Optional" items={optionalIngredients} />
    </section>
  );
}

function IngredientGroup({
  title,
  items,
  available = false,
}: {
  title: string;
  items: string[][];
  available?: boolean;
}) {
  return (
    <div className="ingredient-group">
      <h3>{title}</h3>
      {items.map(([name, amount]) => (
        <div className="ingredient-detail-row" key={name}>
          <span className={available ? "checked" : "unchecked"}>
            {available ? <Check /> : null}
          </span>
          <b>{name}</b>
          <small>{amount}</small>
          <i className={available ? "have" : "need"}>
            {available ? "Have" : "Need"}
          </i>
        </div>
      ))}
    </div>
  );
}

function RecipeMetrics() {
  return (
    <section className="recipe-metrics">
      <div>
        <span>
          <Leaf />
        </span>
        <strong>
          94%<small>Pantry match</small>
        </strong>
      </div>
      <div>
        <Clock3 />
        <strong>
          40 min<small>Total time</small>
        </strong>
      </div>
      <div>
        <BarChart3 />
        <strong>
          Medium<small>Difficulty</small>
        </strong>
      </div>
      <div className="serving-metric">
        <button>
          <Minus />
        </button>
        <strong>
          4<small>Servings</small>
        </strong>
        <button>
          <Plus />
        </button>
      </div>
    </section>
  );
}

function CookingSteps() {
  return (
    <section className="cooking-steps-panel">
      <header>
        <h2>Cooking steps</h2>
        <button>Collapse all</button>
      </header>
      {cookingSteps.map((step, index) => (
        <article key={step}>
          <span>{index + 1}</span>
          <div>
            <h3>
              {step}
              <small>{5 + index * 2} min</small>
            </h3>
            <p>{stepDescriptions[index]}</p>
          </div>
          <button aria-label={`Expand ${step}`}>
            <ChevronDown />
          </button>
        </article>
      ))}
    </section>
  );
}

function PantryMatch({ onNavigate }: ScreenProps) {
  return (
    <section>
      <h2>Pantry match</h2>
      <div className="pantry-match-body">
        <div className="pantry-ring" />
        <strong>
          94%<small>Great match!</small>
        </strong>
      </div>
      <p>You have most of what you need.</p>
      <button onClick={() => onNavigate("Pantry")}>View pantry</button>
    </section>
  );
}

function MissingIngredients({ onNavigate }: ScreenProps) {
  return (
    <section>
      <h2>Missing ingredients (3)</h2>
      {optionalIngredients.map(([name, amount]) => (
        <div className="missing-row" key={name}>
          <span>{name}</span>
          <small>{amount}</small>
          <i>Need</i>
        </div>
      ))}
      <button onClick={() => onNavigate("Grocery")}>
        <ShoppingBasket />
        Add missing to grocery
      </button>
    </section>
  );
}

function ServingAdjuster() {
  return (
    <section>
      <h2>Adjust servings</h2>
      <div className="serving-controls">
        <button>
          <Minus />
        </button>
        <span>
          4 <small>servings</small>
        </span>
        <button>
          <Plus />
        </button>
      </div>
      <div className="serving-calories">
        <span>
          <strong>520 cal</strong>
          <small>per serving</small>
        </span>
        <span>
          <strong>2,080 cal</strong>
          <small>total</small>
        </span>
      </div>
      <p>Nutrition updates automatically</p>
    </section>
  );
}

function MoreRecipes() {
  const recipes = [
    [screenImages.fish, "Ofada Rice with Ayamase Sauce", "35 min"],
    [screenImages.egusi, "Egusi Soup with Pounded Yam", "50 min"],
    [screenImages.suya, "Suya Spiced Beef Skewers", "30 min"],
  ];
  return (
    <section>
      <header className="more-title">
        <h2>More Nigerian recipes</h2>
        <button>View all</button>
      </header>
      {recipes.map(([image, title, time]) => (
        <article className="more-recipe" key={title}>
          <img src={image} />
          <div>
            <h3>{title}</h3>
            <p>{time} · Main course</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function ChefTip() {
  return (
    <section className="chef-tip">
      <img src={screenImages.moi} />
      <div>
        <h2>Chef Nmesoma’s tip</h2>
        <p>
          For smoky, flavorful jollof, let the rice steam on low heat without
          stirring. Patience gives you party-perfect rice!
        </p>
      </div>
    </section>
  );
}
