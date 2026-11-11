# HMATIAS — Protótipo tecnológico Astro

Este projeto é um protótipo isolado para avaliar uma arquitetura Astro para o website institucional. **Não é o publisher oficial e não altera o website em produção.**

## Objetivo desta fase

- Recriar a estrutura institucional com componentes Astro reutilizáveis.
- Preservar o azul institucional, o logótipo e as fotografias reais.
- Utilizar tipografia local: Manrope nos títulos, Inter no texto e IBM Plex Mono nos elementos técnicos.
- Preservar as proporções das fotografias; a galeria não impõe cortes para preencher cartões.
- Manter conteúdos e contactos em dados tipados.
- Gerar HTML estático para as páginas institucionais, sem adicionar runtime React onde não existe necessidade de interação complexa.
- Disponibilizar 14 rotas em Português (pt-AO) e 14 rotas em Inglês.
- Validar tipos, build e estrutura do artefacto em CI.
- Testar navegação em Chromium desktop e WebKit móvel com Playwright.
- Verificar acessibilidade automatizada com axe-core e recolher auditorias Lighthouse.

## Requisitos

- Node.js 26.13.0 (fixado em `.node-version` e alinhado com o runtime do preview).
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

O lockfile `package-lock.json` está versionado. As instalações repetíveis devem usar `npm ci`. O build produz `dist/`. O comando `verify` verifica o HTML, as rotas PT/EN, conteúdos essenciais, alternadores de idioma, fotografias, textos alternativos, ligações RFQ e recursos processados.

## Estrutura

- `src/layouts/`: layout e metadados comuns.
- `src/components/`: cabeçalho, serviços, galeria, contactos e rodapé.
- `src/data/`: dados e tipos partilhados.
- `src/content/`: artigos PT e EN do Blog.
- `src/pages/`: rotas do website.
- `src/styles/`: tokens, tipografia local e estilos institucionais.
- `tests/e2e/`: testes de navegação, idioma, responsividade e acessibilidade.

## Decisão sobre React

React não foi instalado nesta etapa. As páginas institucionais são maioritariamente conteúdo e navegação; Astro produz HTML estático e evita enviar um runtime de interface desnecessário. A página Smart RFQ apresenta o fluxo e encaminha para o formulário operacional existente no SOURCE AO. React poderá ser avaliado como ilha interativa numa futura migração do formulário, apenas se trouxer ganhos claros de estado, validação e manutenção.

## Limites de publicação

- Esta pasta não está ligada ao publisher de produção.
- Não executar `wrangler deploy`, não alterar DNS e não associar o domínio oficial.
- Os formulários de contacto, Business Services, agendamento e SOURCE AO continuam temporariamente no website oficial.
- O preview mantém `noindex, nofollow`.
- O resultado só pode ser considerado candidato a migração após validação visual, acessibilidade, SEO, performance, versões linguísticas, redirecionamentos e integrações.

## Migração e rotas pendentes

Consultar [`MIGRATION-READINESS.md`](./MIGRATION-READINESS.md) para o inventário das páginas já migradas, funcionalidades preservadas no domínio oficial e bloqueios para publicação.

## Quality Engineering

O workflow `.github/workflows/astro-prototype-qa.yml` executa:

- Auditoria de dependências, Astro Check, build estático e verificação do artefacto.
- Testes automatizados do contrato e persistência do SOURCE AO.
- Playwright 1.65.0 em Chromium desktop e WebKit móvel.
- axe-core 4.14.0 nas rotas cobertas pelos testes.
- Lighthouse CI 0.16.0 nas rotas definidas em `lighthouserc.cjs`.

Os relatórios Playwright e Lighthouse são guardados como artefactos do GitHub Actions por 14 dias. As ferramentas de QA são instaladas apenas no ambiente CI e não entram no bundle do website.

**Estado atual:** o build e a verificação estática passaram num ciclo anterior; a etapa Playwright/axe falhou nesse ciclo e o Lighthouse foi ignorado. A nova execução deve ser confirmada antes de qualquer decisão de publicação.

A proteção `noindex, nofollow` deve manter-se durante toda a avaliação.