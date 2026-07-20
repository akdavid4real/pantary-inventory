import { ChefHat, Heart, Sparkles } from "lucide-react";
import { assets } from "../data/assets";

export function ChefFavourSection() {
  return (
    <section className="chef-story chef-story--favour" aria-labelledby="chef-favour-title">
      <div className="chef-story-scene scene-card">
        <img
          src={assets.chefFavour}
          alt="Chef Favour cooking in a warm kitchen with fresh Nigerian ingredients"
          loading="lazy"
          decoding="async"
        />
        <div className="chef-story-shade" aria-hidden="true" />
        <div className="chef-story-copy">
          <span className="chef-story-kicker">
            <ChefHat size={18} /> From the kitchen
          </span>
          <h2 id="chef-favour-title">Meet Chef Favour.</h2>
          <p>
            Familiar ingredients can become something memorable. Start with what is already at
            home, add a little care, and bring a nourishing Nigerian meal to the table.
          </p>
          <div className="chef-story-notes" aria-label="Chef Favour's cooking values">
            <span><Sparkles size={16} /> Make everyday food special</span>
            <span><Heart size={16} /> Cook with care</span>
          </div>
        </div>
      </div>
    </section>
  );
}
