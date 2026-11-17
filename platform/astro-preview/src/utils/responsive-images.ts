export function responsiveImageUrl(
  source: string,
  width: number,
  aspectRatio: number = 4 / 3,
): string {
  const url = new URL(source);
  if (url.hostname !== "images.unsplash.com") {
    throw new Error("Blog editorial images must be served from the approved Unsplash image CDN.");
  }
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    throw new Error("Editorial image aspect ratio must be a positive number.");
  }

  const height = Math.round(width / aspectRatio);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(width));
  url.searchParams.set("h", String(height));
  url.searchParams.set("q", width <= 768 ? "72" : "80");
  return url.toString();
}

export function responsiveImageSrcset(source: string, aspectRatio: number = 4 / 3): string {
  return [480, 768, 1024, 1440]
    .map((width) => `${responsiveImageUrl(source, width, aspectRatio)} ${width}w`)
    .join(", ");
}
