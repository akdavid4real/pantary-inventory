import { ChefHat, Leaf, Sparkles } from "lucide-react";
import { assets } from "../data/assets";

export function ChefStorySection() {
  return (
    <section className="chef-story" aria-labelledby="chef-story-title">
      <div className="chef-story-scene scene-card">
        <img
          src={assets.chefSahmmy}
          alt="Chef Sahmmy standing in a warm modern kitchen surrounded by fresh ingredients"
        />
        <div className="chef-story-shade" aria-hidden="true" />
        <div className="chef-story-copy">
          <span className="chef-story-kicker">
            <ChefHat size={18} /> From the kitchen
          </span>
          <h2 id="chef-story-title">Meet Chef Sahmmy.</h2>
          <p>
            Good meals do not start with a perfect pantry. They start with knowing what you have,
            choosing what feels right, and cooking with confidence.
          </p>
          <div className="chef-story-notes" aria-label="Pantry-to-Plate cooking values">
            <span><Sparkles size={16} /> Cook with confidence</span>
            <span><Leaf size={16} /> Waste less</span>
          </div>
        </div>
      </div>
    </section>
  );
}
