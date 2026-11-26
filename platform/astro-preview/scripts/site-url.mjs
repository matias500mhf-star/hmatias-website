export function resolveSiteUrl(env = process.env) {
  const explicitSiteUrl = String(env.ASTRO_SITE_URL ?? env.ASTRO_PREVIEW_SITE_URL ?? "").trim();
  if (explicitSiteUrl) {
    const explicitUrl = new URL(explicitSiteUrl);
    if (explicitUrl.protocol !== "https:") {
      throw new Error("ASTRO_SITE_URL and ASTRO_PREVIEW_SITE_URL must use HTTPS.");
    }
    return explicitUrl.origin;
  }

  const netlifyHost = String(env.DEPLOY_PRIME_URL ?? env.URL ?? "").trim();
  if (netlifyHost) {
    const netlifyUrl = new URL(netlifyHost.startsWith("https://") ? netlifyHost : `https://${netlifyHost}`);
    if (netlifyUrl.protocol !== "https:") {
      throw new Error("Netlify deployment URLs must use HTTPS.");
    }
    return netlifyUrl.origin;
  }

  const vercelHost = String(
    env.VERCEL_ENV === "production"
      ? env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL ?? ""
      : env.VERCEL_URL ?? ""
  ).trim();

  if (vercelHost) {
    const vercelUrl = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(vercelHost)
      ? vercelHost
      : `https://${vercelHost}`);
    if (vercelUrl.protocol !== "https:") {
      throw new Error("Vercel deployment URLs must use HTTPS.");
    }
    return vercelUrl.origin;
  }

  return "https://hmatias-astro-preview.onrender.com";
}
