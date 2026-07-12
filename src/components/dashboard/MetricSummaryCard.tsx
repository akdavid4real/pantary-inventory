import { ReactNode } from "react";

type MetricTone = "plain" | "green" | "yellow" | "coral" | "gray";

type MetricSummaryCardProps = {
  icon: ReactNode;
  value: number | string;
  label: string;
  tone?: MetricTone;
};

const toneClassNames: Record<MetricTone, string> = {
  plain: "bg-[#eef0e9] text-[#2d6251]",
  green: "bg-[#e4f0e4] text-[#277257]",
  yellow: "bg-[#fff0d2] text-[#df8614]",
  coral: "bg-[#fde7df] text-[#e75943]",
  gray: "bg-[#eaeae7] text-[#666]",
};

export function MetricSummaryCard({
  icon,
  value,
  label,
  tone = "plain",
}: MetricSummaryCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-[#ded5c5] bg-[#fffdf8] p-4 shadow-[0_2px_8px_rgba(30,70,50,0.06)]">
      <span
        className={`grid h-12 w-12 place-items-center rounded-full ${toneClassNames[tone]}`}
      >
        {icon}
      </span>

      <p className="font-serif text-4xl">
        {value}
        <small className="ml-2 block font-sans text-[11px] text-[#666862] sm:inline">
          {label}
        </small>
      </p>
    </article>
  );
}
