import type { ImageMetadata } from "astro";
import galpao from "../../../../images/catalogue/galpao-estrutura-metalica.webp";
import terraplanagem from "../../../../images/catalogue/terraplanagem-preparacao-terreno.webp";
import cobertura from "../../../../images/catalogue/cobertura-metalica-substituicao.webp";
import pavilhoes from "../../../../images/catalogue/pavilhoes-rurais-concluidos.webp";

export interface Project {
  category: string;
  title: string;
  description: string;
  image: ImageMetadata;
  alt: string;
}

export const projects: Project[] = [
  {
    category: "Estruturas metálicas",
    title: "Galpão com estrutura metálica",
    description: "Montagem de estrutura metálica, cobertura e fechamentos em chapa, com alvenaria de apoio.",
    image: galpao,
    alt: "Galpão com estrutura metálica e cobertura em chapa"
  },
  {
    category: "Infraestrutura",
    title: "Preparação de terreno",
    description: "Mobilização de retroescavadora para movimentação de terras e regularização inicial do terreno.",
    image: terraplanagem,
    alt: "Retroescavadora na preparação e regularização de terreno"
  },
  {
    category: "Facilities · Manutenção",
    title: "Substituição de cobertura",
    description: "Substituição localizada de chapas de cobertura, com integração na estrutura existente.",
    image: cobertura,
    alt: "Substituição de cobertura metálica com novas chapas perfiladas"
  },
  {
    category: "Construção rural",
    title: "Pavilhões rurais concluídos",
    description: "Vista exterior de pavilhões concluídos, com cobertura metálica e áreas laterais ventiladas.",
    image: pavilhoes,
    alt: "Pavilhões rurais concluídos com cobertura metálica"
  }
];