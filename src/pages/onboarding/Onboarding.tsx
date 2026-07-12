import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Clock3,
  CookingPot,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBasket,
} from "lucide-react";
import { useState } from "react";
import onboardingBackground from "../../../assets/auth/onboarding-food-background.png";
import rice from "../../../assets/ingredients/01-long-grain-rice.png";
import beans from "../../../assets/ingredients/02-brown-beans.png";
import garri from "../../../assets/ingredients/06-garri.png";
import yam from "../../../assets/ingredients/04-yam-tuber.png";
import plantain from "../../../assets/ingredients/07-plantain.png";
import tomatoes from "../../../assets/ingredients/17-fresh-tomatoes.png";
import onions from "../../../assets/ingredients/20-onions.png";
import pepper from "../../../assets/ingredients/19-scotch-bonnet-peppers.png";
import egusi from "../../../assets/ingredients/12-egusi-seeds.png";
import oil from "../../../assets/ingredients/16-palm-oil.png";
import crayfish from "../../../assets/ingredients/28-crayfish.png";
import stockfish from "../../../assets/ingredients/29-stockfish.png";
import chicken from "../../../assets/foods/26-chicken-suya.png";
import eggs from "../../../assets/foods/33-akara.png";
import ugu from "../../../assets/ingredients/22-ugu-leaves.png";
import jollof from "../../../assets/foods/01-nigerian-jollof-rice.png";
import egusiMeal from "../../../assets/foods/09-egusi-soup.png";
import moi from "../../../assets/foods/32-moi-moi.png";
import suya from "../../../assets/foods/27-beef-suya.png";
import beansMeal from "../../../assets/foods/07-nigerian-beans-porridge.png";
import stew from "../../../assets/foods/19-nigerian-tomato-stew.png";
import { Brand } from "../../components/Brand";
import { ScreenProps } from "../../types/navigation";

const pantryItems = [
  ["Rice", rice],
  ["Garri", garri],
  ["Beans", beans],
  ["Yam", yam],
  ["Plantain", plantain],
  ["Tomatoes", tomatoes],
  ["Onions", onions],
  ["Pepper", pepper],
  ["Egusi seeds", egusi],
  ["Palm oil", oil],
  ["Crayfish", crayfish],
  ["Stockfish", stockfish],
  ["Chicken", chicken],
  ["Eggs", eggs],
  ["Spinach/Ugu", ugu],
] as const;

export function Onboarding({
  step,
  onNavigate,
}: ScreenProps & { step: number }) {
  const [diet, setDiet] = useState("Omnivore");
  const [minutes, setMinutes] = useState("45 min");
  const [comfort, setComfort] = useState("Comfortable");
  const [servings, setServings] = useState(2);
  const [selected, setSelected] = useState<string[]>([
    "Rice",
    "Garri",
    "Beans",
    "Yam",
    "Plantain",
    "Pepper",
    "Egusi seeds",
    "Palm oil",
    "Crayfish",
    "Eggs",
  ]);
  const next = () => onNavigate(step === 4 ? "Home" : `onboarding-${step + 1}`);
  const back = () =>
    onNavigate(step === 1 ? "sign-up" : `onboarding-${step - 1}`);
  if (step === 1)
    return <WelcomeStep onNext={next} onSkip={() => onNavigate("Home")} />;
  return (
    <main className="onboarding-flow">
      <header className="onboarding-top">
        <Brand />
        <Progress step={step} />
        <span>{step} of 4</span>
      </header>
      {step === 2 ? (
        <>
          <div className="onboarding-heading">
            <h1>What do you enjoy eating, AK DAVID?</h1>
            <p>We’ll tailor recipes to your tastes and needs.</p>
          </div>
          <section className="preference-layout">
            <div>
              <h2>Dietary preference</h2>
              <div className="diet-grid">
                {[
                  "Omnivore",
                  "Vegetarian",
                  "Vegan",
                  "Pescatarian",
                  "Halal",
                ].map((item) => (
                  <button
                    className={diet === item ? "selected" : ""}
                    onClick={() => setDiet(item)}
                    key={item}
                  >
                    <span>
                      {item === "Omnivore"
                        ? "🍴"
                        : item === "Pescatarian"
                          ? "🐟"
                          : "🌿"}
                    </span>
                    {item}
                    {diet === item && <Check />}
                  </button>
                ))}
              </div>
              <label className="nigerian-toggle">
                <span>
                  <b>Prioritize Nigerian meals</b>
                  <small>We’ll show more Nigerian recipes in your plan.</small>
                </span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
            <div className="meal-sampler">
              {[
                [jollof, "Jollof Rice"],
                [egusiMeal, "Egusi Soup"],
                [moi, "Moi Moi"],
                [suya, "Suya-Style Beef"],
                [beansMeal, "Beans & Plantain"],
                [stew, "Vegetable Stew"],
              ].map(([image, title]) => (
                <figure key={title}>
                  <img src={image} />
                  <figcaption>{title}</figcaption>
                </figure>
              ))}
            </div>
          </section>
          <section className="preference-tags">
            <h2>Allergies</h2>
            <div>
              {["Peanuts", "Shellfish", "Dairy", "Eggs", "Gluten", "Soy"].map(
                (item) => (
                  <button key={item}>{item} ×</button>
                ),
              )}
              <button>＋ Add another</button>
            </div>
            <h2>Avoided ingredients</h2>
            <div>
              {["Mushrooms", "Cilantro", "Okra", "Offal"].map((item) => (
                <button key={item}>{item} ×</button>
              ))}
              <button>＋ Search or add ingredient</button>
            </div>
          </section>
        </>
      ) : step === 3 ? (
        <>
          <div className="onboarding-heading centered">
            <h1>How do you like to cook, AK DAVID?</h1>
            <p>Set practical goals—we’ll keep recommendations realistic.</p>
          </div>
          <section className="cooking-preferences">
            <div className="onboard-panel">
              <h2>Cooking style</h2>
              <label>Maximum cooking time</label>
              <div className="segmented">
                {["15 min", "30 min", "45 min", "60+ min"].map((item) => (
                  <button
                    className={minutes === item ? "selected" : ""}
                    onClick={() => setMinutes(item)}
                    key={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <label>Skill comfort</label>
              <div className="segmented">
                {["Easy", "Comfortable", "Adventurous"].map((item) => (
                  <button
                    className={comfort === item ? "selected" : ""}
                    onClick={() => setComfort(item)}
                    key={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="servings">
                <span>Servings</span>
                <button onClick={() => setServings(Math.max(1, servings - 1))}>
                  <Minus />
                </button>
                <b>{servings}</b>
                <button onClick={() => setServings(servings + 1)}>
                  <Plus />
                </button>
              </div>
              <h3>Nigerian meal examples by time</h3>
              {[
                [yam, "Egg stew & yam", "20 min"],
                [jollof, "Jollof rice", "45 min"],
                [onboardingBackground, "Grilled fish & plantain", "35 min"],
              ].map(([image, title, time]) => (
                <div className="meal-time" key={title}>
                  <img src={image} />
                  <span>{title}</span>
                  <b>{time}</b>
                </div>
              ))}
            </div>
            <div className="onboard-panel nutrition-goals">
              <h2>
                Daily nutrition goals <small>Optional</small>
              </h2>
              {[
                ["Calories", "2,000", "kcal"],
                ["Protein", "120", "g"],
                ["Carbs", "230", "g"],
                ["Fat", "65", "g"],
              ].map(([label, value, unit]) => (
                <label key={label}>
                  <span>{label}</span>
                  <input defaultValue={value} />
                  <b>{unit}</b>
                </label>
              ))}
              <div className="macro-chart">
                <strong>
                  2,000<small>kcal</small>
                </strong>
              </div>
              <button>↻ &nbsp; Use recommended goals</button>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="onboarding-heading pantry-heading">
            <small>4 of 4</small>
            <h1>What’s in your pantry, AK DAVID?</h1>
            <p>Add a few ingredients so we can recommend your first meals.</p>
          </div>
          <section className="pantry-builder">
            <div>
              <input
                className="pantry-search"
                placeholder="⌕  Search ingredients"
              />
              <div className="category-tabs">
                <button className="selected">Staples</button>
                <button>Proteins</button>
                <button>Vegetables</button>
                <button>Spices</button>
                <button>Fridge</button>
              </div>
              <div className="ingredient-grid">
                {pantryItems.map(([name, image]) => {
                  const active = selected.includes(name);
                  return (
                    <button
                      className={active ? "selected" : ""}
                      onClick={() =>
                        setSelected(
                          active
                            ? selected.filter((item) => item !== name)
                            : [...selected, name],
                        )
                      }
                      key={name}
                    >
                      <img src={image} />
                      <span>{name}</span>
                      {active && <Check />}
                    </button>
                  );
                })}
              </div>
            </div>
            <aside>
              <h2>Your starter pantry</h2>
              <p>{selected.length} items selected</p>
              {selected.slice(0, 8).map((name) => {
                const image = pantryItems.find((item) => item[0] === name)?.[1];
                return (
                  <div key={name}>
                    <img src={image} />
                    <span>{name}</span>
                    <input defaultValue="1" />
                    <select>
                      <option>kg</option>
                      <option>pcs</option>
                      <option>g</option>
                    </select>
                    <button
                      onClick={() =>
                        setSelected(selected.filter((item) => item !== name))
                      }
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </aside>
          </section>
        </>
      )}
      <footer className="onboarding-actions">
        <button onClick={back}>
          <ArrowLeft /> Back
        </button>
        <button className="skip" onClick={() => onNavigate("Home")}>
          Skip for now
        </button>
        <button className="primary" onClick={next}>
          {step === 4 ? "Create my meal plan" : "Continue"}
          <ArrowRight />
        </button>
      </footer>
    </main>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flow-progress">
      {[1, 2, 3, 4].map((item) => (
        <span
          className={item < step ? "done" : item === step ? "active" : ""}
          key={item}
        >
          {item < step ? <Check /> : item}
        </span>
      ))}
    </div>
  );
}
function WelcomeStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <main className="onboarding-welcome">
      <section style={{ backgroundImage: `url(${onboardingBackground})` }}>
        <Brand inverse />
        <div>
          <i />
          <h1>
            Nigerian meals.
            <br />
            <em>Made simple, made yours.</em>
          </h1>
          <p>
            From jollof to egusi, Pantry-to-Plate helps you cook with what you
            have, honour your traditions, and make every meal count.
          </p>
        </div>
      </section>
      <section>
        <div>
          <h1>Welcome, AK DAVID</h1>
          <p>Let’s turn what you have into meals you’ll love.</p>
          <i />
          {[
            [
              CookingPot,
              "Use what’s already in your pantry",
              "Add your ingredients and let us help you make the most of what you have.",
            ],
            [
              ChefHat,
              "Plan delicious meals faster",
              "Get tailored meal ideas and cooking guidance in minutes.",
            ],
            [
              ShoppingBasket,
              "Waste less and shop smarter",
              "Avoid duplicates, use ingredients on time, and save money.",
            ],
          ].map(([Icon, title, copy]) => (
            <article key={String(title)}>
              <span>
                <Icon />
              </span>
              <div>
                <h2>{String(title)}</h2>
                <p>{String(copy)}</p>
              </div>
            </article>
          ))}
          <div className="welcome-dots">
            <b /> ○ ○ ○ <span>1 of 4</span>
          </div>
          <button className="primary" onClick={onNext}>
            Let’s get started <ArrowRight />
          </button>
          <button onClick={onSkip}>I’ll do this later</button>
          <small>
            <ShieldCheck /> You can change everything later in Settings.
          </small>
        </div>
      </section>
    </main>
  );
}
