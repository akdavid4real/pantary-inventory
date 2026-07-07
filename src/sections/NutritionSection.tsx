import { BarChart3, Leaf } from "lucide-react";
import { nutritionCards } from "../data/content";

export function NutritionSection() {
  return (
    <section id="nutrition" className="nutrition-stage">
      <div className="nutrition-copy scene-card">
        <BarChart3 size={36} />
        <h2>Nutrition, without killing the appetite.</h2>
        <p>
          Clear macro cues and meal balance cards sit beside the recipe, so the food still feels
          like food.
        </p>
      </div>
      <div className="nutrition-cards">
        {nutritionCards.map(([value, label]) => (
          <article className="nutrition-card scene-card" key={label}>
            <Leaf size={22} />
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

