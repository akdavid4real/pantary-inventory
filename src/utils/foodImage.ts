import catalogImageManifest from "../data/catalog-image-manifest.json";

export type FoodImageVariant = "thumb" | "card" | "hero";

type CatalogImageEntry = {
  thumb: string;
  card: string;
  hero: string;
};

const manifest = catalogImageManifest as Record<string, CatalogImageEntry>;

let storagePreconnected = false;

/**
 * Free-tier image strategy:
 * - Prefer self-hosted WebP variants from /catalog (Vercel static CDN)
 * - Never use paid Supabase Image Transformations
 * - Fall back to the original remote URL for user uploads not in the catalog
 */
export function catalogImageKey(src: string | null | undefined): string | null {
  if (!src) return null;
  try {
    const path = src.startsWith("http") ? new URL(src).pathname : src;
    const file = path.split("/").pop() || "";
    const key = file.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
    return key || null;
  } catch {
    return null;
  }
}

/** Warm the browser connection only when we still need Supabase Storage. */
export function ensureStoragePreconnect(src: string | null | undefined) {
  if (storagePreconnected || !src || typeof document === "undefined") return;
  if (!src.includes(".supabase.co")) return;
  const match = src.match(/^(https:\/\/[^/]+\.supabase\.co)/i);
  if (!match) return;
  storagePreconnected = true;
  const origin = match[1];
  for (const rel of ["preconnect", "dns-prefetch"] as const) {
    if (document.head.querySelector(`link[rel="${rel}"][href="${origin}"]`)) continue;
    const link = document.createElement("link");
    link.rel = rel;
    link.href = origin;
    if (rel === "preconnect") link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }
}

export function optimizeFoodImageUrl(
  src: string | null | undefined,
  variant: FoodImageVariant = "card",
): string {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  // Already a local catalog or app asset path.
  if (src.startsWith("/catalog/") || src.startsWith("/assets/")) return src;

  const key = catalogImageKey(src);
  if (key && manifest[key]) {
    return manifest[key][variant] || manifest[key].card;
  }

  // User-uploaded / unknown remote images stay as-is (free Supabase, no transforms).
  ensureStoragePreconnect(src);
  return src;
}

/** Original remote URL used when a local optimized asset is unavailable. */
export function originalFoodImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("/catalog/")) {
    // Local catalog images are the source of truth for free-tier serving.
    return src;
  }
  return src;
}

export function foodImageVariantForSize(displayWidthPx: number): FoodImageVariant {
  if (displayWidthPx <= 96) return "thumb";
  if (displayWidthPx <= 480) return "card";
  return "hero";
}
