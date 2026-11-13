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
  name: "HMATIAS – Prestação de Serviços SU, LDA.",
  legalName: "HMATIAS – Prestação de Serviços SU, LDA.",
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
  sourceAoUrl: "/source-ao/",
  partnerApplicationUrl: "/source-ao/parceiros/",
  opportunityRadarUrl: "/source-ao/radar/",
  partnerApplicationEnUrl: "/en/source-ao/partners/",
  opportunityRadarEnUrl: "/en/source-ao/radar/",
  privacyUrl: "/privacidade/",
  termsUrl: "/termos/",
  aboutUrl: "/empresa/",
  credibilityUrl: "/credibilidade/",
  smartRfqUrl: "/source-ao/smart-rfq/",
  sourceAoRfqUrl: "/source-ao/smart-rfq/",
  sourceAoRfqEnUrl: "/en/source-ao/smart-rfq/",
  constructionUrl: "/construcao/",
  remodelingUrl: "/construcao/#remodelacao",
  facilitiesUrl: "/facilities/",
  projectsUrl: "/estaleiro/",
  worksCatalogueUrl: "/catalogo-obras/",
  supplyUrl: "/supply/",
  businessServicesUrl: "/business-services/",
  businessServicesContactUrl: "https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business",
  businessServicesBookingUrl: "https://comercialhmatiasps.com/agendamento.html",
  legacyContactFormUrl: "/#contacto"
} as const;