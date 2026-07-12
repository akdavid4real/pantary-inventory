import { Bell, Clock3, Leaf } from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { PageHeading } from "../../components/dashboard/PageElements";
import { ScreenProps } from "../../types/navigation";

const notices = [
  "Spinach expires in 2 days",
  "Rice is running low",
  "Dinner is planned for 6:30 PM",
  "9 items still need to be bought",
  "Your weekly insights are ready",
  "Pantry updated after cooking",
];
export function Notifications({ onNavigate }: ScreenProps) {
  return (
    <DashboardPageShell
      activePage="Settings"
      onNavigate={onNavigate}
      showToolbar
    >
      <PageHeading
        title="Notifications"
        subtitle="Updates from your pantry, plans, and grocery list."
        action={<button>Mark all as read</button>}
      />
      <div className="tag-row">
        {["All", "Unread 5", "Pantry", "Meals", "Grocery", "Insights"].map(
          (item) => (
            <span key={item}>{item}</span>
          ),
        )}
      </div>
      <section className="notification-list">
        {notices.map((notice, index) => (
          <article key={notice}>
            <span className="notice-icon">
              {index < 2 ? <Leaf /> : index === 2 ? <Clock3 /> : <Bell />}
            </span>
            <div>
              <b>{notice}</b>
              <p>
                {index < 2
                  ? "Plan a meal or add it to your grocery list."
                  : "Your Pantry-to-Plate update is ready."}
              </p>
            </div>
            <small>{index < 3 ? "Today" : "Yesterday"}</small>
            <button>View</button>
          </article>
        ))}
      </section>
    </DashboardPageShell>
  );
}
