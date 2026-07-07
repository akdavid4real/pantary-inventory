import { stats } from "../data/content";

export function StatsBar() {
  return (
    <dl className="stats-bar" aria-label="Pantry-to-Plate trust metrics">
      {stats.map(([value, label]) => (
        <div key={label}>
          <dt>{value}</dt>
          <dd>{label}</dd>
        </div>
      ))}
    </dl>
  );
}

