import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Leaf,
  ShoppingBasket,
  Star,
  Target,
  Wheat,
} from "lucide-react";
import matchOne from "../../../assets/asset_5.png";
import matchTwo from "../../../assets/asset_7.png";
import matchThree from "../../../assets/asset_6.png";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { ScreenProps } from "../../types/navigation";

const week = [
  { day: "Mon", calories: 1120, meals: 1 },
  { day: "Tue", calories: 1060, meals: 2 },
  { day: "Wed", calories: 1020, meals: 3 },
  { day: "Thu", calories: 1090, meals: 2 },
  { day: "Fri", calories: 1160, meals: 2 },
  { day: "Sat", calories: 1010, meals: 1 },
  { day: "Sun", calories: 1080, meals: 1 },
];

export function Analytics({ onNavigate }: ScreenProps) {
  return (
    <DashboardPageShell
      activePage="Analytics"
      onNavigate={onNavigate}
      showToolbar
      rootClassName="app-shell--analytics"
    >
      <div className="insights-page">
        <header className="insights-heading">
          <div>
            <h1>Your insights</h1>
            <p>See how your pantry and meal plans are working together.</p>
          </div>
          <div className="week-picker">
            <button aria-label="Previous week">
              <ChevronLeft />
            </button>
            <button>
              <CalendarDays />
              Jul 20–26, 2026⌄
            </button>
            <button aria-label="Next week">
              <ChevronRight />
            </button>
          </div>
        </header>

        <section className="insight-kpis">
          <Kpi
            icon={<CalendarDays />}
            value="12"
            label="Meals planned"
            tone="green"
          />
          <Kpi
            icon={<Flame />}
            value="8,450"
            label="Weekly calories"
            tone="orange"
          />
          <Kpi
            icon={<ShoppingBasket />}
            value="24"
            label="Pantry items"
            tone="green"
          />
          <Kpi
            icon={<Target />}
            value="92%"
            label="Avg. pantry match"
            tone="green"
          />
        </section>

        <div className="insights-top-grid">
          <section className="insight-card weekly-card">
            <div className="card-title-row">
              <h2>Weekly nutrition</h2>
              <div className="metric-tabs">
                <button className="active">Calories</button>
                <button>Protein</button>
                <button>Carbs</button>
                <button>Fat</button>
              </div>
            </div>
            <div className="nutrition-chart">
              <div className="axis">
                <span>1,500</span>
                <span>1,000</span>
                <span>500</span>
                <span>0</span>
              </div>
              <div className="chart-bars">
                {week.map((item, index) => (
                  <div className="bar-column" key={item.day}>
                    {index === 2 ? (
                      <span className="chart-tip">
                        Wednesday
                        <br />
                        <b>1,320 kcal</b>
                      </span>
                    ) : null}
                    <i
                      className={index === 2 ? "selected" : ""}
                      style={{ height: `${item.calories / 8}px` }}
                    />
                    <span>{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="nutrition-totals">
              <MiniStat
                icon={<Flame />}
                value="8,450 kcal"
                label="Total calories"
              />
              <MiniStat icon={<Leaf />} value="312 g" label="Total protein" />
              <MiniStat icon={<Wheat />} value="980 g" label="Total carbs" />
              <MiniStat icon={<Flame />} value="276 g" label="Total fat" />
            </div>
          </section>

          <section className="insight-card macro-card">
            <h2>Macro balance</h2>
            <div className="macro-body">
              <div className="macro-donut" />
              <ul>
                <li>
                  <i className="carbs" />
                  Carbs <b>40%</b>
                </li>
                <li>
                  <i className="protein" />
                  Protein <b>30%</b>
                </li>
                <li>
                  <i className="fat" />
                  Fat <b>30%</b>
                </li>
              </ul>
            </div>
            <p>Balance your macros for energy and satisfaction.</p>
          </section>

          <section className="insight-card glance-card">
            <h2>This week at a glance</h2>
            <div>
              <MiniStat
                icon={<CalendarDays />}
                value="12"
                label="Meals planned"
              />
              <MiniStat icon={<Flame />} value="8,450" label="Total calories" />
              <MiniStat
                icon={<Target />}
                value="92%"
                label="Avg. pantry match"
              />
            </div>
          </section>
        </div>

        <div className="insights-middle-grid">
          <section className="insight-card meals-chart">
            <div className="card-title-row">
              <h2>Meals planned by day</h2>
              <span>Total 12</span>
            </div>
            <div className="meal-bars">
              {week.map((item, index) => (
                <div key={item.day}>
                  <b>{item.meals}</b>
                  <i
                    className={index === 2 ? "selected" : ""}
                    style={{ height: `${item.meals * 18}px` }}
                  />
                  <span className={index === 2 ? "selected-label" : ""}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <RingCard
            title="Pantry health"
            value="24"
            centerLabel="Items"
            color="#5f9837"
            rows={["24  Items in stock", "3  Expiring soon", "4  Low stock"]}
            footer="92% pantry health"
          />
          <RingCard
            title="Shopping progress"
            value="39%"
            centerLabel="Complete"
            color="#ef701a"
            rows={["18  Total items", "7  Bought", "9  Pending", "2  Skipped"]}
          />
          <section className="insight-card day-summary">
            <h2>Wednesday, Jul 22</h2>
            <div>
              <strong>
                3<small>Meals planned</small>
              </strong>
              <ul>
                <li>
                  <Flame />
                  1,320 kcal
                </li>
                <li>
                  <Leaf />
                  48 g protein
                </li>
                <li>
                  <Wheat />
                  145 g carbs
                </li>
                <li>
                  <Flame />
                  42 g fat
                </li>
              </ul>
            </div>
          </section>
        </div>

        <div className="insights-bottom-grid">
          <section className="insight-card best-matches">
            <h2>Best pantry matches</h2>
            <div>
              {[
                [matchOne, "Greek Yogurt Berry Parfait", "95% Match"],
                [matchTwo, "Grilled Salmon & Herb Quinoa", "92% Match"],
                [matchThree, "Lemon Herb Chickpea Bowl", "90% Match"],
              ].map(([image, title, match]) => (
                <article key={title}>
                  <button aria-label="Favorite">
                    <Heart fill="#ff5e54" />
                  </button>
                  <img src={image} />
                  <div>
                    <h3>{title}</h3>
                    <p>Breakfast · 10 min</p>
                    <span>
                      <Target />
                      {match}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <button onClick={() => onNavigate("Explore")}>
              View all pantry-perfect recipes <ChevronRight />
            </button>
          </section>
          <section className="recommendation-card">
            <span>
              <Star fill="currentColor" />
            </span>
            <div>
              <h2>You planned 5 pantry-perfect meals this week</h2>
              <p>
                Great job choosing meals that make the most of what you have.
              </p>
            </div>
            <button onClick={() => onNavigate("Explore")}>
              View recommendations
            </button>
          </section>
        </div>
      </div>
    </DashboardPageShell>
  );
}

function Kpi({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <article className={`insight-kpi ${tone}`}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}
function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="mini-stat">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}
function RingCard({
  title,
  value,
  centerLabel,
  color,
  rows,
  footer,
}: {
  title: string;
  value: string;
  centerLabel: string;
  color: string;
  rows: string[];
  footer?: string;
}) {
  return (
    <section className="insight-card ring-card">
      <h2>{title}</h2>
      <div className="ring-body">
        <div
          className="small-ring"
          style={{ "--ring-color": color } as React.CSSProperties}
        >
          <strong>{value}</strong>
          <small>{centerLabel}</small>
        </div>
        <ul>
          {rows.map((row, index) => (
            <li key={row}>
              <i className={`dot-${index}`} />
              {row}
            </li>
          ))}
        </ul>
      </div>
      {footer ? (
        <p>
          <Heart /> {footer}
        </p>
      ) : null}
    </section>
  );
}
