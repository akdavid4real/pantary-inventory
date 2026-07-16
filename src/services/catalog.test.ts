import { describe, expect, it } from "vitest";
import { sortImageFirst } from "./catalog";

describe("catalog ordering", () => {
  it("keeps image-backed foods ahead of fallback cards", () => {
    const foods = sortImageFirst([
      { name: "No image", imageUrl: null },
      { name: "Food photo", imageUrl: "https://example.com/food.png" },
      { name: "Another fallback" },
    ]);

    expect(foods.map((food) => food.name)).toEqual([
      "Food photo",
      "No image",
      "Another fallback",
    ]);
  });
});
