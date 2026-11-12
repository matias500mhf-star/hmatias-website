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
| `/estaleiro-integrado.html`, `/integrated-yard.html` | Apresentação de projeto em desenvolvimento, com alternativas de implantação | Manter como projeto em desenvolvimento | Não classificar como obra executada; migrar preservando o estado preliminar, as ressalvas técnicas e as plantas aprovadas para divulgação |

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
