# HMATIAS — Protótipo tecnológico Astro

Este projeto é um protótipo isolado para comparar uma arquitetura Astro com o website institucional atual. **Não é o publisher oficial e não altera o website em produção.**

## Objetivo desta fase

- Recriar a homepage aprovada em componentes Astro reutilizáveis.
- Preservar o azul institucional, a tipografia Inter local, o logótipo e as fotografias reais.
- Preservar as proporções originais das fotografias. A galeria não impõe alturas fixas nem corta a imagem para preencher cartões.
- Manter conteúdos e contactos em dados tipados.
- Renderizar as páginas institucionais como HTML estático, sem runtime React no conteúdo predominantemente editorial.
- Validar tipos, build e estrutura do artefacto em GitHub Actions.
- Testar navegação real em Chromium desktop e móvel com Playwright.
- Verificar acessibilidade automatizada com axe-core e recolher auditorias Lighthouse.

## Requisitos

- Node.js 26.13.0 (versão fixada em `.node-version` e alinhada com o runtime do preview).
- npm.

## Comandos

```bash
npm ci
npm run dev
npm run check
npm run build
npm run verify
npm run preview
```

O lockfile `package-lock.json` está versionado. As instalações repetíveis devem usar `npm ci`. O build produz `dist/`. O comando `verify` verifica o HTML, as quatro áreas de atividade, os contactos, as fotografias, as páginas Construção, Facilities, Supply, Catálogo de Obras, Business Services, Empresa, Blog, Acessibilidade, Política de Privacidade, Termos e Smart RFQ e os recursos processados.

## Estrutura

- `src/layouts/`: layout e metadados comuns.
- `src/components/`: cabeçalho, atividades, galeria, contactos e rodapé.
- `src/data/`: dados e tipos partilhados.
- `src/pages/`: rotas do website.
- `src/styles/`: tokens e estilos institucionais.

## Decisão sobre React

React não foi instalado nesta etapa. As páginas institucionais são maioritariamente conteúdo e navegação; Astro produz HTML estático e evita enviar um runtime de interface desnecessário. A página de apresentação Smart RFQ já está no protótipo Astro e encaminha para o formulário operacional existente no SOURCE AO. React será avaliado como ilha interactiva numa migração futura desse formulário, apenas quando trouxer ganhos claros de estado, validação e manutenção.

## Limites de publicação

- Esta pasta não está ligada ao publisher de produção.
- Não executar `wrangler deploy`, não alterar DNS e não associar o domínio oficial.
- Os formulários seguros de Business Services continuam temporariamente no website oficial até existir validação da API e do consentimento no novo domínio. O resultado só pode ser considerado candidato a migração após comparação visual, acessibilidade, SEO, performance, formulários, idioma inglês, redirecionamentos e integrações.

## Migração e rotas pendentes

Consultar [`MIGRATION-READINESS.md`](./MIGRATION-READINESS.md) para o inventário das páginas antigas, funcionalidades ainda preservadas no domínio oficial, cobertura bilingue e bloqueios para publicação.

## Quality Engineering

O workflow `.github/workflows/astro-prototype-qa.yml` executa:

- `astro check`, build estático, auditoria de dependências e verificação do artefacto.
- Playwright 1.65.0 em Chromium desktop e móvel: homepage, Blog, Acessibilidade, Construção, Facilities, Supply, Catálogo de Obras, Business Services, Empresa, Política de Privacidade, Termos e Smart RFQ; navegação, âncoras, imagens com texto alternativo e overflow horizontal.
- axe-core 4.14.0 nas rotas Homepage, Blog, Acessibilidade, Construção, Facilities, Supply, Catálogo de Obras, Business Services, Empresa, Política de Privacidade, Termos e Smart RFQ. Falhas críticas e graves bloqueiam o CI; ocorrências moderadas ou menores são registadas para revisão.
- Lighthouse CI 0.16.0 nas mesmas rotas, incluindo Business Services, Empresa e páginas legais, com indicadores de desempenho, acessibilidade, boas práticas, SEO, LCP e CLS. Os limites estão inicialmente em modo de alerta para permitir recolher uma linha de base real.

Os relatórios Playwright e Lighthouse são guardados como artefactos do GitHub Actions por 14 dias. As ferramentas de QA são instaladas apenas no ambiente CI e não entram no bundle do website.

A página de preview mantém `noindex, nofollow` até existir decisão de publicação; essa proteção não deve ser removida durante a avaliação.
