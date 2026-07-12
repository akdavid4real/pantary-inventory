import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Play,
  Timer,
  X,
} from "lucide-react";
import { useState } from "react";
import { cookingSteps, screenImages } from "../../features/dashboard/screenData";
import { ScreenProps } from "../../types/navigation";

export function CookingMode({ onNavigate }: ScreenProps) {
  const [step, setStep] = useState(2);
  return (
    <div className="cooking">
      <header>
        <b>Pantry-to-Plate</b>
        <h2>Jollof Rice with Grilled Chicken</h2>
        <button onClick={() => onNavigate("recipe-details")}>
          <X />
          Exit cooking
        </button>
        <span>Step {step + 1} of 7</span>
      </header>
      <div className="cook-grid">
        <aside>
          {cookingSteps.map((item, index) => (
            <button
              className={index === step ? "active" : ""}
              onClick={() => setStep(index)}
              key={item}
            >
              <span>{index + 1}</span>
              <b>{item}</b>
              <small>{5 + index * 3} min</small>
            </button>
          ))}
        </aside>
        <main>
          <h1>{cookingSteps[step]}</h1>
          <p>
            <Clock3 /> {5 + step * 3} min
          </p>
          <p>
            Blend tomatoes, red bell peppers, scotch bonnet peppers, and half of
            the onions until smooth.
          </p>
          <img src={step % 2 ? screenImages.jollof : screenImages.egusi} />
          <div className="timer-actions">
            <button>
              <Play />
              Start timer
            </button>
            <button>
              <Timer />
              Pause
            </button>
          </div>
        </main>
        <section className="panel">
          <h3>Ingredients for this step</h3>
          {[
            "Tomatoes",
            "Red bell pepper",
            "Scotch bonnet peppers",
            "Red onion",
          ].map((item) => (
            <div className="ingredient" key={item}>
              <Check />
              <span>{item}</span>
              <b>Have</b>
            </div>
          ))}
          <section className="panel info-card">
            <h3>Chef Nmesoma's tip</h3>
            <p>
              Blend until completely smooth for a rich, well-balanced sauce
              base.
            </p>
          </section>
        </section>
      </div>
      <footer>
        <button
          disabled={step === 0}
          onClick={() => setStep((value) => value - 1)}
        >
          <ArrowLeft />
          Previous step
        </button>
        <button onClick={() => setStep((value) => Math.min(6, value + 1))}>
          Next step
          <ArrowRight />
        </button>
      </footer>
    </div>
  );
}
