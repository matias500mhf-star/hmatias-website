# Auditoria editorial da HMATIAS — 11 de novembro de 2026

## Âmbito

Revisão editorial da pré-visualização Astro, comparada com o website oficial público e com a estrutura de URLs existente. O trabalho incide sobre 28 rotas geradas: 14 em português e 14 em inglês.

A homepage foi preservada sem alterações nesta revisão. Não foram eliminadas rotas, páginas antigas, formulários ou funcionalidades do website oficial. O protótipo continua isolado, com `noindex,nofollow`, e não substitui o domínio oficial.

## Critério editorial

- Manter factos empresariais, identificação legal, contactos, serviços, especificações úteis e evidência de trabalhos.
- Remover slogans, justificações institucionais, mensagens promocionais e etapas repetidas quando não acrescentam informação verificável.
- Substituir texto processual genérico por informação que ajude o visitante a preparar um pedido ou compreender o serviço.
- Manter as versões PT e EN equivalentes em significado, com redacção natural em cada língua.
- Não inventar stock, certificações, projectos, resultados, prazos, clientes ou capacidades não confirmadas.

## Resultado do levantamento

- 28 rotas revistas: 14 PT + 14 EN.
- 18 páginas (9 pares PT/EN) receberam alterações editoriais.
- 10 páginas (5 pares PT/EN) foram mantidas nesta ronda por conterem informação funcional, legal ou editorial que não deve ser reduzida sem validação adicional.
- O diff técnico dos 16 ficheiros de páginas apresenta 213 linhas removidas e 69 adicionadas. Este número é uma contagem de linhas de código/conteúdo, não uma contagem de parágrafos genéricos nem de palavras eliminadas.

## Alterações efectuadas

| Par de páginas | Decisão editorial |
|---|---|
| Sobre a HMATIAS / About HMATIAS | Removidos missão, visão, cinco valores genéricos e mensagem atribuída à direcção. Mantida a apresentação factual, as quatro áreas de serviço e a identificação empresarial. |
| Construção / Construction | Removida a secção processual repetitiva. Mantidos âmbito de trabalho, registos fotográficos e informação concreta para iniciar uma avaliação. |
| Facilities / Facilities | Removida a secção processual repetitiva. Mantidos serviços, intervenções documentadas e dados necessários para avaliar instalações, áreas e frequência. |
| Supply / Supply | Consolidada a explicação sobre sourcing sob consulta; removida a repetição do processo em quatro passos. Mantidos os limites de stock, categorias, requisitos técnicos, perguntas frequentes e Smart RFQ. |
| Business Services / Business Services | Substituída a sequência genérica de três passos por uma lista prática: serviço, informação de origem, volume/formato e prazo/prioridade. |
| Credibilidade / Credibility | Reduzida a introdução institucional e clarificada a função da página: identificação legal, contactos oficiais e condições gerais. Quatro mensagens genéricas foram consolidadas em três condições operacionais. |
| Catálogo de Obras / Works Catalogue | Removida a explicação repetida sobre o arquivo fotográfico; mantidas as descrições das imagens e a nota sobre divulgação autorizada e limites probatórios do catálogo. |
| Blog / Blog | Retirados cartões de temas editoriais sem artigos associados; títulos, descrições e metadados foram alinhados com o guia realmente publicado sobre pedidos de cotação e fornecimento. |
| Smart RFQ / Smart RFQ | Reduzida a repetição entre introdução e etapas; mantidas as instruções de submissão, dados necessários e distinção entre registo e cotação/adjudicação. |

## Páginas mantidas após revisão

- Homepage PT e EN: preservadas por decisão expressa; sem alterações nesta ronda.
- Política de Privacidade / Privacy Policy: mantida por conter informação material sobre dados, formulários, consentimento, cookies, analytics e canais externos. A nota de pré-visualização distingue a política do site oficial das integrações ainda não migradas para o protótipo.
- Termos e Condições / Terms and Conditions: mantidos por explicarem pedidos, fornecimentos, transporte, pagamento e propriedade intelectual.
- Acessibilidade / Accessibility: mantida com declaração transparente de que a versão está em avaliação e não reivindica conformidade independente ainda não auditada.
- Artigo técnico bilingue do Blog: mantido por apresentar orientação prática sobre especificações, quantidades, entrega, documentação e comparação de cotações. As páginas de entrada do Blog foram simplificadas e alinhadas com esse conteúdo.

## Integridade e verificações

- O mapa de preservação de URLs existente continua aplicável; nenhuma rota antiga foi eliminada ou redireccionada nesta revisão.
- As funcionalidades operacionais continuam ligadas ao website oficial quando indicado; o protótipo não declara que os formulários e integrações já foram migrados.
- O workflow de qualidade do SOURCE AO tinha verificações de texto desactualizadas para títulos de secções da página Supply. As verificações foram alinhadas com os títulos efectivamente publicados: “PEDIDOS DE FORNECIMENTO” e “SUPPLY REQUESTS”.
- A revisão de conteúdo não substitui testes funcionais, testes de acessibilidade, testes responsivos ou validação de integrações.

## Trabalho ainda necessário antes de qualquer publicação

1. Confirmar o último deploy de pré-visualização e executar a verificação integral das 28 rotas.
2. Executar Playwright em desktop, tablet e mobile, incluindo navegação, links de idioma e formulários que apontam para o domínio oficial.
3. Executar axe/Lighthouse e corrigir problemas encontrados; não declarar conformidade WCAG sem evidência.
4. Verificar manualmente imagens, cortes, contraste, foco, menu móvel, rodapé, títulos e alinhamento PT/EN.
5. Validar separadamente as integrações operacionais (RFQ, tracking, contacto, agendamento, analytics e consentimento).
6. Aprovar o mapa final de URLs, canonical, hreflang e eventuais redireccionamentos.
7. Obter autorização explícita antes de merge, publicação, DNS ou substituição do website oficial.

## Estado

Revisão editorial aplicada na branch isolada `feat/hmatias-platform-modernization-20261111`. O website oficial e o domínio de produção não foram alterados.
