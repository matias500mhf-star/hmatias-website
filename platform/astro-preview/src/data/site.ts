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
    href: "https://comercialhmatiasps.com/construcao.html",
    icon: "building"
  },
  {
    number: "02",
    title: "Facilities e manutenção",
    description: "Manutenção de instalações · Limpeza · Apoio operacional",
    href: "https://comercialhmatiasps.com/facilities.html",
    icon: "maintenance"
  },
  {
    number: "03",
    title: "Supply e procurement",
    description: "Sourcing · Materiais · Consumíveis · Equipamentos",
    href: "https://comercialhmatiasps.com/supply.html",
    icon: "supply"
  },
  {
    number: "04",
    title: "Business services",
    description: "Apoio administrativo · Documentação · Serviços empresariais",
    href: "https://comercialhmatiasps.com/servicos-administrativos.html",
    icon: "business"
  }
];

export const company = {
  name: "HMATIAS — Prestação de Serviços SU, Lda.",
  phone: "+244 948 806 673",
  telephoneUri: "tel:+244948806673",
  whatsappUri: "https://wa.me/244948806673",
  commercialEmail: "geral@comercialhmatiasps.com",
  institutionalEmail: "info@comercialhmatiasps.com",
  address: "Viana, Bairro 1 de Maio, Casa n.º 31, Luanda – Angola",
  shortAddress: "Viana · Luanda · Angola"
} as const;