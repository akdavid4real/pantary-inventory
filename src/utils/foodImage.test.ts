import { describe, expect, it } from "vitest";
import {
  foodImageVariantForSize,
  optimizeFoodImageUrl,
  originalFoodImageUrl,
} from "./foodImage";

const publicUrl =
  "https://brbjohkvknvslgmmyuoo.supabase.co/storage/v1/object/public/recipe-images/01-nigerian-jollof-rice.png";

describe("optimizeFoodImageUrl", () => {
  it("rewrites Supabase public object URLs to sized render URLs", () => {
    expect(optimizeFoodImageUrl(publicUrl, "thumb")).toBe(
      "https://brbjohkvknvslgmmyuoo.supabase.co/storage/v1/render/image/public/recipe-images/01-nigerian-jollof-rice.png?width=128&quality=65&resize=contain",
    );
    expect(optimizeFoodImageUrl(publicUrl, "card")).toContain("width=640");
    expect(optimizeFoodImageUrl(publicUrl, "hero")).toContain("width=1200");
  });

  it("leaves data URLs, blobs, and local paths alone", () => {
    expect(optimizeFoodImageUrl("data:image/png;base64,abc", "card")).toBe("data:image/png;base64,abc");
    expect(optimizeFoodImageUrl("blob:https://app/1", "card")).toBe("blob:https://app/1");
    expect(optimizeFoodImageUrl("/assets/food.webp", "card")).toBe("/assets/food.webp");
  });

  it("returns empty string for missing sources", () => {
    expect(optimizeFoodImageUrl(null)).toBe("");
    expect(optimizeFoodImageUrl(undefined)).toBe("");
  });
});

describe("originalFoodImageUrl", () => {
  it("converts render URLs back to the original object URL", () => {
    const optimized = optimizeFoodImageUrl(publicUrl, "thumb");
    expect(originalFoodImageUrl(optimized)).toBe(publicUrl);
  });
});

describe("foodImageVariantForSize", () => {
  it("picks a variant from display width", () => {
    expect(foodImageVariantForSize(40)).toBe("thumb");
    expect(foodImageVariantForSize(200)).toBe("card");
    expect(foodImageVariantForSize(900)).toBe("hero");
  });
});
