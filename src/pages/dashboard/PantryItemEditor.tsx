import { X } from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { Field } from "../../components/dashboard/PageElements";
import { ScreenProps } from "../../types/navigation";

export function PantryItemEditor({ onNavigate }: ScreenProps) {
  return (
    <DashboardPageShell
      activePage="Pantry"
      onNavigate={onNavigate}
      showToolbar
    >
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-head">
            <h1>Add pantry item</h1>
            <button onClick={() => onNavigate("Pantry")}>
              <X />
            </button>
          </div>
          <Field label="Ingredient" value="Spinach" />
          <div className="two-col">
            <Field label="Quantity" value="250 g" />
            <Field label="Unit" value="grams" />
            <Field label="Storage location" value="Fridge" />
            <Field label="Expiry date" value="Jul 24, 2026" />
          </div>
          <Field label="Low-stock threshold" value="100 g" />
          <label className="field">
            <span>Notes</span>
            <textarea defaultValue="Baby spinach, keep dry." />
          </label>
          <h3>Quick storage</h3>
          <div className="storage-row">
            {["Pantry", "Fridge", "Freezer", "Counter"].map((item) => (
              <button key={item}>{item}</button>
            ))}
          </div>
          <div className="modal-actions">
            <button onClick={() => onNavigate("Pantry")}>Cancel</button>
            <button onClick={() => onNavigate("Pantry")}>Add to pantry</button>
          </div>
        </div>
      </div>
    </DashboardPageShell>
  );
}
