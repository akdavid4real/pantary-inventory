import { Check } from "lucide-react";
import { useState } from "react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import {
  Field,
  PageHeading,
} from "../../components/dashboard/PageElements";
import { screenImages } from "../../features/dashboard/screenData";
import { ScreenProps } from "../../types/navigation";

export function Settings({ onNavigate }: ScreenProps) {
  const [saved, setSaved] = useState(false);
  return (
    <DashboardPageShell
      activePage="Settings"
      onNavigate={onNavigate}
      showToolbar
    >
      <PageHeading
        title="Settings"
        subtitle="Make Pantry-to-Plate work the way you do."
        action={
          <button onClick={() => setSaved(true)}>
            {saved ? <Check /> : null}
            {saved ? "Changes saved" : "Save changes"}
          </button>
        }
      />
      <div className="settings-grid">
        <section className="panel">
          <h2>Profile & account</h2>
          <div className="profile-row">
            <img src={screenImages.suya} />
            <div>
              <Field label="Display name" value="Alex Morgan" />
              <Field label="Email" value="alex@example.com" />
              <Field label="Phone" value="+234 801 234 5678" />
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Food preferences</h2>
          <Field label="Dietary preference" value="Omnivore" />
          <div className="tag-row">
            <span>Peanuts ×</span>
            <span>Shellfish ×</span>
            <span>Mushrooms ×</span>
          </div>
        </section>
        <section className="panel">
          <h2>Nutrition goals</h2>
          <div className="goal">
            <div className="donut">
              <span>2,000</span>
            </div>
            <div>
              <Field label="Protein" value="120 g" />
              <Field label="Carbs" value="230 g" />
              <Field label="Fat" value="65 g" />
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Notifications</h2>
          {[
            "Email notifications",
            "Push notifications",
            "Meal-plan reminders",
            "Grocery reminders",
            "Expiry alerts",
            "Weekly insights",
          ].map((label) => (
            <Toggle label={label} key={label} />
          ))}
        </section>
        <section className="panel">
          <h2>Security</h2>
          <Field label="Current password" value="••••••••" />
          <Field label="New password" value="••••••••" />
          <button>Update password</button>
        </section>
        <section className="panel">
          <h2>Data & privacy</h2>
          <p>
            Download a copy of your meals, pantry items, preferences and
            activity history.
          </p>
          <button>Export my data</button>
        </section>
      </div>
    </DashboardPageShell>
  );
}
function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <button className="toggle-row" onClick={() => setOn(!on)}>
      <span>{label}</span>
      <i className={on ? "on" : ""}>
        <b />
      </i>
    </button>
  );
}
