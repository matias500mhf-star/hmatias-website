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
    title: "Estrutura metálica e alvenaria de apoio",
    description: "Estrutura metálica, cobertura em chapa e alvenaria de apoio em fase de execução.",
    image: galpao,
    alt: "Estrutura metálica com cobertura em chapa e alvenaria de apoio"
  },
  {
    category: "Infraestrutura",
    title: "Movimentação e regularização de terreno",
    description: "Equipamento de movimentação de terras sobre terreno natural, com material escavado e superfície regularizada visíveis.",
    image: terraplanagem,
    alt: "Equipamento de movimentação de terras num terreno natural"
  },
  {
    category: "Facilities · Manutenção",
    title: "Chapas de cobertura perfilada",
    description: "Chapas perfiladas novas junto a chapas existentes numa cobertura em intervenção.",
    image: cobertura,
    alt: "Chapas perfiladas novas junto a chapas existentes numa cobertura em intervenção"
  },
  {
    category: "Construção rural",
    title: "Pavilhões com cobertura metálica",
    description: "Dois pavilhões alongados com cobertura metálica e laterais parcialmente abertas.",
    image: pavilhoes,
    alt: "Dois pavilhões alongados com cobertura metálica e laterais parcialmente abertas"
  }
];