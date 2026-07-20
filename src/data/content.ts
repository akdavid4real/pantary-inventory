import { assets } from "./assets";

export const stats = [
  ["24", "items detected"],
  ["18", "grocery gaps"],
  ["860", "sample calories"],
  ["25 min", "cook time"],
] as const;

export const featureSlides = [
  {
    id: "pantry",
    title: "Pantry intelligence",
    kicker: "Scan what is already home",
    copy: "Auto-detect shelf staples, produce, and use-first ingredients so dinner starts from your actual kitchen.",
    image: assets.pantry,
    alt: "Nigerian brown beans ready for a pantry meal",
    rotation: "-4deg",
  },
  {
    id: "recipe",
    title: "Recipe discovery",
    kicker: "Fresh ideas, not random tabs",
    copy: "Pull up ingredient-aware meals that match your time, taste, and nutrition goals.",
    image: assets.recipe,
    alt: "A bowl of rich Nigerian egusi soup",
    rotation: "3deg",
  },
  {
    id: "planner",
    title: "Meal planner",
    kicker: "A week that bends with you",
    copy: "Build flexible plans, swap meals quickly, and turn the week into a list that only includes what is missing.",
    image: assets.grocery,
    alt: "Fresh Nigerian plum tomatoes ready for the weekly shop",
    rotation: "-2deg",
  },
  {
    id: "grocery",
    title: "Shopping clarity",
    kicker: "One list, no double-buying",
    copy: "Separate pantry-owned ingredients from true grocery gaps before you leave the house.",
    image: assets.herbs,
    alt: "Nigerian efo riro with leafy vegetables and assorted meat",
    rotation: "4deg",
  },
] as const;

export const nutritionCards = [
  ["860", "calories"],
  ["30%", "protein"],
  ["High", "fiber"],
  ["Clear", "macros"],
] as const;

