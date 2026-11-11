# HMATIAS — Plataforma Web: auditoria inicial e plano de modernização

**Data:** 11 de novembro de 2026  
**Repositório:** `matias500mhf-star/hmatias-website`  
**Base de referência:** `main`  
**Branch isolada:** `feat/hmatias-platform-modernization-20261111`  
**Estado:** auditoria estrutural inicial; nenhuma alteração de interface ou publicação de produção.

## 1. Resumo executivo

O website atual não é apenas um conjunto de páginas estáticas simples. É uma plataforma híbrida: o website institucional é publicado como múltiplas páginas HTML, CSS e JavaScript; funcionalidades específicas são suportadas por serviços Cloudflare Workers separados, incluindo SOURCE AO, lead intake e o assistente.

A prioridade não deve ser substituir indiscriminadamente esta base por um framework. Deve ser reduzir risco operacional, estabelecer medições reproduzíveis e modernizar progressivamente as partes com benefício demonstrável.

## 2. Inventário do repositório

A árvore Git consultada em `main` contém:

| Elemento | Quantidade |
|---|---:|
| Entradas totais na árvore Git | 439 |
| Ficheiros rastreados | 409 |
| Páginas HTML | 51 |
| Ficheiros CSS | 50 |
| Ficheiros JavaScript / MJS | 125 |
| Ativos de imagem | 58 |
| Workflows GitHub Actions | 17 |
| Documentos de auditoria / operação em `docs/` | 11 |

Estes números descrevem a árvore consultada e podem mudar com novos commits.

## 3. Stack e arquitetura observadas

### Website institucional

- Múltiplas páginas HTML5, com ficheiros próprios para áreas como Construção, Facilities, Supply, Business Services, RFQ, credibilidade e catálogos.
- CSS separado por páginas e responsabilidades, incluindo estilos da homepage, cabeçalho, tipografia, identidade visual, componentes e melhorias responsivas.
- JavaScript nativo para comportamento do website, analytics, formulários, navegação e integrações.
- `Vite 8.3.0` e `Lightning CSS 1.33.0` constam nas dependências de desenvolvimento do pacote raiz.
- O `vite.config.js` atual configura o servidor de desenvolvimento; não define uma compilação multipágina de produção.
- O script `scripts/build-home-css.mjs` já combina e minifica determinados conjuntos CSS com Lightning CSS, preservando explicitamente a ordem da cascata.
- O pacote raiz tem o comando `dev`; não tem atualmente um comando `build`, nem dependências raiz de Astro, React ou TypeScript.

### Serviços separados

- `source-ao/backend/`: backend Cloudflare Worker, D1, migrações, scripts operacionais e testes automatizados próprios.
- `lead-intake/`: serviço separado para receção de leads, com testes automatizados.
- `cloudflare-ai/`: Worker separado para o assistente digital.

Estas fronteiras são relevantes. Não devem ser fundidas numa migração do website institucional sem uma justificação técnica específica.

## 4. Segurança da toolchain — atualização concluída

A auditoria inicial do pacote raiz encontrou duas vulnerabilidades altas:

- Vite 8.3.0 estava dentro da faixa afetada pelos avisos de segurança publicados para o servidor de desenvolvimento.
- A dependência transitiva `source-map-js` estava em 1.2.1.

A correção foi aplicada somente nesta branch:

| Pacote | Antes | Depois |
|---|---:|---:|
| Vite | 8.3.0 | 8.3.7 |
| source-map-js | 1.2.1 | 1.2.2 |

A atualização do Vite 8.3.7 corrige, entre outros, o aviso crítico GHSA-p4f5-76q4-ffq7, relacionado com execução remota de código quando o servidor de desenvolvimento está exposto à rede. A configuração atual do servidor Vite usa `host: 0.0.0.0`, pelo que a atualização era relevante para o ambiente de desenvolvimento. O site publicado em produção não executa o servidor Vite.

A última execução de `npm audit` no pacote raiz reportou **0 vulnerabilidades** (0 low, 0 moderate, 0 high, 0 critical). O workflow agora impõe `npm audit --audit-level=high` e verifica a integridade da versão direta e do lockfile.

Referência oficial: [Vite GHSA-p4f5-76q4-ffq7](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7).

## 5. Publicação e controlos de segurança

O workflow `.github/workflows/jekyll-docker.yml` é o publisher do website GitHub Pages. O trigger de publicação está associado a `main` e à execução manual.

Antes de publicar, o workflow executa verificações de integridade e qualidade, constrói um artefacto público por seleção de ficheiros e exclui documentação interna, código backend e ferramentas operacionais. Depois da publicação, executa testes de URLs e conteúdo público.

Existe documentação operacional anterior que identifica uma integração Vercel de teste com atribuição de domínio ambígua. Por esse motivo:

- Não criar um script raiz `build` apenas para satisfazer uma integração Vercel.
- Não ativar um segundo publisher para o domínio principal.
- Não alterar DNS, domínios, GitHub Pages ou deployments Cloudflare nesta fase.
- Confirmar a origem e o encaminhamento de tráfego antes de qualquer alteração de publicação.

A modernização desta branch não contém passos de deployment.

## 6. Diagnóstico inicial

| Área | Estado observado | Implicação |
|---|---|---|
| Conteúdo e rotas | Múltiplas páginas HTML dedicadas | Preservar URLs, conteúdo, canonicals e sitemap |
| CSS | Separação por ficheiros e bundles gerados | Melhorar tokens e componentes sem quebrar a cascata |
| JavaScript | Módulos nativos e scripts clássicos | Mapear dependências e ordem de carregamento antes de converter |
| Ferramentas de build | Vite e Lightning CSS instalados | Clarificar papel de desenvolvimento, QA e futura compilação |
| Funcionalidades operacionais | Workers separados para serviços especializados | Preservar fronteiras e contratos de API |
| QA | Workflows existentes para Lighthouse, integridade, segurança e leads | Reutilizar e complementar, não duplicar sem necessidade |
| Observabilidade | Analytics e eventos já presentes no site | Preservar consentimento e atribuição comercial |

Esta auditoria é estrutural. Não equivale a uma nova medição Lighthouse nem certifica Core Web Vitals, acessibilidade integral, funcionamento de DNS ou disponibilidade de APIs.

## 7. Decisão de arquitetura recomendada

A decisão inicial é **modernização incremental com prova comparativa**, em vez de migração integral imediata.

1. Manter o website público atual e as suas URLs como referência de regressão.
2. Criar uma camada de Design Tokens e contratos de componentes sem redesenhar as páginas aprovadas.
3. Reduzir redundância CSS/JS apenas após identificar a origem, dependências e páginas afetadas.
4. Avaliar Astro para páginas orientadas a conteúdo e SEO num protótipo isolado.
5. Avaliar React apenas para ilhas de interface com estado e interação complexos, como um Smart RFQ operacional ou dashboards.
6. Usar TypeScript onde o volume e a complexidade de lógica justificarem tipagem e validação adicionais.
7. Manter Cloudflare Workers e os serviços existentes como sistemas separados, ligados por contratos de API documentados.

## 8. Critérios para qualquer migração futura

Uma migração só deve avançar quando o protótipo provar que:

- preserva conteúdo institucional, identidade aprovada e URLs atuais;
- mantém canonical, hreflang, sitemap, robots e dados estruturados;
- não quebra analytics, consentimento, formulários, atribuição ou integrações;
- não publica código interno nem dados privados de SOURCE AO;
- melhora ou, no mínimo, não degrada performance, acessibilidade e SEO nos testes mobile e desktop;
- pode ser publicada por um único caminho de produção claramente identificado;
- tem rollback e revisão por pull request.

## 9. Trabalho introduzido nesta branch

- `scripts/audit-platform.mjs`: inventário estrutural repetível, sem alterações nos ficheiros do site.
- `npm run audit:platform`: comando para executar o inventário.
- `.github/workflows/platform-modernization-qa.yml`: validação isolada da branch e de futuros pull requests para `main`.
- Esta documentação: registo do estado inicial, riscos de publicação e sequência técnica recomendada.

O workflow não executa `vite build`, não publica GitHub Pages e não executa `wrangler deploy`.

## 10. Próxima etapa

Depois da primeira execução do QA, a próxima entrega deve ser o mapa de componentes, estilos e dependências partilhadas, seguido de um protótipo de arquitetura isolado. A decisão Astro/React deve resultar da comparação com a baseline atual, não de preferência tecnológica.
