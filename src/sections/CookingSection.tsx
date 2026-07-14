import { ChefHat, ListChecks, ScanLine, Timer } from "lucide-react";
import { assets } from "../data/assets";

export function CookingSection() {
  return (
    <section id="cook" className="cook-pin">
      <div className="cook-image-mask">
        <img
          src={assets.cooking}
          alt="Chef Sahmmy preparing fresh vegetables in a warm modern kitchen"
        />
        <div className="cook-overlay">
          <ChefHat size={40} />
          <h2>Cooking mode keeps the counter clear.</h2>
          <p>Readable prep steps, timers, and pantry sync stay visible while your hands are busy.</p>
          <div className="cooking-tools">
            <span><Timer size={18} /> Timers</span>
            <span><ListChecks size={18} /> Steps</span>
            <span><ScanLine size={18} /> Sync</span>
          </div>
        </div>
      </div>
    </section>
  );
}

