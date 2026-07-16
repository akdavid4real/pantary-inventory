import { describe, expect, it } from "vitest";
import {
  catalogImageKey,
  foodImageVariantForSize,
  optimizeFoodImageUrl,
} from "./foodImage";

const publicUrl =
  "https://brbjohkvknvslgmmyuoo.supabase.co/storage/v1/object/public/recipe-images/01-nigerian-jollof-rice.png";

describe("catalogImageKey", () => {
  it("extracts the catalog basename from a Supabase object URL", () => {
    expect(catalogImageKey(publicUrl)).toBe("01-nigerian-jollof-rice");
    expect(
      catalogImageKey(
        "https://brbjohkvknvslgmmyuoo.supabase.co/storage/v1/object/public/ingredient-images/ingredients/01-long-grain-rice.png",
      ),
    ).toBe("01-long-grain-rice");
  });
});

describe("optimizeFoodImageUrl", () => {
  it("maps known catalog images to free self-hosted WebP variants", () => {
    expect(optimizeFoodImageUrl(publicUrl, "thumb")).toBe(
      "/catalog/thumb/01-nigerian-jollof-rice.webp",
    );
    expect(optimizeFoodImageUrl(publicUrl, "card")).toBe(
      "/catalog/card/01-nigerian-jollof-rice.webp",
    );
    expect(optimizeFoodImageUrl(publicUrl, "hero")).toBe(
      "/catalog/hero/01-nigerian-jollof-rice.webp",
    );
  });

  it("does not use paid Supabase image transform endpoints", () => {
    const optimized = optimizeFoodImageUrl(publicUrl, "card");
    expect(optimized).not.toContain("/storage/v1/render/image/");
  });

  it("leaves data URLs, blobs, and unknown remote uploads alone", () => {
    expect(optimizeFoodImageUrl("data:image/png;base64,abc", "card")).toBe(
      "data:image/png;base64,abc",
    );
    expect(optimizeFoodImageUrl("blob:https://app/1", "card")).toBe("blob:https://app/1");
    expect(
      optimizeFoodImageUrl(
        "https://brbjohkvknvslgmmyuoo.supabase.co/storage/v1/object/public/recipe-images/user-1/custom-upload.jpg",
        "card",
      ),
    ).toContain("custom-upload.jpg");
  });

  it("returns empty string for missing sources", () => {
    expect(optimizeFoodImageUrl(null)).toBe("");
    expect(optimizeFoodImageUrl(undefined)).toBe("");
  });
});

describe("foodImageVariantForSize", () => {
  it("picks a variant from display width", () => {
    expect(foodImageVariantForSize(40)).toBe("thumb");
    expect(foodImageVariantForSize(200)).toBe("card");
    expect(foodImageVariantForSize(900)).toBe("hero");
  });
});
