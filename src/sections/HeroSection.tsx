import { ArrowRight } from "lucide-react";
import { SplitText } from "../components/SplitText";
import { assets } from "../data/assets";

function KineticLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="kinetic-label">
      <span>{children}</span>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="hero" id="top">
      <div className="hero-stage">
        <div className="hero-copy">
          <h1 className="hero-title">
            <SplitText text="From" className="title-line" />
            <SplitText text="pantry" className="title-line" />
            <SplitText text="to plate." className="title-line" />
          </h1>
          <div className="hero-tag">
            <SplitText text="Smart meal planning for real ingredients." by="words" />
          </div>
          <p className="reveal-up">
            Pantry-to-Plate turns everyday ingredients into nourishing meal plans, sharper grocery
            lists, and calmer weeknight cooking.
          </p>
          <a className="primary-cta reveal-up" href="#features">
            Start planning <ArrowRight size={18} />
          </a>
        </div>

        <div className="hero-visual" aria-label="Nigerian jollof rice with grilled chicken">
          <div className="spin-ring">better food / better planning / better you</div>
          <img
            className="hero-plate"
            src={assets.hero}
            alt="Nigerian jollof rice served with grilled chicken and plantain"
            width={1254}
            height={1254}
            decoding="async"
          />
          <KineticLabel>Real ingredients</KineticLabel>
          <div className="float-chip float-chip--one">24 pantry items</div>
          <div className="float-chip float-chip--two">25 min dinner</div>
        </div>
      </div>
    </section>
  );
}
