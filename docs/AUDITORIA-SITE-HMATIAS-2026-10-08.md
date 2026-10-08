# HMATIAS — Auditoria editorial e funcional do website
**Data:** 08/10/2026  
**Âmbito:** site institucional PT/EN, área de serviços, páginas legais, portefólio, Smart RFQ, atendimento, KARTA e interfaces públicas de SOURCE AO.

## Diretrizes mantidas
- Quatro áreas principais: Construção; Facilities & Manutenção; Supply & Procurement; Business Services.
- HMATIAS Clean é oferta integrada em Facilities, não uma quinta divisão.
- Não apresentar os futuros espaços administrativo/comercial como já inaugurados.
- Conservar testemunhos visuais de trabalhos realmente realizados, parceiros identificados e documentos legais.
- Catálogos PDF em nova aba, sem pré-carregar grandes documentos.
- Preço, stock, prazos, certificados e especificações só após validação comercial.
- Fonte de contacto geral: geral@comercialhmatiasps.com.

## Páginas verificadas ponto a ponto
| Conjunto | Ficheiros | Verificações / ação |
|---|---|---|
| Home institucional | index.html; en.html | 4 áreas, projetos, Miliart, navegação, formulário, SEO, assistente |
| Construção | construcao.html; construction.html | Terminologia de execução, ligação às obras, CTAs e PT/EN |
| Facilities | facilities.html; facilities-en.html | HMATIAS Clean dentro de Facilities; imagens e acesso ao catálogo |
| Supply | supply.html; supply-en.html | Catálogo em PDF separado; RFQ dinâmico; sem promessa de stock |
| Business Services | servicos-administrativos.html; business-services.html | **Retirados todos os valores públicos** dos seis serviços; CTA único de orçamento; apoio consular delimitado |
| HMATIAS Clean | clean.html; clean-en.html | Produtos, carrinho e PDF; preço/stock sob consulta; fotografia Taurus restaurada |
| Agendamentos | agendamento.html; booking.html | Pedido de horário sujeito a confirmação, sem confusão com marcações consulares; terminologia melhorada |
| Catálogo de obras | catalogo-obras.html; work-catalogue.html | Trabalhos e navegação preservados |
| Informação institucional | credibilidade.html; credibility.html | Dados legais; rodapés coerentes com as quatro áreas |
| KARTA | karta.html; karta-en.html | Identificação como produto em desenvolvimento, navegação coerente |
| Smart RFQ | rfq.html; rfq-en.html | Pedidos estruturados, rotas e assistente atualizado |
| Privacidade e termos | privacidade.html; privacy.html; termos.html; terms.html | Links locais e metadados analisados; texto jurídico mantido sem alterações não solicitadas |
| Páginas antigas/redireções | 404.html; hmatias-clean.html; hmatias-clean-en.html; politica-privacidade.html; termos-condicoes.html; procura.html | Ligações de redirecionamento e noindex verificados, sem eliminar rotas antigas |
| SOURCE AO público/operacional | source-ao/index.html; confirm.html; opportunity-radar.html; ops.html; partner-application.html; privacy.html; requests.html; review.html; rfq.html; terms.html; track.html | Links estáticos internos, metadados e natureza pública/privada das páginas verificados |
| Outras páginas | booking.html e agendamento.html incluídos acima | 43 ficheiros HTML examinados no total |

## Correções efetuadas nesta intervenção
1. Páginas Business Services: eliminar valores «Desde X Kz» e reformular título «Serviços e Valores»/«Services and Pricing». Preservar as seis descrições, sem repetir seis botões de cotação; uma única ação junto à lista e outra na secção consular.
2. Preservar âncoras legadas `#valores` e `#pricing` como aliases invisíveis, atualizando a âncora semântica da secção.
3. Estilo responsivo dos serviços sem coluna de preço e CTA final adaptável ao telemóvel.
4. Assistente oficial (`assistant.js` e `assistant-knowledge.js`): eliminar tarifas antigas de Business Services e Taurus Pine Gel; passar a orientar para propostas comerciais. Corrigir descrição das quatro áreas principais e atualizar versão de cache nas páginas que carregam o assistente.
5. Rodapés de agendamento, catálogo de obras, KARTA e informação institucional: HMATIAS Clean deixa de figurar como área principal, Business Services mantém-se como tal.
6. Ajustar a linguagem das páginas de agendamento para títulos objetivos em PT/EN.

## Validação feita
- Inspeção estática dos **43 ficheiros HTML** do repositório principal, incluindo links locais, recursos, âncoras presentes no HTML, idioma, título, H1, canonical e robots quando aplicável.
- Não foram encontrados recursos locais inexistentes nas páginas inspecionadas (excluindo falsos positivos de auditoria em ancoragens injetadas pelo formulário JavaScript na Supply).
- Páginas privadas/noindex do SOURCE AO podem legitimamente não possuir canonical.
- JavaScript do assistente e da base de conhecimento passou validação sintática.
- Revisão das alterações de Business Services, sem valores monetários e com formulários preservados.
- Esta validação de código **não equivale a verificação visual em navegadores móveis reais**, teste end-to-end dos serviços API nem confirmação do conteúdo servido no domínio após deploy.

## Riscos e trabalhos futuros (não ocultar)
- A fotografia **123 Pine Gel** depende provisoriamente de fonte externa; garantir cópia autorizada e íntegra alojada pelo site.
- Conteúdos técnicos de produtos dependem de fichas do fabricante e validação comercial da referência.
- O PDF comercial resumido da linha EPI/Fardamento não substitui integralmente o catálogo técnico original.
- Testar o formulário de leads e o SOURCE AO ponta a ponta com acesso ao ambiente produtivo, sem expor dados confidenciais.
- Revalidar no domínio após publicação e confirmar as fotografias do Pine Gel em browsers reais (desktop e telemóvel).
