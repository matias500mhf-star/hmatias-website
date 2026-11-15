# HMATIAS — Search Console e mapa de migração SEO

Data do relatório: 15 de novembro de 2026  
Período do Search Console: 21 de agosto a 13 de novembro de 2026  
Branch: `feat/hmatias-platform-modernization-20261111`  
Estado: análise e mapeamento para revisão; não activa redirects nem indexação em produção.

## 1. Evidência do Search Console

### Desempenho global (gráfico diário e dispositivos)

| Métrica | Resultado |
|---|---:|
| Cliques | 59 |
| Impressões | 406 |
| CTR calculada | 14,53% |
| Telemóvel | 35 cliques / 194 impressões |
| Computador | 24 cliques / 212 impressões |

A CTR global é calculada por 59 / 406. A tabela de páginas exportada soma 60 cliques e 805 impressões, pelo que **não reconcilia com o gráfico diário nem com a tabela de dispositivos**. Não usar os totais das linhas de páginas para calcular desempenho global nem para comparar períodos. A diferença fica registada como limitação do export; não se presume a causa.

### Páginas com maior exposição (valores exactamente como exportados)

| URL histórica | Cliques | Impressões | CTR | Posição média |
|---|---:|---:|---:|---:|
| / | 43 | 207 | 20,77% | 4,46 |
| /construcao.html | 3 | 82 | 3,66% | 7,87 |
| /en.html | 3 | 32 | 9,38% | 3,66 |
| /credibilidade.html | 2 | 63 | 3,17% | 4,86 |
| /facilities.html | 2 | 47 | 4,26% | 6,57 |
| /business-services.html | 2 | 20 | 10,00% | 3,55 |
| /work-catalogue.html | 2 | 17 | 11,76% | 5,35 |
| /termos.html | 1 | 37 | 2,70% | 8,84 |
| /servicos-administrativos.html | 1 | 28 | 3,57% | 5,86 |
| /terms.html | 1 | 12 | 8,33% | 4,83 |
| /construction.html | 0 | 42 | 0% | 8,90 |
| /supply.html | 0 | 40 | 0% | 6,97 |
| /credibility.html | 0 | 27 | 0% | 6,81 |
| /supply-en.html | 0 | 24 | 0% | 4,67 |
| /source-ao/index.html | 0 | 22 | 0% | 17,91 |
| /clean-en.html | 0 | 21 | 0% | 9,29 |
| /privacy.html | 0 | 16 | 0% | 5,06 |
| /karta-en.html | 0 | 13 | 0% | 6,69 |
| /catalogo-obras.html | 0 | 13 | 0% | 8,00 |
| /facilities-en.html | 0 | 12 | 0% | 8,42 |
| /source-ao/ | 0 | 9 | 0% | 3,89 |
| /karta.html | 0 | 8 | 0% | 10,00 |
| /clean.html | 0 | 4 | 0% | 4,00 |
| /estaleiro-integrado.html | 0 | 3 | 0% | 10,00 |
| /privacidade.html | 0 | 1 | 0% | 4,00 |
| /limpeza-pos-obra.html | 0 | 1 | 0% | 6,00 |
| /coberturas-industriais.html | 0 | 1 | 0% | 7,00 |
| /remodelacao-de-escritorios.html | 0 | 1 | 0% | 10,00 |

A linha malformada adicional do CSV que concatena duas vezes a homepage não é tratada como URL nem como redirect.

### Consultas relevantes (amostra do CSV)

- `hmatias`: 3 cliques, 4 impressões, posição 1.
- `civil condition assessment angola`: 14 impressões, posição 7,71, sem cliques.
- `empresas em viana`: 8 impressões, posição 8,38, sem cliques.
- `servicos`: 2 impressões, posição 5,5, sem cliques.
- `encontrar fornecedores angola`: 1 impressão, posição 10, sem cliques.
- `construction management services angola`: 1 impressão, posição 27, sem cliques.

O relatório de consultas é uma amostra limitada; não deve ser tratado como inventário completo de palavras-chave.

### Pesquisa generativa

O relatório específico de funcionalidades generativas regista 69 impressões no gráfico, exclusivamente em computadores, no mesmo período. A tabela de páginas soma 104 impressões e não reconcilia com o gráfico. Não há cliques nem consultas apresentados neste export. Isto prova apenas impressões registadas neste relatório, não tráfego referido por IA nem recomendações/conversões.

## 2. Candidatos de correspondência — URL histórica para rota Astro

As rotas de destino abaixo são **candidatos de correspondência** com base nas rotas e páginas existentes no PR #316. Não são instruções para publicar redirects. A equivalência de conteúdo, funcionalidade, formulário, canonical, backlinks e estado de indexação tem de ser verificada antes de qualquer 301.

| URL histórica no domínio oficial | Rota Astro candidata | Estado / decisão |
|---|---|---|
| `/` | `/` | Preservar homepage; não alterar a homepage aprovada sem validação específica. |
| `/construcao.html` | `/construcao/` | Candidato directo; validar conteúdo, intenção e links internos. |
| `/en.html` | `/en/` | Candidato de homepage inglesa; validar par hreflang. |
| `/credibilidade.html` | `/credibilidade/` | Candidato directo; preservar conteúdo institucional. |
| `/facilities.html` | `/facilities/` | Candidato directo; validar equivalência. |
| `/business-services.html` | `/business-services/` | Candidato directo; validar conteúdo e CTA. |
| `/work-catalogue.html` | `/catalogo-obras/` | Candidato; validar se a versão PT mantém o catálogo e a intenção original. |
| `/termos.html` | `/termos/` | Candidato directo; revisão jurídica/editorial antes de migração. |
| `/servicos-administrativos.html` | `/business-services/` | **Não redireccionar ainda.** Confirmar preservação do pedido Business Services e do destino `#contacto-business`. |
| `/terms.html` | `/en/terms/` | Candidato directo; revisão jurídica/editorial. |
| `/construction.html` | `/en/construction/` | Candidato directo; validar equivalência EN. |
| `/supply.html` | `/supply/` | Candidato directo; página tem 40 impressões e zero cliques; rever snippet e intenção. |
| `/credibility.html` | `/en/credibility/` | Candidato directo; validar equivalência EN. |
| `/supply-en.html` | `/en/supply/` | Candidato directo; validar equivalência EN. |
| `/source-ao/index.html` | `/source-ao/` | **Conflito prioritário.** O GSC histórico registou canonical escolhido `/source-ao/` contra canonical declarado `/source-ao/index.html`. No Astro a rota canónica candidata é `/source-ao/`; testar o comportamento do URL antigo antes de qualquer 301. |
| `/source-ao/` | `/source-ao/` | Preservar como rota canónica candidata; comparar com o registo index.html e confirmar conteúdo/links. |
| `/clean-en.html` | `/en/clean/` | **Não redireccionar ainda.** A página antiga inclui referências de produtos/catálogo e RFQ multiartigo; provar equivalência funcional antes de substituir. |
| `/privacy.html` | `/en/privacy/` | Candidato directo; validar política e versão legal. |
| `/karta-en.html` | `/en/karta/` | Preservar identidade e estado Alpha; não redireccionar antes de aprovação de conteúdo. |
| `/catalogo-obras.html` | `/catalogo-obras/` | Candidato; comparar com `/work-catalogue.html` e definir uma única canonical após verificar conteúdo. |
| `/facilities-en.html` | `/en/facilities/` | Candidato directo; validar equivalência EN. |
| `/karta.html` | `/karta/` | Preservar identidade e estado Alpha; não redireccionar antes de aprovação de conteúdo. |
| `/clean.html` | `/clean/` | **Não redireccionar ainda.** Confirmar catálogo de produtos e RFQ multiartigo. |
| `/estaleiro-integrado.html` | `/estaleiro/` | **Não redireccionar ainda.** Preservar ressalvas de projecto em desenvolvimento, estudo preliminar e plantas dimensionadas. |
| `/privacidade.html` | `/privacidade/` | Candidato directo; validar política e versão legal. |
| `/limpeza-pos-obra.html` | `/limpeza-pos-obra/` | **Não redireccionar ainda.** Confirmar equivalência integral do serviço especializado. |
| `/coberturas-industriais.html` | `/coberturas-industriais/` | **Não redireccionar ainda.** Confirmar conteúdo técnico específico e intenção de pesquisa. |
| `/remodelacao-de-escritorios.html` | `/remodelacao-de-escritorios/` | **Não redireccionar ainda.** Confirmar conteúdo e CTA específico. |

## 3. Canonical e hreflang no Astro

- O Astro está configurado com `trailingSlash: "always"` e `build.format: "directory"`.
- O `BaseLayout.astro` constrói o canonical a partir de `Astro.url.pathname` e do `Astro.site`.
- As páginas são `noindex, nofollow` por omissão. A indexação só é activada quando `PUBLIC_INDEXING_ENABLED=true`, o site é HTTPS e o hostname é exactamente `comercialhmatiasps.com`.
- `generate-seo-files.mjs` bloqueia crawling no preview e omite o sitemap. Em produção, exige canonical no domínio configurado e trailing slash, e gera sitemap apenas com páginas explicitamente `index, follow`.
- `getLanguagePair()` define pares PT-AO/EN para as rotas mapeadas; páginas sem par definido não recebem hreflang. Verificar todas as rotas publicáveis e confirmar que cada par aponta para canonicals finais recíprocos.
- A homepage oficial, DNS, redirects, formulários, Resend, Worker e D1 de produção não foram alterados.

## 4. Portas obrigatórias antes de publicar

1. Obter estado actualizado de indexação URL a URL no Search Console. Não repetir os 11 pedidos de indexação aceites em Outubro sem verificar primeiro o estado actual.
2. Recolher backlinks e referências externas para as URLs históricas, sobretudo páginas especializadas e SOURCE AO.
3. Verificar cada URL antiga no domínio oficial: resposta HTTP, canonical declarado, canonical escolhido pelo Google, destino final, query strings e âncoras.
4. Rever equivalência editorial e funcional dos destinos; manter as páginas especializadas e os formulários operacionais enquanto não houver substituto equivalente testado.
5. Definir redirects 301 individuais, sem cadeias nem redireccionamentos genéricos para a homepage; testar em staging.
6. Confirmar hreflang recíproco, canonical, sitemap, robots, dados estruturados, analytics e eventos.
7. Fazer uma revisão de rollback por lote e só então submeter a publicação para aprovação explícita.

## 5. Decisão actual

- Este documento é uma matriz de trabalho baseada nos dois exports GSC de 15/11/2026 e nas rotas existentes no PR #316.
- Os destinos são candidatos, não equivalências aprovadas.
- Não activar redirects, indexação, sitemap de produção, alterações DNS ou publicação.
- Manter PR #316 em Draft até QA integral, revisão de conteúdo e validação URL a URL.
