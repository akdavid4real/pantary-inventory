import { CalendarDays, Sparkles } from "lucide-react";
import { assets } from "../data/assets";

export function FooterSection() {
  return (
    <footer className="footer-scene">
      <div className="footer-marquee" aria-hidden="true">
        <span>Better planning. Better food. Better you.</span>
        <span>Better planning. Better food. Better you.</span>
      </div>
      <div className="footer-orbit" aria-hidden="true">
        <img src={assets.herbs} alt="" />
        <img src={assets.recipe} alt="" />
        <img src={assets.pantry} alt="" />
      </div>
      <div className="closing-cta">
        <Sparkles size={34} />
        <h2>Better planning. Better food. Better you.</h2>
        <p>Bring pantry awareness, recipe inspiration, grocery clarity, and cooking confidence into one meal-planning ecosystem.</p>
        <a className="primary-cta" href="#top">
          Plan your first meal <CalendarDays size={18} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>Pantry-to-Plate</span>
        <p>Smart meal planning for real ingredients.</p>
      </div>
    </footer>
  );
}
