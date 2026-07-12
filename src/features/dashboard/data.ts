import salmon from "../../../assets/asset_7.png";
import chickpea from "../../../assets/asset_5.png";
import roasted from "../../../assets/asset_6.png";
import pantry from "../../../assets/asset_4.png";

export const days = [
  ["Mon", "20"],
  ["Tue", "21"],
  ["Wed", "22"],
  ["Thu", "23"],
  ["Fri", "24"],
  ["Sat", "25"],
  ["Sun", "26"],
];

export const recipes = [
  {
    id: 1,
    title: "Lemon Herb Chickpea Bowl",
    time: "25 min",
    match: "High match",
    image: chickpea,
  },
  {
    id: 2,
    title: "Roasted Veg & Quinoa Salad",
    time: "30 min",
    match: "Good match",
    image: roasted,
  },
  {
    id: 3,
    title: "Garden Lentil Grain Bowl",
    time: "20 min",
    match: "Good match",
    image: pantry,
  },
];

export const featuredMeal = {
  title: "Grilled Salmon with Citrus & Herb Quinoa",
  image: salmon,
};
