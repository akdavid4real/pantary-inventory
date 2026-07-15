import type { CSSProperties, RefObject } from "react";
import { featureSlides } from "../data/content";

type FeatureRailSectionProps = {
  horizontalRef: RefObject<HTMLDivElement | null>;
};

export function FeatureRailSection({ horizontalRef }: FeatureRailSectionProps) {
  return (
    <section id="features" className="feature-rail-section" aria-label="Pantry-to-Plate feature rail">
      <div className="rail-title-row">
        <span>Scan</span>
        <span>Plan</span>
        <span>Shop</span>
        <span>Cook</span>
      </div>
      <div className="feature-rail" ref={horizontalRef}>
        {featureSlides.map((slide, index) => (
          <article
            className="feature-slide scene-card"
            key={slide.id}
            style={{ "--rotate": slide.rotation } as CSSProperties}
          >
            <div className="slide-count">0{index + 1}</div>
            <img src={slide.image} alt={slide.alt} loading="lazy" decoding="async" />
            <div className="slide-content">
              <p>{slide.kicker}</p>
              <h3>{slide.title}</h3>
              <span>{slide.copy}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

