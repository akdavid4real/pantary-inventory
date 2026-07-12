import { Check, ShoppingBasket, X } from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { Field } from "../../components/dashboard/PageElements";
import { ScreenProps } from "../../types/navigation";

export function ShoppingListGenerator({ onNavigate }: ScreenProps) {
  const items = [
    "Tomatoes — 6 pieces",
    "Spinach — 250 g",
    "Greek yogurt — 500 g",
    "Quinoa — 500 g",
    "Salmon fillets — 4",
  ];
  return (
    <DashboardPageShell
      activePage="Grocery"
      onNavigate={onNavigate}
      showToolbar
    >
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-head">
            <h1>Generate shopping list</h1>
            <button onClick={() => onNavigate("Grocery")}>
              <X />
            </button>
          </div>
          <div className="progress-steps">
            <b>1 Source</b>
            <b>2 Review items</b>
            <b>3 Create list</b>
          </div>
          <div className="shopping-columns">
            <section>
              <h3>Choose source</h3>
              <button className="source-active">
                <Check />
                From meal plan
              </button>
              <button>From a recipe</button>
            </section>
            <section>
              <h3>Review missing items</h3>
              {items.map((item) => (
                <div className="shopping-item" key={item}>
                  <Check />
                  <span>{item}</span>
                </div>
              ))}
            </section>
            <section>
              <h3>Create list</h3>
              <Field
                label="List title"
                value="Weekly meal plan shopping list"
              />
              <div className="ready">
                <ShoppingBasket />
                <h2>Your list is ready</h2>
                <p>13 items are ready to be added.</p>
              </div>
            </section>
          </div>
          <div className="modal-actions">
            <button onClick={() => onNavigate("Grocery")}>Cancel</button>
            <button onClick={() => onNavigate("Grocery")}>
              Create shopping list
            </button>
          </div>
        </div>
      </div>
    </DashboardPageShell>
  );
}
