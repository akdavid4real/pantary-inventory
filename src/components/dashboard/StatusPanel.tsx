import { ArrowRight, CookingPot, ShoppingBasket } from "lucide-react";
import { panelClassName } from "./styles";

type StatusPanelProps = {
  type: "pantry" | "grocery";
  onAction: () => void;
  itemCount: number;
  secondaryCount?: number;
};

export function StatusPanel({ type, onAction, itemCount, secondaryCount = 0 }: StatusPanelProps) {
  const isPantry = type === "pantry";

  return (
    <article
      className={`${panelClassName} flex min-h-[300px] flex-col overflow-hidden p-5 pb-0`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8eee2]">
        {isPantry ? <CookingPot size={22} /> : <ShoppingBasket size={22} />}
      </div>

      <h2 className="mt-3 font-serif text-xl">
        {isPantry ? "Pantry status" : "Grocery summary"}
      </h2>

      <p className="mt-2 font-serif text-5xl text-[#1a624c]">
        {itemCount} <span className="font-sans text-sm text-[#333]">items</span>
      </p>

      <small className="text-[#70726d]">
        {isPantry ? "Total in pantry" : "In your list"}
      </small>

      <hr className="my-4 w-28 border-[#ddd4c5]" />

      {isPantry ? (
        <>
          <p className="font-serif text-4xl text-[#e4a11c]">
            {secondaryCount} <span className="font-sans text-sm">items</span>
          </p>
          <small className="text-[#70726d]">Expiring soon</small>
        </>
      ) : (
        <>
          <small className="text-[#70726d]">Still to pick up</small>
          <p className="font-serif text-3xl text-[#1a624c]">{secondaryCount}</p>
        </>
      )}

      <button
        className="-mx-5 mt-auto flex w-[calc(100%+40px)] items-center justify-between bg-[#f0f3e9] px-5 py-4 text-xs"
        onClick={onAction}
      >
        {isPantry ? "Review pantry" : "View list"}
        <ArrowRight size={18} />
      </button>
    </article>
  );
}
