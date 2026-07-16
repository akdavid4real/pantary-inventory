"""
Build free self-hosted catalog image variants (no paid Supabase transforms).

Reads assets/foods + assets/ingredients and writes WebP variants under
public/catalog/{thumb,card,hero}/ plus src/data/catalog-image-manifest.json.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [ROOT / "assets" / "foods", ROOT / "assets" / "ingredients"]
OUT_ROOT = ROOT / "public" / "catalog"
MANIFEST_PATH = ROOT / "src" / "data" / "catalog-image-manifest.json"
VARIANTS = {
    "thumb": (128, 68),
    "card": (640, 72),
    "hero": (1200, 76),
}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def basename_key(path: Path) -> str:
    return path.stem.lower()


def collect_sources() -> dict[str, Path]:
    by_key: dict[str, Path] = {}
    for source in SOURCES:
        if not source.exists():
            continue
        for path in source.iterdir():
            if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
                continue
            key = basename_key(path)
            existing = by_key.get(key)
            # Prefer webp masters when both png + webp exist.
            if existing is None or (
                path.suffix.lower() == ".webp" and existing.suffix.lower() != ".webp"
            ):
                by_key[key] = path
    return by_key


def convert_one(source: Path, key: str) -> dict[str, str]:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        # Flatten transparency onto a kitchen-cream background for smaller WebPs.
        if image.mode == "RGBA":
            background = Image.new("RGB", image.size, (245, 241, 232))
            background.paste(image, mask=image.split()[-1])
            image = background
        elif image.mode != "RGB":
            image = image.convert("RGB")

        paths: dict[str, str] = {}
        for variant, (width, quality) in VARIANTS.items():
            out_dir = OUT_ROOT / variant
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / f"{key}.webp"
            resized = image.copy()
            resized.thumbnail((width, width), Image.Resampling.LANCZOS)
            resized.save(out_path, format="WEBP", quality=quality, method=4)
            paths[variant] = f"/catalog/{variant}/{key}.webp"
        return paths


def main() -> None:
    sources = collect_sources()
    manifest: dict[str, dict[str, str]] = {}
    total = len(sources)
    for index, key in enumerate(sorted(sources), start=1):
        manifest[key] = convert_one(sources[key], key)
        if index % 25 == 0 or index == total:
            print(f"Optimized {index}/{total} catalog images…")

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(
        f"Done. {total} images → public/catalog/{{thumb,card,hero}} "
        f"+ {MANIFEST_PATH.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
