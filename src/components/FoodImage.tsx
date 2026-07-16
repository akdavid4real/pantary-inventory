import { ImgHTMLAttributes, useEffect, useMemo, useState } from "react";
import {
  FoodImageVariant,
  ensureStoragePreconnect,
  optimizeFoodImageUrl,
  originalFoodImageUrl,
} from "../utils/foodImage";

type FoodImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  variant?: FoodImageVariant;
  /** When true, mark as LCP-critical (home hero / first explore cards). */
  priority?: boolean;
};

/**
 * Dashboard food/ingredient image for free Supabase tier:
 * - Prefer self-hosted /catalog WebP variants (no paid transforms)
 * - Lazy load + async decode by default
 * - Soft placeholder while loading
 */
export function FoodImage({
  src,
  alt = "",
  variant = "card",
  priority = false,
  className = "",
  onError,
  onLoad,
  loading,
  decoding,
  fetchPriority,
  ...rest
}: FoodImageProps) {
  const optimized = useMemo(() => optimizeFoodImageUrl(src, variant), [src, variant]);
  const original = useMemo(() => originalFoodImageUrl(src) || src || "", [src]);
  const [currentSrc, setCurrentSrc] = useState(optimized || original);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Only preconnect Supabase when we still need a remote original.
    if (optimized === original) ensureStoragePreconnect(src);
    setCurrentSrc(optimized || original);
    setFailed(false);
    setLoaded(false);
  }, [optimized, original, src]);

  if (!src || failed) {
    return (
      <span
        className={`inline-block bg-[#eef2e9] ${className}`}
        aria-hidden={alt ? undefined : true}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
      />
    );
  }

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding={decoding ?? "async"}
      fetchPriority={fetchPriority ?? (priority ? "high" : "auto")}
      className={`${className} ${loaded ? "" : "bg-[#eef2e9]"}`.trim()}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        // Local optimized miss → try original remote/source once.
        if (currentSrc !== original && original) {
          setCurrentSrc(original);
          return;
        }
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
