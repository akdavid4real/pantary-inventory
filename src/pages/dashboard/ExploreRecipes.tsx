import {
  BarChart3,
  ChefHat,
  Clock3,
  Grid2X2,
  Heart,
  Leaf,
  Lightbulb,
  List,
  Search,
  ShoppingBasket,
  Users,
} from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { PageHeading } from "../../components/dashboard/PageElements";
import { recipeCards } from "../../features/dashboard/screenData";
import { ScreenProps } from "../../types/navigation";
import "./ExploreRecipes.css";

const filters = [
  "Nigerian",
  "Pantry-perfect",
  "Under 30 min",
  "Vegetarian",
  "High protein",
];

export function ExploreRecipes({ onNavigate }: ScreenProps) {
  return (
    <DashboardPageShell
      activePage="Explore"
      onNavigate={onNavigate}
      showToolbar
    >
      <div className="explore-page">
        <PageHeading
          title="Explore recipes"
          subtitle="Discover meals that match your pantry and taste."
        />

        <div className="explore-toolbar">
          <label className="explore-search">
            <Search size={18} />
            <input placeholder="Search recipes" />
          </label>
          {["All categories", "All regions", "All ingredients", "Sort by"].map(
            (item) => (
              <button key={item}>{item}⌄</button>
            ),
          )}
          <div className="view-switch" aria-label="Recipe view">
            <button className="active" aria-label="Grid view">
              <Grid2X2 />
            </button>
            <button aria-label="List view">
              <List />
            </button>
          </div>
        </div>

        <div className="explore-filters">
          <div>
            {filters.map((item) => (
              <span key={item}>{item} ×</span>
            ))}
          </div>
          <button>Clear all</button>
        </div>

        <div className="explore-layout">
          <section className="explore-results">
            <FeaturedRecipe onNavigate={onNavigate} />
            <div className="explore-card-grid">
              {recipeCards.slice(1).map((recipe, index) => (
                <article className="explore-recipe-card" key={recipe.title}>
                  <div className="recipe-image-wrap">
                    <img src={recipe.image} alt="" />
                    <button aria-label={`Favorite ${recipe.title}`}>
                      <Heart fill={index % 2 === 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="recipe-card-copy">
                    <h2>{recipe.title}</h2>
                    <p>Main · Nigerian</p>
                    <div className="recipe-facts">
                      <span>
                        <Clock3 />
                        {30 + index * 5} min
                      </span>
                      <span>
                        <BarChart3 />
                        {index % 2 ? "Easy" : "Medium"}
                      </span>
                      <span>
                        <Users />
                        {2 + index} servings
                      </span>
                    </div>
                    <div className="match-line">
                      <Leaf />
                      {recipe.match}% Pantry match
                    </div>
                    <div className="card-footer">
                      <div>
                        <span>{index % 2 ? "Vegetarian" : "High protein"}</span>
                        <span>{index % 2 ? "High fiber" : "Gluten-free"}</span>
                      </div>
                      <button onClick={() => onNavigate("recipe-details")}>
                        View recipe
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="explore-sidebar">
            <RecommendationPanel />
            <IngredientsPanel onNavigate={onNavigate} />
            <TagsPanel />
            <Pagination />
          </aside>
        </div>
      </div>
    </DashboardPageShell>
  );
}

function FeaturedRecipe({ onNavigate }: ScreenProps) {
  const recipe = recipeCards[0];
  return (
    <article className="featured-recipe">
      <div className="featured-image">
        <img src={recipe.image} alt="Jollof rice with grilled chicken" />
        <button aria-label="Favorite recipe">
          <Heart />
        </button>
      </div>
      <div className="featured-copy">
        <small>NIGERIAN CLASSIC</small>
        <h2>{recipe.title}</h2>
        <p className="featured-category">Main · Nigerian</p>
        <p>
          Smoky, flavorful jollof rice cooked in rich tomato and pepper sauce,
          served with juicy grilled chicken.
        </p>
        <div className="featured-facts">
          <span>
            <Leaf />
            94%<small>Pantry match</small>
          </span>
          <span>
            <Clock3 />
            40 min<small>Total time</small>
          </span>
          <span>
            <BarChart3 />
            Medium<small>Difficulty</small>
          </span>
          <span>
            <Users />4<small>Servings</small>
          </span>
        </div>
        <div className="nutrition-chips">
          <span>
            620<small>Calories</small>
          </span>
          <span>
            32 g<small>Protein</small>
          </span>
          <span>
            78 g<small>Carbs</small>
          </span>
          <span>
            22 g<small>Fat</small>
          </span>
          <span>
            5 g<small>Fiber</small>
          </span>
        </div>
        <div className="featured-actions">
          <button onClick={() => onNavigate("recipe-details")}>
            View recipe
          </button>
          <button>
            <ChefHat />
            Plan meal
          </button>
        </div>
      </div>
    </article>
  );
}

function RecommendationPanel() {
  return (
    <section>
      <h3>
        <Lightbulb />
        Recommended for Alex
      </h3>
      <p>Recipes that fit your pantry, preferences and goals.</p>
      <ul>
        <li>
          <ShoppingBasket />
          High pantry match
        </li>
        <li>
          <Clock3 />
          Quick & easy meals
        </li>
        <li>
          <Leaf />
          High protein options
        </li>
        <li>
          <ChefHat />
          Nigerian favorites
        </li>
      </ul>
    </section>
  );
}

function IngredientsPanel({ onNavigate }: ScreenProps) {
  return (
    <section>
      <div className="aside-title">
        <h3>Available ingredients</h3>
        <span>32 of 48 items</span>
      </div>
      <div className="ingredient-progress">
        <i />
      </div>
      <div className="ingredient-counts">
        <span>
          18<small>Proteins</small>
        </span>
        <span>
          7<small>Grains</small>
        </span>
        <span>
          5<small>Vegetables</small>
        </span>
        <span>
          2<small>Oils & spices</small>
        </span>
      </div>
      <button className="aside-link" onClick={() => onNavigate("Pantry")}>
        View pantry ›
      </button>
    </section>
  );
}

function TagsPanel() {
  return (
    <section>
      <h3>Popular Nigerian tags</h3>
      <div className="popular-tags">
        {[
          "Nigerian classics",
          "Soups",
          "Rice dishes",
          "Plantain",
          "Beans",
          "Pepper soup",
          "Street food",
          "Seafood",
          "Stews",
          "Breakfast",
          "Party food",
          "One-pot meals",
        ].map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <button className="aside-link">View all tags ›</button>
    </section>
  );
}

function Pagination() {
  return (
    <section className="explore-pagination">
      <p>Showing 1–6 of 72 recipes</p>
      <div>
        {[1, 2, 3, 4, 5].map((page) => (
          <button className={page === 1 ? "active" : ""} key={page}>
            {page}
          </button>
        ))}
        <button>›</button>
      </div>
    </section>
  );
}
