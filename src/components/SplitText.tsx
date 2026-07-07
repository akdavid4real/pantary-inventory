type SplitTextProps = {
  text: string;
  className?: string;
  by?: "chars" | "words";
};

export function SplitText({ text, className = "", by = "chars" }: SplitTextProps) {
  const parts = by === "chars" ? Array.from(text) : text.split(" ");

  return (
    <span className={className} aria-label={text}>
      {parts.map((part, index) => (
        <span className="split-mask" aria-hidden="true" key={`${part}-${index}`}>
          <span className="split-part">
            {part === " " ? "\u00A0" : part}
            {by === "words" && index < parts.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

