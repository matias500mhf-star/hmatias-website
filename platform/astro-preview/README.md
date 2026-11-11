# HMATIAS — Protótipo tecnológico Astro

Este projeto é um protótipo isolado para comparar uma arquitetura Astro com o website institucional atual. **Não é o publisher oficial e não altera o website em produção.**

## Objetivo desta fase

- Recriar a homepage aprovada em componentes Astro reutilizáveis.
- Preservar o azul institucional, a tipografia Inter local, o logótipo e as fotografias reais.
- Preservar as proporções originais das fotografias. A galeria não impõe alturas fixas nem corta a imagem para preencher cartões.
- Manter conteúdos e contactos em dados tipados.
- Renderizar a página como HTML estático, sem runtime React no conteúdo institucional.
- Validar tipos, build e estrutura do artefacto em GitHub Actions.

## Requisitos

- Node.js 22.22.0 ou superior. O workflow CI usa Node.js 24.
- npm.

## Comandos

```bash
npm install
npm run dev
npm run check
npm run build
npm run verify
npm run preview
```

O build produz `dist/`. O comando `verify` verifica o HTML, as quatro áreas de atividade, os contactos, as fotografias e os recursos processados.

## Estrutura

- `src/layouts/`: layout e metadados comuns.
- `src/components/`: cabeçalho, atividades, galeria, contactos e rodapé.
- `src/data/`: dados e tipos partilhados.
- `src/pages/`: rotas do website.
- `src/styles/`: tokens e estilos institucionais.

## Decisão sobre React

React não foi instalado nesta etapa. A homepage institucional é maioritariamente conteúdo e navegação; Astro produz HTML estático e evita enviar um runtime de interface desnecessário. React será avaliado como ilha interativa quando a fase Smart RFQ exigir estado complexo, validações dinâmicas ou fluxos multi-etapa.

## Limites de publicação

- Esta pasta não está ligada ao publisher de produção.
- Não executar `wrangler deploy`, não alterar DNS e não associar o domínio oficial.
- O resultado só pode ser considerado candidato a migração após comparação visual, acessibilidade, SEO, performance, formulários e integrações.
