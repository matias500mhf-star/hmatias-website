const ptToEn: Record<string, string> = {
  "/": "/en/",
  "/empresa/": "/en/about/",
  "/karta/": "/en/karta/",
  "/estaleiro/": "/en/integrated-yard/",
  "/credibilidade/": "/en/credibility/",
  "/brochura-institucional/": "/en/company-brochure/",
  "/construcao/": "/en/construction/",
  "/facilities/": "/en/facilities/",
  "/clean/": "/en/clean/",
  "/coberturas-industriais/": "/en/industrial-roofing/",
  "/limpeza-pos-obra/": "/en/post-construction-cleaning/",
  "/fornecimento-de-epi-e-fardamento/": "/en/ppe-workwear/",
  "/remodelacao-de-escritorios/": "/en/office-remodelling/",
  "/supply/": "/en/supply/",
  "/business-services/": "/en/business-services/",
  "/catalogo-obras/": "/en/works-catalogue/",
  "/blog/": "/en/blog/",
  "/acessibilidade/": "/en/accessibility/",
  "/privacidade/": "/en/privacy/",
  "/cookies/": "/en/cookies/",
  "/termos/": "/en/terms/",
  "/source-ao/": "/en/source-ao/",
  "/source-ao/smart-rfq/": "/en/source-ao/smart-rfq/",
  "/source-ao/radar/": "/en/source-ao/radar/",
  "/source-ao/parceiros/": "/en/source-ao/partners/",
  "/blog/como-preparar-um-pedido-de-cotacao/": "/en/blog/how-to-prepare-a-comparable-supply-quotation/",
  "/blog/avaliar-propostas-fornecimento-sem-comparar-apenas-preco/": "/en/blog/evaluating-supply-proposals-beyond-price/",
  "/blog/substituicao-localizada-cobertura-metalica/": "/en/blog/localised-metal-roof-replacement/",
  "/blog/plano-manutencao-preventiva-instalacoes/": "/en/blog/preventive-facilities-maintenance-plan/",
  "/blog/recepcao-e-conferencia-de-fornecimentos/": "/en/blog/receiving-and-inspecting-supply-deliveries/",
  "/blog/comparar-propostas-perfis-metalicos-chapas-cobertura/": "/en/blog/comparing-metal-profiles-and-roofing-sheets/",
};
const enToPt: Record<string, string> = Object.fromEntries(Object.entries(ptToEn).map(([pt,en]) => [en,pt]));
const normalizePath=(pathname:string)=>pathname.endsWith("/")?pathname:`${pathname}/`;
export function getLanguagePair(pathname:string):{pt:string;en:string}|undefined{
  const path=normalizePath(pathname);const portuguesePath=enToPt[path]??path;const englishPath=ptToEn[portuguesePath];if(!englishPath)return undefined;return {pt:portuguesePath,en:englishPath};
}
export function getLanguageSwitchPath(pathname:string,isEnglish:boolean):string{
  const pair=getLanguagePair(pathname);if(pair)return isEnglish?pair.pt:pair.en;const path=normalizePath(pathname);if(path.startsWith("/en/blog/"))return "/blog/";if(path.startsWith("/blog/"))return "/en/blog/";return isEnglish?"/":"/en/";
}
