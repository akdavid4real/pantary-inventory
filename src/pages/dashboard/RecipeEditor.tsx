import { Plus, X } from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import {
  Field,
  PageHeading,
} from "../../components/dashboard/PageElements";
import { screenImages } from "../../features/dashboard/screenData";
import { ScreenProps } from "../../types/navigation";

export function RecipeEditor({ onNavigate }: ScreenProps) {
  const ingredients = [
    "Long-grain parboiled rice",
    "Chicken (mixed parts)",
    "Tomatoes",
    "Red bell peppers",
    "Onions",
    "Vegetable oil",
    "Tomato paste",
  ];
  return (
    <DashboardPageShell
      activePage="Explore"
      onNavigate={onNavigate}
      showToolbar
    >
      <PageHeading
        title="Create recipe"
        action={<button>Publish recipe</button>}
      />
      <div className="editor-grid">
        <section className="panel">
          <h2>Basic details</h2>
          <Field label="Recipe name" value="Jollof Rice with Grilled Chicken" />
          <Field
            label="Description"
            value="Smoky, spicy Jollof rice cooked in rich tomato sauce."
          />
          <div className="two-col">
            <Field label="Category" value="Main course" />
            <Field label="Region" value="Nigerian" />
          </div>
        </section>
        <section className="panel preview">
          <h2>Recipe preview</h2>
          <img src={screenImages.jollof} />
          <h3>Jollof Rice with Grilled Chicken</h3>
        </section>
        <section className="panel wide">
          <h2>Ingredients</h2>
          {ingredients.map((item, index) => (
            <div className="edit-row" key={item}>
              <span>{index + 1}</span>
              <input defaultValue={item} />
              <input defaultValue={index === 1 ? "800 g" : "2 cups"} />
              <button>
                <X />
              </button>
            </div>
          ))}
          <button>
            <Plus /> Add ingredient
          </button>
        </section>
        <section className="panel wide">
          <h2>Cooking steps</h2>
          {[
            "Season chicken and grill until cooked.",
            "Sauté onions until translucent.",
            "Add blended tomatoes and cook.",
          ].map((item, index) => (
            <div className="edit-row" key={item}>
              <span>{index + 1}</span>
              <input defaultValue={item} />
              <input defaultValue={`${5 + index * 10} min`} />
            </div>
          ))}
        </section>
      </div>
    </DashboardPageShell>
  );
}
