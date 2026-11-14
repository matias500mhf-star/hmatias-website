# HMATIAS — Protótipo tecnológico Astro

Este projeto é um protótipo isolado para avaliar uma arquitetura Astro para o website institucional. **Não é o publisher oficial e não altera o website em produção.**

## Objetivo desta fase

- Recriar a estrutura institucional com componentes Astro reutilizáveis.
- Preservar o azul institucional, o logótipo e as fotografias reais.
- Utilizar tipografia local: Manrope nos títulos, Inter no texto e IBM Plex Mono nos elementos técnicos.
- Preservar as proporções das fotografias; a galeria não impõe cortes para preencher cartões.
- Manter conteúdos e contactos em dados tipados.
- Gerar HTML estático para as páginas institucionais, sem adicionar runtime React onde não existe necessidade de interação complexa.
- Disponibilizar 29 rotas em Português (pt-AO) e 29 rotas em Inglês (58 páginas estáticas).
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
- `src/components/`: cabeçalho, serviços, galeria, contactos, HMATIAS Clean e páginas especializadas bilingues.
- `src/data/`: dados e tipos partilhados.
- `src/content/`: artigos PT e EN do Blog.
- `src/pages/`: rotas do website.
- `src/styles/`: tokens, tipografia local e estilos institucionais.
- `tests/e2e/`: testes de navegação, idioma, responsividade e acessibilidade.

## Decisão sobre React

React não foi instalado nesta etapa. As páginas institucionais são maioritariamente conteúdo e navegação; Astro produz HTML estático e evita enviar um runtime de interface desnecessário. A página Smart RFQ contém agora um formulário bilingue próprio para Construção, Facilities e Supply. Valida os campos da área escolhida, gera no navegador um resumo estruturado e uma referência local e permite ao utilizador optar pelo envio por e-mail ou WhatsApp. Não submete dados a um servidor, não cria encomendas, não calcula cotações e não confirma stock ou prazos. O RFQ multi-produto operacional do SOURCE AO em `/source-ao/rfq.html` mantém-se separado. React não foi adicionado porque a interação atual não justifica um runtime adicional. A HMATIAS Clean inclui um catálogo de 100 referências Taurus e um carrinho de preparação de pedido multiartigo (máximo de 20 itens), com handoff manual por WhatsApp ou e-mail; não submete dados a servidor nem regista encomendas. As páginas especializadas de Coberturas Industriais, Limpeza Pós-Obra, EPI/Fardamento e Remodelação de Escritórios usam Smart RFQ com área e serviço pré-seleccionados por query string; a confirmação e o envio continuam sempre sob controlo do visitante.

## Limites de publicação

- Esta pasta não está ligada ao publisher de produção.
- Não executar `wrangler deploy`, não alterar DNS e não associar o domínio oficial.
- O formulário principal de contacto continua no website oficial e, segundo confirmação do proprietário, já recebe pedidos por e-mail através do Resend. O preview abre o formulário oficial correspondente em português ou inglês, num novo separador; não replica credenciais nem altera o fluxo operacional.
- Business Services, agendamento e RFQ multi-produto operacional SOURCE AO continuam nos respectivos canais oficiais até existir equivalência validada em staging.
- O Smart RFQ geral e o pedido multiartigo HMATIAS Clean são fluxos de preparação local, com envio manual e sem submissão automática ao servidor.
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

**Estado atual — 14 de novembro de 2026:** o protótipo gera 58 páginas (29 PT-AO e 29 EN), com pares linguísticos verificados. O Astro prototype QA #882 aprovou um head anterior. Nos ajustes posteriores, o QA #890 passou type-check e build (58 páginas geradas), mas parou em `verify-build` porque a etiqueta antiga `Projecto Alpha` foi apanhada pela regra editorial. A etiqueta foi normalizada para `Projeto Alpha`; a lista Lighthouse cobre agora as 58 rotas. O preview mantém o formulário principal encaminhado para os formulários oficiais PT/EN que já recebem mensagens através do Resend. O novo QA do head actual deve concluir `verify`, Playwright, axe e Lighthouse antes de qualquer declaração de aprovação.

A revisão visual manual em desktop/tablet/mobile e a navegação integral por teclado continuam pendentes. A recepção do formulário principal via Resend já está operacional; os percursos de Business Services, agendamento e SOURCE AO devem ser validados separadamente antes de migrar esses fluxos.

A proteção `noindex, nofollow` deve manter-se durante toda a avaliação.