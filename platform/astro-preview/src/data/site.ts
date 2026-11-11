export type ServiceIcon = "building" | "maintenance" | "supply" | "business";

export interface Service {
  number: string;
  title: string;
  description: string;
  href: string;
  icon: ServiceIcon;
}

export const services: Service[] = [
  {
    number: "01",
    title: "Construção e remodelação",
    description: "Obras · Infraestruturas · Pavimentos · Acabamentos",
    href: "/construcao/",
    icon: "building"
  },
  {
    number: "02",
    title: "Facilities e manutenção",
    description: "Manutenção de instalações · Limpeza · Apoio operacional",
    href: "/facilities/",
    icon: "maintenance"
  },
  {
    number: "03",
    title: "Supply e procurement",
    description: "Sourcing · Materiais · Consumíveis · Equipamentos",
    href: "/supply/",
    icon: "supply"
  },
  {
    number: "04",
    title: "Business Services",
    description: "Apoio administrativo · Documentação · Serviços empresariais",
    href: "/business-services/",
    icon: "business"
  }
];

export const company = {
  name: "HMATIAS — Prestação de Serviços SU, Lda.",
  legalName: "HMATIAS – Prestação de Serviços, (SU), LDA.",
  phone: "+244 948 806 673",
  telephoneUri: "tel:+244948806673",
  whatsappUri: "https://wa.me/244948806673",
  commercialEmail: "geral@comercialhmatiasps.com",
  institutionalEmail: "info@comercialhmatiasps.com",
  address: "Viana, Bairro 1 de Maio, Casa n.º 31, Luanda – Angola",
  shortAddress: "Viana · Luanda · Angola",
  taxNumber: "5001578065",
  commercialRegistration: "24.094-23",
  instagramUrl: "https://www.instagram.com/hmatias_pslda/",
  sourceAoUrl: "https://comercialhmatiasps.com/source-ao/index.html",
  partnerApplicationUrl: "https://comercialhmatiasps.com/source-ao/partner-application.html",
  privacyUrl: "/privacidade/",
  termsUrl: "/termos/",
  credibilityUrl: "/empresa/",
  smartRfqUrl: "/source-ao/smart-rfq/",
  sourceAoRfqUrl: "https://comercialhmatiasps.com/source-ao/rfq.html",
  constructionUrl: "/construcao/",
  remodelingUrl: "/construcao/#remodelacao",
  facilitiesUrl: "/facilities/",
  projectsUrl: "https://comercialhmatiasps.com/estaleiro-integrado.html",
  worksCatalogueUrl: "https://comercialhmatiasps.com/catalogo-obras.html",
  supplyUrl: "/supply/",
  businessServicesUrl: "/business-services/",
  businessServicesContactUrl: "https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business",
  legacyContactFormUrl: "https://comercialhmatiasps.com/#contacto"
} as const;