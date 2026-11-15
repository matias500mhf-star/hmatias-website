# HMATIAS — Plano de preservação de URLs e redirecionamentos

Data de referência: 11 de novembro de 2026  
Branch: `feat/hmatias-platform-modernization-20261111`

## Objetivo

Proteger tráfego orgânico, campanhas, links partilhados e funcionalidades comerciais durante a evolução do website. Este documento orienta a migração; não aplica redirecionamentos nem altera o domínio oficial.

## Regra de segurança

Nenhuma URL histórica deve ser removida, desindexada ou redirecionada antes de:
1. Confirmar o conteúdo e a função atuais da página.
2. Identificar a intenção de pesquisa e os links internos/externos que a utilizam.
3. Confirmar que existe uma página de destino equivalente em conteúdo e funcionalidade.
4. Testar o destino, os formulários e os parâmetros relevantes.
5. Definir e testar o redirecionamento permanente apenas quando a equivalência estiver demonstrada.

## Matriz de decisão

| URL histórica | Função identificada | Decisão nesta fase | Condição para migração |
|---|---|---|---|
| `/rfq.html` | Briefing RFQ antigo para Construção, Facilities e Supply; prepara o texto no navegador e permite envio por e-mail/WhatsApp | Manter operacional; não confundir com o SOURCE AO RFQ | Só substituir quando o novo fluxo cobrir as mesmas áreas, campos, revisão e canais de envio |
| `/clean.html`, `/clean-en.html` | HMATIAS Clean, referências de produtos, catálogo técnico e pedido de cotação multiartigo | Manter as duas versões | Criar destino específico para catálogo/linha de produtos e testar o pedido multiartigo; não reduzir automaticamente à página geral Supply |
| `/karta.html`, `/karta-en.html` | Apresentação do produto/projeto KARTA | Preservar as URLs oficiais; o preview recria `/karta/` e `/en/karta/` | Confirmar estado Alpha, conteúdo aprovado, identidade e decisão de migração antes de qualquer redirect |
| `/agendamento.html`, `/booking.html` | Pedido de atendimento/agendamento Business Services | Manter no domínio oficial | Migrar apenas com formulário, disponibilidade, notificações e confirmação testados |
| `/coberturas-industriais.html` | Página especializada de coberturas industriais | Preservar | Integrar em Construção apenas se a página de destino mantiver o conteúdo específico e a intenção da consulta |
| `/limpeza-pos-obra.html` | Página especializada de limpeza pós-obra | Preservar | Integrar em Facilities apenas se mantiver escopo, condições e conteúdo específico |
| `/fornecimento-de-epi-e-fardamento.html` | Página especializada de EPI e fardamento | Preservar | Integrar em Supply apenas com conteúdo e encaminhamento de cotação equivalentes |
| `/remodelacao-de-escritorios.html` | Página especializada de remodelação de escritórios | Preservar | Integrar em Construção apenas se a página de destino cobrir a intenção específica |
| `/estaleiro-integrado.html`, `/integrated-yard.html` | Projeto em desenvolvimento recriado no preview em `/estaleiro/` e `/en/integrated-yard/` | Preservar URLs oficiais até aprovação | Não classificar como obra executada; preservar o estudo preliminar, as ressalvas técnicas e as duas plantas dimensionadas; não aplicar redirects nesta fase |

## Rotas operacionais que não devem ser substituídas por páginas demonstrativas

- SOURCE AO: `/source-ao/index.html`
- SOURCE AO Smart RFQ operacional: `/source-ao/rfq.html`
- RFQ inglês: `/rfq-en.html`
- Radar de oportunidades: `/source-ao/opportunity-radar.html`
- Formulário de contacto: `/#contacto`
- Pedido Business Services: `/servicos-administrativos.html#contacto-business`

A página explicativa Smart RFQ do protótipo Astro deve continuar a encaminhar para o fluxo operacional existente até a migração técnica estar concluída e testada.

## Verificações técnicas antes de publicar

- Inventariar URLs indexadas, tráfego orgânico e páginas de entrada no Google Search Console.
- Recolher backlinks e referências externas relevantes.
- Confirmar respostas HTTP e destino final de cada URL no domínio oficial.
- Definir mapa explícito de redirects 301, sem cadeias e sem redirecionamentos genéricos para a homepage.
- Atualizar ligações internas, canonical, hreflang e sitemap.
- Testar versões PT e EN, query strings, âncoras, formulários e eventos de analytics.
- Validar que páginas de projeto em desenvolvimento não são apresentadas como obras concluídas.
- Manter um registo de rollback para cada lote de redirecionamentos.

## Estado

- Documento de planeamento apenas.
- Nenhum redirect foi aplicado.
- Nenhuma URL histórica foi removida ou desindexada.
- Nenhuma alteração foi feita ao domínio ou publisher de produção.
- A execução depende da validação de equivalência e dos testes de produção.


## Atualização — evidência Search Console de 15 de novembro de 2026

Fonte: exportação do Google Search Console recebida em 15/11/2026, filtro **Pesquisa Web**, período **21/08/2026–13/11/2026**. Os valores abaixo são os que constam nos CSV exportados; não representam uma leitura live da propriedade.

### Desempenho orgânico

- Total do gráfico: **59 cliques**, **406 impressões**; CTR global calculada: **14,53%**.
- Principais países: Angola 52 cliques / 281 impressões; Namíbia 5 / 31; Brasil 1 / 9; Emirados Árabes Unidos 1 / 4.
- Dispositivos: telemóvel 35 cliques / 194 impressões; computador 24 / 212.
- Consultas exportadas: destaque para a marca `hmatias` (3 cliques / 4 impressões); oportunidade não-branded `civil condition assessment angola` (14 impressões, posição 7,71) e `empresas em viana` (8 impressões, posição 8,38).
- A exportação contém apenas as principais linhas de cada dimensão; a ausência de uma URL ou consulta nesta lista não prova ausência de impressões.

### Páginas com maior exposição e decisão de destino candidata

| URL histórica observada no GSC | Cliques | Impressões | Destino candidato no preview | Decisão / ressalva |
|---|---:|---:|---|---|
| `/` | 43 | 207 | `/` | Preservar homepage e identidade aprovada |
| `/construcao.html` | 3 | 82 | `/construcao/` | Equivalência editorial a validar |
| `/en.html` | 3 | 32 | `/en/` | Equivalência editorial a validar |
| `/credibilidade.html` | 2 | 63 | `/credibilidade/` | Preservar conteúdo institucional e dados legais |
| `/facilities.html` | 2 | 47 | `/facilities/` | Equivalência editorial a validar |
| `/business-services.html` | 2 | 20 | `/business-services/` | Equivalência editorial a validar |
| `/work-catalogue.html` | 2 | 17 | `/catalogo-obras/` | Confirmar equivalência do catálogo e das referências |
| `/termos.html` | 1 | 37 | `/termos/` | Rever conteúdo legal e canonical |
| `/servicos-administrativos.html` | 1 | 28 | **Manter URL oficial** | Contém âncora/formulário operacional Business Services; não redirecionar sem equivalência funcional |
| `/terms.html` | 1 | 12 | `/en/terms/` | Rever conteúdo legal EN |
| `/construction.html` | 0 | 42 | `/en/construction/` | Equivalência editorial a validar |
| `/supply.html` | 0 | 40 | `/supply/` | Prioridade de CTR/conteúdo; 40 impressões sem clique |
| `/credibility.html` | 0 | 27 | `/en/credibility/` | Rever hreflang e conteúdo EN |
| `/supply-en.html` | 0 | 24 | `/en/supply/` | Prioridade de CTR/conteúdo; 24 impressões sem clique |
| `/source-ao/index.html` | 0 | 22 | `/source-ao/` | Canonical histórico conflitante; não redirecionar até reconciliação |
| `/clean-en.html` | 0 | 21 | `/en/clean/` | Preservar catálogo/referências e pedido multiartigo |
| `/privacy.html` | 0 | 16 | `/en/privacy/` | Rever conteúdo legal EN |
| `/karta-en.html` | 0 | 13 | `/en/karta/` | Preservar identidade e estado Alpha |
| `/catalogo-obras.html` | 0 | 13 | `/catalogo-obras/` | Verificar conteúdo e fotografias |
| `/facilities-en.html` | 0 | 12 | `/en/facilities/` | Equivalência editorial a validar |
| `/source-ao/` | 0 | 9 | `/source-ao/` | Reconciliar com `/source-ao/index.html` |
| `/karta.html` | 0 | 8 | `/karta/` | Preservar identidade e estado Alpha |
| `/clean.html` | 0 | 4 | `/clean/` | Preservar catálogo/referências e pedido multiartigo |
| `/estaleiro-integrado.html` | 0 | 3 | `/estaleiro/` | Não migrar sem preservar ressalvas de projeto em desenvolvimento e plantas |
| `/privacidade.html` | 0 | 1 | `/privacidade/` | Rever conteúdo legal PT |
| `/limpeza-pos-obra.html` | 0 | 1 | `/limpeza-pos-obra/` | Preservar escopo e condições específicos |
| `/coberturas-industriais.html` | 0 | 1 | `/coberturas-industriais/` | Preservar conteúdo técnico específico |
| `/remodelacao-de-escritorios.html` | 0 | 1 | `/remodelacao-de-escritorios/` | Preservar conteúdo e intenção específicos |

**Importante:** “Destino candidato” é correspondência de trabalho entre URL antiga e rota existente no preview; não é autorização nem instrução para aplicar redirect. A exportação GSC não contém backlinks, estado atual de indexação por URL, nem prova de equivalência funcional.

### Prioridades SEO derivadas dos dados

1. **Supply PT/EN:** 40 e 24 impressões, respectivamente, sem cliques. Rever title, description, intenção de pesquisa e conteúdo de procurement/sourcing.
2. **Construção PT:** 82 impressões, 3 cliques, CTR 3,66%; rever snippet e alinhamento com consultas de construção em Angola.
3. **Credibilidade PT/EN:** 63 e 27 impressões, CTR baixa/zero; melhorar a apresentação do resultado sem alterar factos institucionais.
4. **Facilities PT/EN:** exposição relevante (47 e 12 impressões); rever snippets e conteúdo comercial.
5. **SOURCE AO:** manter separadas a página institucional, a rota de RFQ operacional e a página demonstrativa do preview. A exportação mostra `/source-ao/index.html` e `/source-ao/`; o histórico de 12/10/2026 já registava divergência entre canonical declarado e canonical escolhido pelo Google.

### Pesquisa generativa

O relatório separado “Performance on Search Generative AI Features” apresenta o filtro **Web, últimos 3 meses, computador** e **69 impressões** no gráfico. Não apresenta cliques nem consultas. A tabela por página lista 18 URLs e soma 104 impressões, pelo que os valores dessa dimensão não devem ser somados nem tratados como o total do gráfico. A evidência confirma exposição em funcionalidades de pesquisa generativa, não tráfego, leads ou recomendações atribuídas à IA.

### Próxima verificação obrigatória

Antes de qualquer alteração de indexação ou redirect, obter leitura atual do GSC por URL (indexação, canonical escolhido pelo Google, último rastreio), verificar backlinks e testar HTTP/destino/formulários no domínio oficial. Os 11 pedidos de indexação aceites em 12/10/2026 não devem ser repetidos sem esta verificação.
