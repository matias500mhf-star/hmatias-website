const ptToEn: Record<string, string> = {
  "/": "/en/",
  "/empresa/": "/en/about/",
  "/credibilidade/": "/en/credibility/",
  "/construcao/": "/en/construction/",
  "/facilities/": "/en/facilities/",
  "/supply/": "/en/supply/",
  "/business-services/": "/en/business-services/",
  "/catalogo-obras/": "/en/works-catalogue/",
  "/blog/": "/en/blog/",
  "/acessibilidade/": "/en/accessibility/",
  "/privacidade/": "/en/privacy/",
  "/termos/": "/en/terms/",
  "/source-ao/": "/en/source-ao/",
  "/source-ao/smart-rfq/": "/en/source-ao/smart-rfq/",
  "/blog/como-preparar-um-pedido-de-cotacao/": "/en/blog/how-to-prepare-a-comparable-supply-quotation/",
};

const enToPt: Record<string, string> = Object.fromEntries(
  Object.entries(ptToEn).map(([portuguese, english]) => [english, portuguese]),
);

const normalizePath = (pathname: string) =>
  pathname.endsWith("/") ? pathname : `${pathname}/`;

export function getLanguagePair(pathname: string): { pt: string; en: string } | undefined {
  const path = normalizePath(pathname);
  const portuguesePath = enToPt[path] ?? path;
  const englishPath = ptToEn[portuguesePath];

  if (!englishPath) return undefined;
  return { pt: portuguesePath, en: englishPath };
}

export function getLanguageSwitchPath(pathname: string, isEnglish: boolean): string {
  const pair = getLanguagePair(pathname);
  if (pair) return isEnglish ? pair.pt : pair.en;

  const path = normalizePath(pathname);
  if (path.startsWith("/en/blog/")) return "/blog/";
  if (path.startsWith("/blog/")) return "/en/blog/";
  return isEnglish ? "/" : "/en/";
}
