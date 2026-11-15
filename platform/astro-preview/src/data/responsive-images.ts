const UNSPLASH_WIDTHS = [480, 720, 960, 1200, 1440] as const;

/**
 * Builds responsive candidates for editorial images hosted on Unsplash.
 * Unknown hosts are left untouched so this helper never rewrites third-party URLs.
 */
export function getResponsiveUnsplashSrcSet(source: string): string | undefined {
  try {
    const original = new URL(source);
    if (original.protocol !== "https:" || original.hostname !== "images.unsplash.com") {
      return undefined;
    }

    return UNSPLASH_WIDTHS.map((width) => {
      const candidate = new URL(original.toString());
      candidate.searchParams.set("w", String(width));
      candidate.searchParams.set("q", original.searchParams.get("q") ?? "82");
      candidate.searchParams.set("auto", original.searchParams.get("auto") ?? "format");
      candidate.searchParams.set("fit", original.searchParams.get("fit") ?? "crop");
      return `${candidate.toString()} ${width}w`;
    }).join(", ");
  } catch {
    return undefined;
  }
}
