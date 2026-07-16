export type FoodImageVariant = "thumb" | "card" | "hero";

let storagePreconnected = false;

const variantWidth: Record<FoodImageVariant, number> = {
  thumb: 128,
  card: 640,
  hero: 1200,
};

const variantQuality: Record<FoodImageVariant, number> = {
  thumb: 65,
  card: 70,
  hero: 75,
};

const supabaseObjectPath =
  /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/i;
const supabaseRenderPath =
  /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/render\/image\/public\/(.+?)(?:\?.*)?$/i;

/** Warm the browser connection to Supabase Storage before many images fire. */
export function ensureStoragePreconnect(src: string | null | undefined) {
  if (storagePreconnected || !src || typeof document === "undefined") return;
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

/**
 * Resize public Supabase Storage images for the UI slot they fill.
 * Full catalog PNGs are often 2–3 MB; list cards only need a few hundred KB.
 * Falls back to the original URL when transforms are unavailable (see FoodImage).
 */
export function optimizeFoodImageUrl(
  src: string | null | undefined,
  variant: FoodImageVariant = "card",
): string {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) {
    return src;
  }

  ensureStoragePreconnect(src);

  try {
    const width = variantWidth[variant];
    const quality = variantQuality[variant];
    const objectMatch = src.match(supabaseObjectPath);
    if (objectMatch) {
      const [, host, objectPath] = objectMatch;
      return `${host}/storage/v1/render/image/public/${objectPath}?width=${width}&quality=${quality}&resize=contain`;
    }

    const renderMatch = src.match(supabaseRenderPath);
    if (renderMatch) {
      const [, host, objectPath] = renderMatch;
      const params = new URLSearchParams({
        width: String(width),
        quality: String(quality),
        resize: "contain",
      });
      return `${host}/storage/v1/render/image/public/${objectPath}?${params.toString()}`;
    }
  } catch {
    return src;
  }

  return src;
}

export function originalFoodImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  const renderMatch = src.match(supabaseRenderPath);
  if (!renderMatch) return src;
  const [, host, objectPath] = renderMatch;
  return `${host}/storage/v1/object/public/${objectPath}`;
}

export function foodImageVariantForSize(displayWidthPx: number): FoodImageVariant {
  if (displayWidthPx <= 96) return "thumb";
  if (displayWidthPx <= 480) return "card";
  return "hero";
}
