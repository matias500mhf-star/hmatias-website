export function responsiveImageUrl(source: string, width: number): string {
  const url = new URL(source);
  if (url.hostname !== "images.unsplash.com") {
    throw new Error("Blog editorial images must be served from the approved Unsplash image CDN.");
  }
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", width <= 768 ? "72" : "80");
  return url.toString();
}

export function responsiveImageSrcset(source: string): string {
  return [480, 768, 1024, 1440]
    .map((width) => `${responsiveImageUrl(source, width)} ${width}w`)
    .join(", ");
}
